import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function GroupPostsScreen() {
  const { groupId } = useLocalSearchParams();

  return (
    <View>
      <Text>GROUP POSTS – groupId: {groupId}</Text>
    </View>
  );
}
