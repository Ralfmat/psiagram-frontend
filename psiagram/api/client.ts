import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// UWAGA: W React Native na Androidzie 'localhost' nie zadziała.
// Trzeba użyć swojego adresu IP z sieci lokalnej (np. 192.168.x.x)
// lub specjalnego adresu dla emulatora Androida: 'http://10.0.2.2:8000/api/v1/'
// na razie używamy localhost dla testów na web
const apiUrl = "http://127.0.0.1:8000/";

const client = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// (Request Interceptor)
client.interceptors.request.use(
  async (config) => {
    try {
      let token: string | null = null;

      // Token logic must be consistent with how you store it in useStorageState.ts
      // The session key in context/ctx.tsx is "session"
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          token = localStorage.getItem("session");
        }
      } else {
        token = await SecureStore.getItemAsync("session");
      }

      // If token exists, add it to the header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from interceptor:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// (Response Interceptor)
// handle token expiration or unauthorized responses globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Here we can add logic to log out the user or refresh the token
      console.log("Token is missing or expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

export default client;
