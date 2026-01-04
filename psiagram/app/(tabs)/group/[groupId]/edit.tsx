import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import client from "../../../../api/client";

interface User {
  id: number;
  username: string;
  avatar: string | null;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  members_details: User[];
  admins: number[];
  is_admin: boolean;
}

// Sub-component for rendering member row with avatar fetch logic
const MemberRow = ({ 
  member, 
  isAdmin, 
  isCurrentUser, 
  onPromote, 
  onKick 
}: {
  member: User,
  isAdmin: boolean,
  isCurrentUser: boolean,
  onPromote: () => void,
  onKick: () => void
}) => {
  const [avatar, setAvatar] = useState<string | null>(member.avatar);

  useEffect(() => {
    // Fetch profile avatar if missing
    if (!avatar) {
      client.get(`/api/profiles/${member.id}/`)
        .then(res => {
          if (res.data?.avatar) {
            setAvatar(res.data.avatar);
          }
        })
        .catch(e => console.log(`Avatar fetch error for ${member.username}`, e));
    }
  }, [member.id]);

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberInfo}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View>
          <Text style={styles.memberName}>
            {member.username} 
            {isAdmin && <Text style={styles.adminBadge}> (Admin)</Text>}
            {isCurrentUser && <Text style={styles.meBadge}> (You)</Text>}
          </Text>
        </View>
      </View>
  
      {!isCurrentUser && (
        <View style={styles.rowActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.roleBtn]}
            onPress={onPromote}
          >
            <Ionicons 
              name={isAdmin ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} 
              size={20} 
              color="#5F7751" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.kickBtn]}
            onPress={onKick}
          >
            <Ionicons name="trash-outline" size={20} color="#cc0000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function EditGroupScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  
  const id = Array.isArray(groupId) ? groupId[0] : groupId;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client.get("/users/me/")
      .then(res => {
        setCurrentUserId(res.data.id);
      })
      .catch(e => console.error("Failed to fetch current user:", e));

    if (id) fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await client.get(`/api/groups/${id}/`);
      setGroup(res.data);
      setName(res.data.name);
      setDescription(res.data.description);
    } catch (e) {
      Alert.alert("Error", "Failed to load group details.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        await client.patch(`/api/groups/${id}/`, { name, description });
        Alert.alert("Success", "Group updated.");
        router.back();
    } catch (e) {
        Alert.alert("Error", "Update failed.");
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      await client.delete(`/api/groups/${id}/`);
      if (Platform.OS === 'web') alert("Group has been deleted.");
      else Alert.alert("Deleted", "Group has been deleted.");
      router.replace("/(tabs)/groups");
    } catch (e) {
      Alert.alert("Error", "Failed to delete group.");
      setDeleting(false);
    }
  };

  const confirmDeleteGroup = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to delete this group?")) handleDeleteGroup();
        return;
    }
    Alert.alert("Delete Group", "Cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDeleteGroup },
    ]);
  };

  const handleMemberAction = async (userId: number, action: 'kick' | 'promote' | 'demote') => {
    try {
      await client.post(`/api/groups/${id}/manage-member/`, {
        user_id: userId,
        action: action
      });
      fetchGroup(); 
    } catch (e) {
      Alert.alert("Error", `Failed to ${action} member.`);
    }
  };

  const confirmAction = (userId: number, username: string, action: 'kick' | 'promote' | 'demote') => {
    const verb = action === 'kick' ? 'Remove' : action === 'promote' ? 'Promote' : 'Demote';
    const message = action === 'kick' 
        ? `Remove ${username} from the group?` 
        : `${verb} ${username} to ${action === 'promote' ? 'Admin' : 'Member'}?`;

    if (Platform.OS === 'web') {
        if (window.confirm(message)) handleMemberAction(userId, action);
        return;
    }

    Alert.alert(verb, message, [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Confirm", 
            style: action === 'kick' ? "destructive" : "default", 
            onPress: () => handleMemberAction(userId, action) 
        },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#69324C" /></View>;
  }

  if (!group) return null;

  const filteredMembers = group.members_details?.filter(m => 
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/group/${id}/info`)}>
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Group</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* EDIT DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.label}>Group Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.area]} value={description} onChangeText={setDescription} multiline />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        {/* MEMBER MANAGEMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Members ({group.members_details?.length || 0})</Text>
          
          <View style={styles.searchBox}>
             <Ionicons name="search" size={20} color="#999" />
             <TextInput 
                style={styles.searchInput}
                placeholder="Search members..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
             />
          </View>

          {filteredMembers.map((member) => {
            const isAdmin = group.admins.includes(member.id);
            const isCurrentUser = member.id === currentUserId;

            return (
              <MemberRow 
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                isCurrentUser={isCurrentUser}
                onPromote={() => confirmAction(member.id, member.username, isAdmin ? 'demote' : 'promote')}
                onKick={() => confirmAction(member.id, member.username, 'kick')}
              />
            );
          })}
          
          {filteredMembers.length === 0 && (
              <Text style={styles.emptyText}>No members found.</Text>
          )}
        </View>

        {/* DANGER ZONE */}
        <View style={[styles.section, styles.dangerZone]}>
          <Text style={[styles.sectionTitle, { color: "#cc0000" }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteGroup} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteBtnText}>Delete Group</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: "#E0E0E0" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E1E1E" },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30, backgroundColor: "#fff", borderRadius: 12, padding: 15, borderWidth: 1, borderColor: "#EEE" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#5F7751", marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: { backgroundColor: "#FAF7F0", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#DDD", marginBottom: 15 },
  area: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#69324C", padding: 14, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F9F9F9", borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, borderWidth: 1, borderColor: "#EEE" },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  memberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#F0F0F0" },
  memberInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#DDD" },
  memberName: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  adminBadge: { color: "#69324C", fontWeight: "bold", fontSize: 12 },
  meBadge: { color: "#999", fontStyle: "italic", fontSize: 12 },
  rowActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  roleBtn: {},
  kickBtn: {},
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 10, fontStyle: 'italic' },
  dangerZone: { borderColor: "#ffcccc", backgroundColor: "#fff5f5" },
  deleteBtn: { backgroundColor: "#cc0000", padding: 14, borderRadius: 10, alignItems: "center" },
  deleteBtnText: { color: "#fff", fontWeight: "bold" },
});