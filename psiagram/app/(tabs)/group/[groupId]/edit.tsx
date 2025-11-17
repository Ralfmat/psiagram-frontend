import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

export default function EditGroupScreen() {
  const { groupId } = useLocalSearchParams();

  return <Text>Edit group: {groupId}</Text>;
}
