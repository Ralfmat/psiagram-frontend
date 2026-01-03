import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import client from "../../../../api/client";

interface Member {
  id: number;
  username: string;
  avatar: string | null;
  is_admin: boolean;
  is_following: boolean;
}

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const id = Array.isArray(groupId) ? groupId[0] : groupId;

  useEffect(() => {
    // 1. Fetch Current User ID
    client.get("/users/me/")
      .then(res => {
        setCurrentUserId(res.data.id);
      })
      .catch(e => console.error("Failed to fetch current user:", e));

    // 2. Fetch Group Members
    if (id) fetchGroupMembers();
  }, [id]);

  const fetchGroupMembers = async () => {
    try {
      const res = await client.get(`/api/groups/${id}/`);
      // Fallback to empty array if members_details is undefined
      setMembers(res.data.members_details || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load members.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = (members || []).filter((m) =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMember = ({ item }: { item: Member }) => {
    const isMe = item.id === currentUserId;

    return (
      <TouchableOpacity 
        style={styles.memberRow} 
        onPress={() => router.push(`/user/${item.id}`)}
      >
        <View style={styles.memberInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View>
            <Text style={styles.memberName}>
              {item.username} 
              {item.is_admin && <Text style={styles.adminBadge}> (Admin)</Text>}
              {isMe && <Text style={styles.meBadge}> (You)</Text>}
              {!isMe && item.is_following && <Text style={styles.meBadge}> (Following)</Text>}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#69324C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/group/${id}/info`)}>
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {/* Search Bar matching EditGroup style */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No members found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAF7F0" // Matched screen background
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E1E1E" },
  
  container: { flex: 1, padding: 20 },

  // Updated Search Box to match EditGroup
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: "#F9F9F9", 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: "#EEE" 
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  
  listContent: { paddingBottom: 20 },

  // Updated Member Row to match EditGroup
  memberRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderColor: "#F0F0F0" 
  },
  memberInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    flex: 1 
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: "#DDD" 
  },
  
  memberName: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  
  // Badges
  adminBadge: { color: "#69324C", fontWeight: "bold", fontSize: 12 },
  meBadge: { color: "#999", fontStyle: "italic", fontSize: 12 },

  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 10, fontStyle: 'italic' },
});