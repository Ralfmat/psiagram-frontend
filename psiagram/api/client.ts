import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";


interface SessionData {
  access: string;
  refresh: string;
  access_expiration: string;
  refresh_expiration: string;
  user?: any;
}

const apiUrl = "http://psiagram-env.eba-padhbqfj.eu-central-1.elasticbeanstalk.com";

// Zmienne do komunikacji z Contextem
let logoutCallback: (() => void) | null = null;
let refreshCallback: ((newSessionJson: string) => void) | null = null;

// Rejestracja callbacków z ctx.tsx
export const registerAuthCallbacks = (
  onLogout: () => void,
  onTokenRefresh: (newSessionJson: string) => void
) => {
  logoutCallback = onLogout;
  refreshCallback = onTokenRefresh;
};

const client = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Pomocnicza funkcja do pobierania sesji
async function getSessionFromStorage(): Promise<SessionData | null> {
  try {
    let sessionJson: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        sessionJson = localStorage.getItem("session");
      }
    } else {
      sessionJson = await SecureStore.getItemAsync("session");
    }

    if (sessionJson) {
      return JSON.parse(sessionJson) as SessionData;
    }
  } catch (e) {
    console.error("Error parsing session:", e);
  }
  return null;
}

// Pomocnicza funkcja do sprawdzania czy token wygasł (lub wygaśnie za chwilę)
function isTokenExpired(expirationIso: string): boolean {
  const expirationDate = new Date(expirationIso);
  const now = new Date();
  // Bufor bezpieczeństwa: uznajemy za wygasły, jeśli zostało mniej niż 60 sekund
  return now.getTime() + 60 * 1000 > expirationDate.getTime();
}

// Funkcja odświeżająca token (wyodrębniona, bo używana w obu interceptorach)
async function refreshAuthToken(refreshToken: string): Promise<SessionData | null> {
  try {
    const response = await axios.post(`${apiUrl}api/auth/token/refresh/`, {
      refresh: refreshToken,
    });

    // Backend zwraca nową strukturę: access, refresh, expirations
    const newSessionData: SessionData = response.data;

    // Aktualizujemy stan w React (i storage przez hooka w ctx)
    if (refreshCallback) {
      refreshCallback(JSON.stringify(newSessionData));
    }
    
    return newSessionData;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}

// Request Interceptor
client.interceptors.request.use(
  async (config) => {
    // Nie dodajemy tokena do zapytań logowania/rejestracji, żeby uniknąć pętli
    if (config.url?.includes("/login") || config.url?.includes("/register")) {
      return config;
    }

    let session = await getSessionFromStorage();

    if (session && session.access && session.access_expiration) {
      // 1. Sprawdź czy Access Token wygasł
      if (isTokenExpired(session.access_expiration)) {
        console.log("Access token expired or close to expiration. Refreshing...");

        // 2. Sprawdź czy Refresh Token jest wciąż ważny (jeśli mamy jego datę)
        if (session.refresh_expiration && isTokenExpired(session.refresh_expiration)) {
             console.log("Refresh token also expired. Logging out.");
             if (logoutCallback) logoutCallback();
             throw new axios.Cancel("Session expired");
        }

        // 3. Próba odświeżenia
        const newSession = await refreshAuthToken(session.refresh);
        if (newSession) {
          session = newSession; // Użyj nowych danych
        } else {
          // Jeśli odświeżanie się nie udało (np. refresh token unieważniony)
          if (logoutCallback) logoutCallback();
          throw new axios.Cancel("Token refresh failed");
        }
      }

      // Dodaj (potencjalnie nowy) token do nagłówka
      config.headers.Authorization = `Bearer ${session.access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Fallback na 401)
// Nadal warto to trzymać na wypadek, gdyby czas na urządzeniu był źle ustawiony
// lub token został unieważniony po stronie serwera przed czasem.
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const session = await getSessionFromStorage();
      
      if (session && session.refresh) {
         const newSession = await refreshAuthToken(session.refresh);
         
         if (newSession) {
             processQueue(null, newSession.access);
             isRefreshing = false;
             originalRequest.headers.Authorization = `Bearer ${newSession.access}`;
             return client(originalRequest);
         }
      }

      // Jeśli dotarliśmy tutaj, odświeżanie się nie powiodło
      processQueue(error, null);
      isRefreshing = false;
      if (logoutCallback) logoutCallback();
    }

    return Promise.reject(error);
  }
);

export default client;