import React from "react";
import { useStorageState } from "../hooks/useStorageState";
import client from "../api/client";
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
  const [[isLoading, session], setSession] = useStorageState("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: async (email, password) => {
          try {
            const response = await client.post("/api/auth/login/", {
              email,
              password,
            });

            const token = response.data.access; 
            
            if (token) {
              setSession(token);
            } else {
              Alert.alert("Login Error", "No token received from server.");
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