import { useSession } from "@/context/ctx";
import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function LoginScreen() {
  const { signIn } = useSession();

  const handleLogin = () => {
    // signIn function saves token in app memory
    // useEffect in _layout.tsx recognize status change
    // user is transfered to (tabs)
    signIn();
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
      <Text>Login</Text>

      <Button title="Log in" onPress={handleLogin} />

      <Button title="Forgot password?" onPress={() => router.push("/(auth)/forgotPassword")} />

      <Button title="Don't have an account? Sign up" onPress={() => router.push("/(auth)/register")} />
    </View>
  );
}
