import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import client from "@/api/client";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";

const { width } = Dimensions.get("window");
const GAP = 6;
const NUM_COLS = 3;
const H_PADDING = 18;
const TILE = (width - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

interface UserListItem {
    id: number;
    user_id: number;
    username: string;
    avatar: string | null;
    is_following: boolean;
}

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  
  const [avatarVisible, setAvatarVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [listModalVisible, setListModalVisible] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, postsRes, meRes] = await Promise.all([
        client.get(`api/profiles/${userId}/`),
        client.get(`api/posts/user/${userId}/`),
        client.get("users/me/")
      ]);
      setProfileData(profileRes.data);
      setUserPosts(postsRes.data.results || []);
      setIsFollowing(profileRes.data.is_following || false);
      setCurrentUserId(meRes.data.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openUserList = async (type: "followers" | "following") => {
      setListTitle(type);
      setListModalVisible(true);
      setListLoading(true);
      try {
          const endpoint = type === "followers" 
            ? `api/profiles/${userId}/followers/` 
            : `api/profiles/${userId}/following/`;
          
          const res = await client.get(endpoint);
          setUserList(res.data);
      } catch (e) {
          console.error("Failed to fetch list", e);
      } finally {
          setListLoading(false);
      }
  };

  const toggleListFollow = async (targetUserId: number, currentStatus: boolean, index: number) => {
    const offset = currentStatus ? -1 : 1;
    
    const isMyProfile = currentUserId === Number(userId);

    try {
        const newList = [...userList];
        newList[index].is_following = !currentStatus;
        setUserList(newList);

        if (isMyProfile) {
            setProfileData((prev: any) => ({
                ...prev,
                following_count: (prev?.following_count || 0) + offset,
            }));
        }

        await client.post(`api/profiles/${targetUserId}/follow/`);
    } catch (e) {
        console.error("List follow toggle failed", e);
        
        const newList = [...userList];
        newList[index].is_following = currentStatus;
        setUserList(newList);

        if (isMyProfile) {
             setProfileData((prev: any) => ({
                ...prev,
                following_count: (prev?.following_count || 0) - offset,
            }));
        }
    }
  };

  const toggleFollow = async () => {
    const offset = isFollowing ? -1 : 1;

    setIsFollowing((prev) => !prev);
    setProfileData((prev: any) => ({
      ...prev,
      followers_count: (prev?.followers_count || 0) + offset,
    }));

    try {
      await client.post(`api/profiles/${userId}/follow/`);
    } catch (error) {
      console.error("Follow action failed:", error);
      
      setIsFollowing((prev) => !prev);
      setProfileData((prev: any) => ({
        ...prev,
        followers_count: (prev?.followers_count || 0) - offset,
      }));
    }
  };

  const navigateToUser = (targetId: number) => {
      setListModalVisible(false);
      router.push({ pathname: "/user/[userId]", params: { userId: targetId } });
  };

  if (loading || !profileData) {
     return <SafeAreaView style={styles.screen}><ActivityIndicator /></SafeAreaView>;
  }

  const bioLines = profileData?.bio ? profileData.bio.split("\n") : [];

  const Header = (
    <View>
      <View style={styles.topHeader}>
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#69324C" />
          <Text style={styles.backText}>back</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
            {/* Avatar */}
          <Pressable onPress={() => setAvatarVisible(true)} hitSlop={10}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </Pressable>

          <View style={styles.rightCol}>
            <Text style={styles.username}>{profileData.user?.username}</Text>

            <View style={styles.statsRow}>
              <Stat value={userPosts.length} label="posts" />
              
              {/* CLICKABLE FOLLOWERS */}
              <Pressable onPress={() => openUserList("followers")}>
                <Stat value={profileData.followers_count} label="followers" />
              </Pressable>

              {/* CLICKABLE FOLLOWING */}
              <Pressable onPress={() => openUserList("following")}>
                <Stat value={profileData.following_count} label="following" />
              </Pressable>
            </View>

            {/* Main Profile Follow Button (Only if not me) */}
            {currentUserId !== Number(userId) && (
                 <View style={styles.buttonsRow}>
                 <Pressable
                   style={[
                     styles.followBtn,
                     isFollowing ? styles.followingBtn : styles.followBtnActive,
                   ]}
                   onPress={toggleFollow}
                 >
                   <Text
                     style={[
                       styles.followText,
                       isFollowing ? styles.followingText : styles.followTextActive,
                     ]}
                   >
                     {isFollowing ? "following" : "follow"}
                   </Text>
                 </Pressable>
               </View>
            )}
           
          </View>
        </View>

        <View style={styles.bioBox}>
          <View style={styles.line} />
          {bioLines.map((line: string, idx: number) => (
            <Text key={idx} style={styles.bioLine}>{line}</Text>
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

       {/* Users List Modal */}
       <Modal visible={listModalVisible} transparent animationType="fade" onRequestClose={() => setListModalVisible(false)}>
<Pressable style={styles.backdrop} onPress={() => setListModalVisible(false)}>
    <Pressable style={styles.listCard} onPress={() => {}}>
        <Text style={styles.popoutTitle}>{listTitle}</Text>
        
        {listLoading ? (
            <ActivityIndicator color="#69324C" />
        ) : (
            <FlatList 
                data={userList}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({item, index}) => (
                    <View style={styles.userRow}>
                        <TouchableOpacity 
                            style={styles.userInfo} 
                            onPress={() => navigateToUser(item.user_id)}
                        >
                            {item.avatar ? (
                                <Image source={{ uri: item.avatar }} style={styles.listAvatar} />
                            ) : (
                                <View style={[styles.listAvatar, styles.avatarPlaceholder]} />
                            )}
                            <Text style={styles.listUsername}>{item.username}</Text>
                        </TouchableOpacity>
                        {item.user_id !== currentUserId && (
                            <TouchableOpacity 
                                style={[
                                    styles.miniFollowBtn,
                                    item.is_following ? styles.miniFollowingBtn : styles.miniFollowBtnActive
                                ]}
                                onPress={() => toggleListFollow(item.user_id, item.is_following, index)}
                            >
                                <Text style={[
                                    styles.miniFollowText,
                                    item.is_following ? styles.miniFollowingText : styles.miniFollowTextActive
                                ]}>
                                    {item.is_following ? "following" : "follow"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        )}
    </Pressable>
</Pressable>
</Modal>

      {/* Avatar Modal */}
       <Modal visible={avatarVisible} transparent animationType="fade" onRequestClose={() => setAvatarVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAvatarVisible(false)}>
          <Pressable style={styles.avatarCard} onPress={() => {}}>
             <Image source={{ uri: profileData.avatar }} style={styles.avatarPreview} />
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
    listContent: { paddingHorizontal: H_PADDING, paddingTop: 6, paddingBottom: 70 },
    topHeader: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
    backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    backText: { fontSize: 14, fontWeight: "800", color: "#69324C", textTransform: "lowercase" },
    profileCard: { backgroundColor: "#FAF7F0", padding: 12 },
    profileTopRow: { flexDirection: "row", gap: 10 },
    avatar: { width: 120, height: 120, borderRadius: 80, borderColor: "#69324C", borderWidth: 1 },
    avatarPlaceholder: { backgroundColor: "#E9E3D8" },
    rightCol: { flex: 1 },
    username: { fontSize: 17, fontWeight: "bold", color: "#1E1E1E", marginBottom: 10 },
    statsRow: { flexDirection: "row", marginRight: 20, alignSelf: "center" },
    stat: { width: 70, textAlign: "center", marginRight: 10 },
    statValue: { fontSize: 20, fontWeight: "bold", color: "#1E1E1E", textAlign: "center" },
    statLabel: { fontSize: 13, color: "#3B3B3B", textAlign: "center" },
    buttonsRow: { marginTop: 12, flexDirection: "row" },
    bioBox: { marginTop: 10, paddingTop: 10 },
    line: { height: 1, backgroundColor: "#69324C", marginVertical: 6 },
    bioLine: { fontSize: 14, color: "#1E1E1E", lineHeight: 16 },
    tile: { width: TILE, height: TILE, borderRadius: 6, overflow: "hidden", backgroundColor: "#173F1A" },
    tileImage: { width: "100%", height: "100%" },
    
    // Modal & List Styles
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
    avatarCard: { backgroundColor: "#FAF7F0", borderRadius: 18, padding: 16, maxHeight: "80%", alignItems: "center" },
    listCard: { backgroundColor: "#FAF7F0", borderRadius: 18, padding: 16, height: "60%", width: "100%" },
    popoutTitle: { fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 16, textAlign: "center", textTransform: "capitalize" },
    avatarPreview: { width: "100%", height: 320, borderRadius: 16, backgroundColor: "#E9E3D8", marginTop: 8 },
    
    // List Item Styles
    userRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E9E3D8", marginRight: 10, borderWidth: 1, borderColor: "#69324C" },
    listUsername: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E" },
    
    // Mini Buttons (in Modal)
    miniFollowBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
    miniFollowBtnActive: { backgroundColor: "#69324C", borderColor: "#69324C" },
    miniFollowingBtn: { backgroundColor: "transparent", borderColor: "#C9BEB1" },
    miniFollowText: { fontSize: 11, fontWeight: "bold" },
    miniFollowTextActive: { color: "#FAF7F0" },
    miniFollowingText: { color: "#1E1E1E" },

    // Main Profile Buttons
    followBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "center" },
    followBtnActive: { backgroundColor: "#69324C", width: 220, height: 30 },
    followingBtn: { backgroundColor: "#E9E3D8", width: 220, height: 30 },
    followText: { fontSize: 12, fontWeight: "bold", textTransform: "lowercase", alignSelf: "center" },
    followTextActive: { color: "#FAF7F0" },
    followingText: { color: "#1E1E1E" },
});