import { Button, Text, View } from "react-native";
import { useSession } from "../../context/ctx";

export default function MyProfileScreen() {
  const { signOut } = useSession();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 20 }}>Mój Profil</Text>

      <Button
        title="Wyloguj się"
        color="red"
        onPress={() => {
          signOut();
          // signOut clears token from memory
          // useEffect from _layout.tsx should kick us out to /login
        }}
      />
    </View>
  );
}
