import { Redirect, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

function AuthGate() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;   //feed
  }
  
  return <Redirect href="/(auth)/login" />;    //logowanie
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
