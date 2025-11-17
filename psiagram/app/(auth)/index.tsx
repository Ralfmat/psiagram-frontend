import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function StartScreen() {
  return (
    <View>
      <Text>tutaj logo i gif z pieskiem </Text>
      <Button title="Get started" onPress={() => router.push("/(auth)/login")} />
    </View>
  );
}
