import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function LoginScreen() {
    const handleLogin = () => {
    // tu musi być logowanie 
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
