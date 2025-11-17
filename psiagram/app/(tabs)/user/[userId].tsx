import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();

  return (
    <View>
      <Text>USER PROFILE – userId: {userId}</Text>
    </View>
  );
}
