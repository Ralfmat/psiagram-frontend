import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function GroupEventsListScreen() {
  const { groupId } = useLocalSearchParams();

  return (
    <View>
      <Text>EVENTS LIST – groupId: {groupId}</Text>
    </View>
  );
}
