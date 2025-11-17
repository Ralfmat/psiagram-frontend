import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function VerifyCodeScreen() {
  const handleVerify = () => {
    // tu weryfikacja kodu
    router.push("/(auth)/resetPassword");
  };

  return (
    <View>
      <Text>Enter verification code</Text>
      <Button title="Confirm code" onPress={handleVerify} />
    </View>
  );
}
