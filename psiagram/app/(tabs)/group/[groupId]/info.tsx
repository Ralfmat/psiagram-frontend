import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../../../api/client";

// ... (keep JoinRequest and GroupDetails interfaces same as before) ...
interface JoinRequest {
  id: number;
  user: number;
  user_username: string;
  status: string;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  members_count: number;
  is_admin: boolean;
  is_member: boolean;
  has_pending_request: boolean;
  join_requests: JoinRequest[];
  admin_username: string;
}

export default function GroupInfoScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  
  const id = Array.isArray(groupId) ? groupId[0] : groupId;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (keep fetchGroup, handleJoin, handleLeave, handleRequestAction same as before) ...
  const fetchGroup = async () => {
    try {
      const res = await client.get(`/api/groups/${id}/`);
      setGroup(res.data);
    } catch (e) {
      console.error("Fetch group error", e);
      Alert.alert("Error", "Could not load group details.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) fetchGroup();
    }, [id])
  );

  const handleJoin = async () => {
    try {
      await client.post(`/api/groups/${id}/join/`);
      Alert.alert("Request Sent", "Waiting for admin approval.");
      fetchGroup();
    } catch (e) {
      Alert.alert("Error", "Could not send join request.");
    }
  };

  const handleLeave = async () => {
    try {
      await client.post(`/api/groups/${id}/leave/`);
      Alert.alert("Left Group", "You are no longer a member.");
      router.replace("/(tabs)/groups");
    } catch (e) {
      Alert.alert("Error", "Could not leave group.");
    }
  };

  const handleRequestAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await client.post(`/api/groups/${id}/handle-request/`, {
        request_id: requestId,
        action
      });
      fetchGroup();
    } catch (e) {
      Alert.alert("Error", `Failed to ${action} request.`);
    }
  };


  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#69324C" /></View>;
  if (!group) return null;

  const pendingRequests = group.join_requests?.filter(r => r.status === 'PENDING') || [];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
            <View style={styles.iconPlaceholder}>
               <Ionicons name="people" size={40} color="#fff" />
            </View>
            <Text style={styles.name}>{group.name}</Text>
            <Text style={styles.stats}>
              {group.members_count} Members • Admin: {group.admin_username}
            </Text>
        </View>

        {/* User Actions */}
        <View style={styles.actions}>
            {group.is_member ? (
                <>
                <View style={styles.memberButtons}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/(tabs)/group/${id}/posts`)}>
                      <Text style={styles.primaryBtnText}>View Feed</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(`/(tabs)/group/${id}/members`)}>
                      <Text style={styles.secondaryBtnText}>Members</Text>
                  </TouchableOpacity>
                  {group.is_admin ? (
                   <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => router.push(`/(tabs)/group/${id}/edit`)}>
                      <Text style={styles.secondaryBtnText}>Edit Group</Text>
                   </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.dangerBtn]} onPress={handleLeave}>
                        <Text style={styles.dangerBtnText}>Leave Group</Text>
                    </TouchableOpacity>
                )}
                </View>
                </>
            ) : (
                <TouchableOpacity 
                   style={[styles.primaryBtn, group.has_pending_request && styles.disabledBtn]} 
                   onPress={handleJoin}
                   disabled={group.has_pending_request}
                >
                    <Text style={styles.primaryBtnText}>
                        {group.has_pending_request ? "Request Pending" : "Join Group"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Description */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.text}>{group.description || "No description provided."}</Text>
        </View>

        {/* ADMIN: Join Requests */}
        {group.is_admin && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Join Requests</Text>
                {pendingRequests.length === 0 ? (
                    <Text style={styles.dimText}>No pending requests.</Text>
                ) : (
                    pendingRequests.map((req) => (
                        <View key={req.id} style={styles.requestRow}>
                            <View style={styles.reqInfo}>
                                <Ionicons name="person-circle-outline" size={36} color="#666" />
                                <Text style={styles.reqName}>{req.user_username}</Text>
                            </View>
                            <View style={styles.reqActions}>
                                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleRequestAction(req.id, 'approve')}>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRequestAction(req.id, 'reject')}>
                                    <Ionicons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 30 },
  header: { alignItems: 'center', padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#eee" },
  iconPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#69324C", justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: "#1E1E1E", textAlign: "center" },
  stats: { fontSize: 14, color: "#666", marginTop: 4 },
  
  actions: { alignItems: 'center', paddingVertical: 20 },
  memberButtons: { flexDirection: 'row', gap: 10 },
  
  primaryBtn: { backgroundColor: "#69324C", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  primaryBtnText: { color: "#fff", fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: "#E9E3D8", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  secondaryBtnText: { color: "#1E1E1E", fontWeight: 'bold' },
  dangerBtn: { backgroundColor: "#fff5f5", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, borderWidth: 1, borderColor: "#ffcccc" },
  dangerBtnText: { color: "#cc0000", fontWeight: 'bold' },
  disabledBtn: { opacity: 0.6, backgroundColor: "#999" },

  section: { padding: 20, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fff", marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: "#5F7751" },
  text: { lineHeight: 22, color: "#333", fontSize: 15 },
  dimText: { color: "#999", fontStyle: 'italic' },
  
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: "#f0f0f0" },
  reqInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqName: { fontSize: 16, fontWeight: "600", color: "#333" },
  reqActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  approveBtn: { backgroundColor: "#5F7751" },
  rejectBtn: { backgroundColor: "#cc0000" },
});