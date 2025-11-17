import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ResetPasswordScreen() {
  const handleReset = () => {
    // nowe hasło 
    router.replace("/(auth)/resetSuccess");
  };

  return (
    <View>
      <Text>Set new password</Text>
      <Button title="Save new password" onPress={handleReset} />
    </View>
  );
}
