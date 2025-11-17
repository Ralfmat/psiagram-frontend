import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function GroupInfoScreen() {
  const { groupId } = useLocalSearchParams();

  return (
    <View>
      <Text>GROUP INFO – groupId: {groupId}</Text>
    </View>
  );
}
