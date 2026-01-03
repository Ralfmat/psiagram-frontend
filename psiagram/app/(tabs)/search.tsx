import { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, Pressable, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length > 1) {
      const search = async () => {
        try {
          const res = await client.get(`api/profiles/search/?search=${query}`);
          setResults(res.data);
        } catch (e) {
          console.error(e);
        }
      };
      const timeout = setTimeout(search, 500);
      return () => clearTimeout(timeout);
    } else {
        setResults([]);
    }
  }, [query]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#69324C" />
        <TextInput 
            style={styles.input} 
            placeholder="search users..." 
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.resultItem} 
            onPress={() => router.push(`/user/${item.user.id}`)}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{item.user.email}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#FAF7F0", paddingTop: 50 },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E9E3D8", margin: 18, padding: 10, borderRadius: 10 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    resultItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#E9E3D8" },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#ccc" },
    username: { fontSize: 16, color: "#1E1E1E" }
});