import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function RegisterScreen() {
  const handleRegister = () => {
    // tu trzeba rejestracje zrobić 
    router.replace("/(tabs)/feed"); 
  };

  return (
    <View>
      <Text>Register</Text>
      <Button title="Create account" onPress={handleRegister} />

      <Button
        title="Already have an account? Log in"
        onPress={() => router.push("/(auth)/login")}
      />
    </View>
  );
}
