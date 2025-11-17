import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,  
          }}
    >
      <Stack.Screen name="index" />          
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="verifyCode" />
      <Stack.Screen name="resetPassword" />
      <Stack.Screen name="resetSuccess" />
    </Stack>
  );
}
