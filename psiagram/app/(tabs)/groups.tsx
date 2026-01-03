import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../api/client";

interface Group {
  id: number;
  name: string;
  description: string;
  members_count: number;
  group_picture: string | null;
  is_member: boolean;
}

export default function GroupsScreen() {
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyGroups = async () => {
    try {
      const res = await client.get("/api/groups/my_groups/");
      setMyGroups(res.data);
    } catch (e) {
      console.error("Fetch my groups error:", e);
    }
  };

  const searchGroups = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await client.get("/api/groups/", {
        params: { search: query },
      });
      setSearchResults(res.data);
    } catch (e) {
      console.error("Search groups error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyGroups();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyGroups();
    if (searchQuery) await searchGroups(searchQuery);
    setRefreshing(false);
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <Pressable
      style={styles.groupCard}
      onPress={() => router.push(`/(tabs)/group/${item.id}/posts`)}
    >
      <View style={styles.groupIcon}>
        {item.group_picture ? (
            <Image source={{ uri: item.group_picture }} style={styles.groupImage} />
        ) : (
            <Ionicons name="people" size={24} color="#69324C" />
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMembers}>{item.members_count} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/group/createGroup")}>
          <Ionicons name="add-circle-outline" size={28} color="#69324C" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search groups..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 2) searchGroups(text);
            else setSearchResults([]);
          }}
        />
      </View>

      <FlatList
        data={searchQuery ? searchResults : myGroups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroupItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {searchQuery ? "Search Results" : "My Groups"}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator color="#69324C" />
            ) : (
              <Text style={styles.emptyText}>
                {searchQuery ? "No groups found." : "You haven't joined any groups yet."}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1E1E1E" },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: { flex: 1, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5F7751",
    marginBottom: 10,
    marginTop: 10,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E9E3D8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden"
  },
  groupImage: {
      width: "100%",
      height: "100%"
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: "bold", color: "#1E1E1E" },
  groupMembers: { fontSize: 12, color: "#666" },
  emptyContainer: { padding: 20, alignItems: "center" },
  emptyText: { color: "#999", fontStyle: "italic" },
});