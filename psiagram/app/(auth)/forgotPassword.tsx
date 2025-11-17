import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ForgotPasswordScreen() {
  const handleSubmitEmail = () => {
    // tu wysylanie maila 
    router.push("/(auth)/verifyCode");
  };

  return (
    <View>
      <Text>Forgot password</Text>
      <Button title="Send reset code" onPress={handleSubmitEmail} />
    </View>
  );
}
