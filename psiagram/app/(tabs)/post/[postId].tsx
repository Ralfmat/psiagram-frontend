import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function PostDetailsScreen() {
  const { postId } = useLocalSearchParams();

  return (
    <View>
      <Text>POST DETAILS – postId: {postId}</Text>
    </View>
  );
}
