import { Button, Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";

export default function Feed() {
  const { logout, user } = useAuth();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Witaj, {user?.email}
      </Text>

      <Button title="test wylogowywania" onPress={logout} />
    </View>
  );
}
