import { useSession } from "@/context/ctx";
import client from "@/api/client"; 
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";

const { width } = Dimensions.get("window");
const GAP = 6;
const NUM_COLS = 3;
const H_PADDING = 18;
const TILE = (width - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

/**
 * Helper to upload image to S3
 * Returns the file_key if successful, or null if failed.
 */
async function uploadToS3(uri: string): Promise<string | null> {
  try {
    // 1. Prepare file metadata
    const filename = uri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // 2. Initiate Upload (Get Presigned URL from Backend)
    // We reuse the existing generic S3 signer endpoint
    const initRes = await client.post("/api/v1/rekognition/initiate-upload/", {
      filename,
      content_type: type,
    });
    const { upload_url, file_key } = initRes.data;

    // 3. Upload to S3 directly via standard fetch
    const imageBlob = await fetch(uri).then((r) => r.blob());
    
    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      body: imageBlob,
      headers: {
        "Content-Type": type,
      },
    });

    if (uploadRes.status !== 200) {
      throw new Error("S3 Upload failed");
    }

    return file_key;
  } catch (error) {
    console.error("Avatar Upload Error:", error);
    Alert.alert("Error", "Failed to upload image.");
    return null;
  }
}

export default function MyProfile() {
  const { signOut } = useSession(); 
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Profile Data State
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  // UI States
  const [avatarVisible, setAvatarVisible] = useState(false);
  const [changingAvatar, setChangingAvatar] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit Form State
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");

  // Fetch Data Function
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get current user ID if we don't have it
      let currentId = userId;
      if (!currentId) {
        const meRes = await client.get("users/me/");
        currentId = meRes.data.id;
        setUserId(currentId);
      }

      if (currentId) {
        // 2. Fetch Profile Details
        const profileRes = await client.get(`api/profiles/${currentId}/`);
        setProfileData(profileRes.data);

        // 3. Fetch User Posts
        const postsRes = await client.get(`api/posts/user/${currentId}/`);
        setUserPosts(postsRes.data.results || []);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const pickNewAvatar = async () => {
    try {
      setChangingAvatar(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setChangingAvatar(false);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        
        if (uri && userId) {
          // 1. Upload the image to S3
          const s3Key = await uploadToS3(uri);
          
          if (s3Key) {
            // 2. Patch the profile with the new s3_key
            // The backend serializer will move the file and update the 'avatar' field
            await client.patch(`api/profiles/${userId}/`, {
              s3_key: s3Key
            });
            
            // 3. Refresh data to show the new avatar
            await fetchData();
            setAvatarVisible(false);
          }
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update avatar");
    } finally {
      setChangingAvatar(false);
    }
  };

  const openEdit = () => {
    if (!profileData) return;
    setEditUsername(profileData.user.username);
    setEditBio(profileData.bio || "");
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!userId) return;

    try {
        // Simple patch for bio (and potentially username if backend supports it nested)
        await client.patch(`api/profiles/${userId}/`, {
            bio: editBio,
        });
        
        // Refresh to show changes
        await fetchData();
        setEditVisible(false);
    } catch (e) {
        console.error("Edit failed", e);
        Alert.alert("Error", "Failed to update profile.");
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      // TODO: Add actual DELETE endpoint call here if available
      // await client.delete(`users/me/`); 
      await signOut(); 
    } finally {
      setDeleting(false);
      setDeleteVisible(false);
    }
  };

  if (loading && !profileData) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#69324C" />
      </View>
    );
  }

  // Helper to format bio (split newlines)
  const bioLines = profileData?.bio ? profileData.bio.split("\n") : [];

  const Header = (
    <View>
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Pressable onPress={() => setAvatarVisible(true)}>
            {profileData?.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </Pressable>

          <View style={styles.rightCol}>
            <Text style={styles.username}>{profileData?.user?.username}</Text>

            <View style={styles.statsRow}>
              <Stat value={userPosts.length} label="posts" />
              <Stat value={profileData?.followers_count || 0} label="followers" />
              <Stat value={profileData?.following_count || 0} label="following" />
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={openEdit}>
                <Text style={styles.btnPrimaryText}>edit profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSecondary} onPress={() => setDeleteVisible(true)}  >
                <Text style={styles.btnSecondaryText}>delete profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bioBox}>
           {/* Displaying email/username */}
          <Text style={styles.name}>{profileData?.user?.email}</Text> 
          <View style={styles.line} /> 
          {bioLines.map((line: string, idx: number) => (
            <Text key={idx} style={styles.bioLine}>
              {line}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ height: 10 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={Header}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.tile}
            onPress={() =>
              router.push({
                pathname: "/post/[postId]",
                params: { postId: item.id },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.tileImage} />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
            <Pressable style={styles.popoutCard} onPress={() => {}}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.popoutTitle}>edit profile</Text>
                
                <Text style={styles.modalLabel}>username</Text>
                <TextInput value={editUsername} onChangeText={setEditUsername} style={styles.modalInput} />

                <Text style={styles.modalLabel}>bio</Text>
                <TextInput value={editBio} onChangeText={setEditBio} style={[styles.modalInput, styles.modalMultiline]} multiline />

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setEditVisible(false)}>
                    <Text style={styles.modalBtnGhostText}>cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveEdit}>
                    <Text style={styles.modalBtnPrimaryText}>save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDeleteVisible(false)}>
          <Pressable style={styles.popoutCardDelete} onPress={() => {}}>
            <Text style={styles.popoutTitle}>delete account?</Text>
            <Text style={styles.deleteText}>are you sure you want to delete your account?{"\n"}this action cannot be undone.</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setDeleteVisible(false)} disabled={deleting}>
                <Text style={styles.modalBtnGhostText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.deleteBtn]} onPress={confirmDelete} disabled={deleting}>
                <Text style={styles.deleteBtnText}>{deleting ? "deleting..." : "delete"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

       {/* Avatar Modal */}
       <Modal visible={avatarVisible} transparent animationType="fade" onRequestClose={() => setAvatarVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAvatarVisible(false)}>
          <Pressable style={styles.avatarCard} onPress={() => {}}>
            <Text style={styles.popoutTitle}>profile photo</Text>
            {profileData?.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatarPreview} />
            ) : (
              <View style={[styles.avatarPreview, styles.avatarPlaceholder]} />
            )}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setAvatarVisible(false)}>
                <Text style={styles.modalBtnGhostText}>cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnPrimary]} 
                onPress={pickNewAvatar} 
                disabled={changingAvatar}
              >
                {changingAvatar ? (
                    <ActivityIndicator color="#FAF7F0" />
                ) : (
                    <Text style={styles.modalBtnPrimaryText}>change photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  listContent: { paddingHorizontal: H_PADDING, paddingTop: 10, paddingBottom: 50 },
  profileCard: { backgroundColor: "#FAF7F0", padding: 12 },
  profileTopRow: { flexDirection: "row", gap: 10 },
  avatar: { width: 120, height: 120, borderRadius: 80, borderColor: "#69324C", borderWidth: 1 },
  rightCol: { flex: 1 },
  username: { fontSize: 17, fontWeight: "bold", color: "#1E1E1E", marginBottom: 10 },
  statsRow: { flexDirection: "row", marginRight: 20, alignSelf: "center" },
  stat: { width: 70, textAlign: "center", marginRight: 10 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#1E1E1E", textAlign: "center" },
  statLabel: { fontSize: 13, color: "#3B3B3B", textAlign: "center" },
  line: { height: 1, backgroundColor: "#69324C", marginVertical: 6 },
  buttonsRow: { flexDirection: "row", gap: 20, marginTop: 12 },
  btnPrimary: { backgroundColor: "#E9E3D8", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  btnPrimaryText: { color: "#1E1E1E", fontSize: 12, fontWeight: "bold", textTransform: "lowercase" },
  btnSecondary: { backgroundColor: "#E9E3D8", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  btnSecondaryText: { color: "#1E1E1E", fontSize: 12, fontWeight: "700", textTransform: "lowercase" },
  bioBox: { marginTop: 10, borderTopColor: "#C9BEB1", paddingTop: 10 },
  name: { fontSize: 15, fontWeight: "900", color: "#1E1E1E", marginBottom: 4 },
  bioLine: { fontSize: 14, color: "#1E1E1E", lineHeight: 16 },
  tile: { width: TILE, height: TILE, borderRadius: 6, overflow: "hidden", backgroundColor: "#173F1A" },
  tileImage: { width: "100%", height: "100%" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 10 },
  popoutCard: { backgroundColor: "#FAF7F0", borderRadius: 12, padding: 12 },
  popoutCardDelete: { backgroundColor: "#FAF7F0", borderRadius: 12, padding: 20, height: 220, width: 300, alignSelf: "center", justifyContent: "center" },
  popoutTitle: { fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 12, textAlign: "center" },
  modalLabel: { fontSize: 12, color: "#5F7751", marginBottom: 6, marginTop: 10, textTransform: "lowercase" },
  modalInput: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#00000022", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1E1E1E" },
  modalMultiline: { minHeight: 90, textAlignVertical: "top" },
  modalButtonsRow: { flexDirection: "row", gap: 12, marginTop: 16, justifyContent: "center" },
  modalBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnGhost: { backgroundColor: "#E9E3D8" },
  modalBtnGhostText: { color: "#1E1E1E", fontWeight: "700", textTransform: "lowercase" },
  modalBtnPrimary: { backgroundColor: "#69324C" },
  modalBtnPrimaryText: { color: "#FAF7F0", fontWeight: "700", textTransform: "lowercase" },
  deleteText: { fontSize: 13, color: "#1E1E1E", textAlign: "center", marginBottom: 6, lineHeight: 18 },
  deleteBtn: { backgroundColor: "#B3261E" },
  deleteBtnText: { color: "#FAF7F0", fontWeight: "800", textTransform: "lowercase" },
  avatarPlaceholder: { backgroundColor: "#E9E3D8" },
  avatarCard: { backgroundColor: "#FAF7F0", borderRadius: 18, padding: 16, maxHeight: "80%", alignItems: "center" },
  avatarPreview: { width: "100%", height: 320, borderRadius: 16, backgroundColor: "#E9E3D8", marginTop: 8 },
});