import { Text, View, Button } from "react-native";
import { useState } from "react";
import client from "@/api/client";

export default function FeedScreen() {
  const [data, setData] = useState<string>("");

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
      <Text>{data}</Text>
    </View>
  );
}