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
      <Image 
        source={{ uri: item.group_picture ?? "https://via.placeholder.com/400x200" }} 
        style={styles.coverImage} 
      />
      <View style={styles.cardContent}>
        <View style={styles.groupHeaderRow}>
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
        
        </View>
      </View>


      {/* <Ionicons name="chevron-forward" size={20} color="#ccc" /> */}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>your groups</Text>
      
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/group/createGroup")}>
            <Ionicons name="add" size={28} color="black" />
          </TouchableOpacity>
        </View>

      </View>

      {/*ta czesc narazie zostawie bo jest cool wyszukiwanie ale moze byc do zmiany ewentualnie */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="search groups..."
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
        // ListHeaderComponent={
        //   <Text style={styles.sectionTitle}>
        //     {searchQuery ? "Search Results" : "My Groups"}
        //   </Text>
        // }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator color="#69324C" />
            ) : (
              <Text style={styles.emptyText}>
                {searchQuery ? "no groups found." : "you haven't joined any groups yet."}
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },
  headerCenter:{
    flex:1,
    alignItems: "center",
  },
  headerRight:{
    position:"absolute",
    right:15
  },
  title: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E",textTransform: 'lowercase', textAlign:"center" },
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
    backgroundColor: "#fff",
    
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow:"hidden"
  },
  coverImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E9E3D8",
  },
  cardContent: {
    paddingHorizontal: 15,
    backgroundColor: "#FAF7F0",
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end", 
    marginTop: -40, 
    marginBottom: 10,
  },
  groupIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "#E9E3D8",
    borderWidth: 3,
    borderColor: "#FAF7F0", 
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  groupImage: {
      width: "100%",
      height: "100%"
  },

  groupDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
    marginTop: 5,
  },
  groupInfo: { flex: 1, marginLeft: 12,paddingBottom: 5,},
  groupName: { fontSize: 20, fontWeight: "bold", color: "#1E1E1E" },
  groupMembers: { fontSize: 13, color: "#666" },
  emptyContainer: { padding: 20, alignItems: "center" },
  emptyText: { color: "#999", fontStyle: "italic" },
});