import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ResetSuccessScreen() {
  return (
    <View>
      <Text>Password has been reset</Text>

      <Button
        title="Back to login"
        onPress={() => router.replace("/(auth)/login")}
      />
    </View>
  );
}
