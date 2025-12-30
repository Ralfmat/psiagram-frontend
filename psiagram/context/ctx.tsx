import React, { useEffect } from "react";
import { useStorageState } from "../hooks/useStorageState";
import client, { registerAuthCallbacks } from "../api/client";
import { Alert } from "react-native";

const AuthContext = React.createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signOut: () => {},
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = React.useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }
  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  // session tutaj jest teraz stringiem JSON zawierającym tokeny i daty
  const [[isLoading, session], setSession] = useStorageState("session");

  useEffect(() => {
    // Rejestrujemy callbacki, aby interceptory axios mogły sterować sesją
    registerAuthCallbacks(
      () => {
        // onLogout
        setSession(null); 
      },
      (newSessionJson) => {
        // onTokenRefresh - aktualizuje storage i stan React
        setSession(newSessionJson); 
      }
    );
  }, [setSession]);

  return (
    <AuthContext.Provider
      value={{
        signIn: async (email, password) => {
          try {
            const response = await client.post("/api/auth/login/", {
              email,
              password,
            });

            const data = response.data;
            
            // Sprawdzamy czy mamy wymagane pola w odpowiedzi
            if (data.access && data.refresh) {
              // Zapisujemy całą odpowiedź (tokeny + expiration + user) jako JSON
              // Dzięki temu client.ts będzie miał dostęp do access_expiration
              setSession(JSON.stringify(data));
            } else {
              Alert.alert("Login Error", "Invalid response from server.");
            }
          } catch (error: any) {
            console.error("Login failed:", error);
            const msg = error.response?.data?.detail || "Invalid credentials or server error.";
            Alert.alert("Login Failed", msg);
            throw error;
          }
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}