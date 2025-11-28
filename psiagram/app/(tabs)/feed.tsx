import client from "@/api/client";
import { useSession } from "@/context/ctx";
import { useState } from "react";
import { Button, Text, View } from "react-native";


export default function FeedScreen() {
  const [data, setData] = useState<string>("");
  const { signOut } = useSession();


  const fetchData = async () => {
    try {
      const response = await client.get('test/'); 
      setData(JSON.stringify(response.data));
    } catch (error) {
      console.error(error);
      setData("Błąd pobierania danych");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Feed</Text>
      <Button title="Pobierz posty" onPress={fetchData} />
      <Button title="Wyloguj" onPress={signOut} />
      <Text>{data}</Text>
    </View>
  );
}