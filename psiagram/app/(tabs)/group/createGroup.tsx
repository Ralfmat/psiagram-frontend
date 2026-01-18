import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import client from "../../../api/client";
import { Ionicons } from "@expo/vector-icons";
export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("error", "group name is required.");
      return;
    }

    setCreating(true);
    try {
      await client.post("/api/groups/", {
        name,
        description,
      });
      Alert.alert("success", "group created!");
      router.back();
    } catch (e: any) {
      console.error("create group error:", e);
      Alert.alert("error", "failed to create group. name might be taken.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </Pressable>  
        </View>
      <Text style={styles.title}>Create New Group</Text>  
      </View>

      <View style={styles.container}>

        
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Golden Retrievers Lovers"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group about?"
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.btn, creating && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#FAF7F0" />
          ) : (
            <Text style={styles.btnText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  container: { padding: 20 },
  title: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E",textTransform: 'lowercase', textAlign:"center" },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5F7751",
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  btn: {
    backgroundColor: "#69324C",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    color: "#FAF7F0",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: 'lowercase',
  },

  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },
  headerRight:{
    position:"absolute",
    left:15
  },
});