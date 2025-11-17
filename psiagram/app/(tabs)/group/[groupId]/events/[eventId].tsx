import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function EventDetailsScreen() {
  const { groupId, eventId } = useLocalSearchParams();

  return (
    <View>
      <Text>EVENT DETAILS</Text>
      <Text>groupId: {groupId}</Text>
      <Text>eventId: {eventId}</Text>
    </View>
  );
}
