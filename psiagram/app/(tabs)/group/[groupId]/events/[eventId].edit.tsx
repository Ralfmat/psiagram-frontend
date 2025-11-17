import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function EventEditScreen() {
  const { groupId, eventId } = useLocalSearchParams();

  return (
    <View>
      <Text>EDIT EVENT</Text>
      <Text>groupId: {groupId}</Text>
      <Text>eventId: {eventId}</Text>
    </View>
  );
}
