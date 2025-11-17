import { router } from "expo-router";
import { Button, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = async () => {
    //  logowanie „na sztywno” testowym userem
    // później zamiast tego weźmiesz email/hasło z inputów
    await login("test@example.com", "123456");

    // przejście na feed
    // (jak będzie pełne przekierowanie po isAuthenticated,
    // to ten replace można  usunąć i zostawić same redirecty)
    router.replace("/(tabs)/feed");
  };

  return (
    <View>
      <Text>Login</Text>

      <Button title="Log in" onPress={handleLogin} />

      <Button
        title="Forgot password?"
        onPress={() => router.push("/(auth)/forgotPassword")}
      />

      <Button
        title="Don't have an account? Sign up"
        onPress={() => router.push("/(auth)/register")}
      />
    </View>
  );
}
