import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import client from "@/api/client";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity
} from "react-native";

interface UserListItem {
    id: number; // profile id
    user_id: number; // user id
    username: string;
    avatar: string | null;
    is_following: boolean;
}

export default function PostDetails() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Local state for UI responsiveness
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Likes Modal State
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesList, setLikesList] = useState<UserListItem[]>([]);
  const [likesListLoading, setLikesListLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      // Fetch post and current user info (to know who "I" am for the follow buttons)
      const [postRes, meRes] = await Promise.all([
        client.get(`api/posts/${postId}/`),
        client.get("users/me/") 
      ]);
      
      setPost(postRes.data);
      setCurrentUserId(meRes.data.id);
      
      setLiked(postRes.data.is_liked || false); 
      setLikesCount(postRes.data.likes_count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const previousLiked = liked;
      const previousCount = likesCount;
      
      setLiked(!previousLiked);
      setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

      const res = await client.post(`api/posts/${postId}/like/`);
      
      if (res.data.likes_count !== undefined) {
         setLikesCount(res.data.likes_count);
         setLiked(res.data.status === 'liked');
      }
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const openLikesList = async () => {
    setLikesModalVisible(true);
    setLikesListLoading(true);
    try {
        const res = await client.get(`api/posts/${postId}/likes/`);
        setLikesList(res.data);
    } catch (e) {
        console.error("Failed to fetch likes list", e);
    } finally {
        setLikesListLoading(false);
    }
  };

  const toggleListFollow = async (targetUserId: number, currentStatus: boolean, index: number) => {
    // Optimistic update logic
    const newList = [...likesList];
    newList[index].is_following = !currentStatus;
    setLikesList(newList);

    try {
        await client.post(`api/profiles/${targetUserId}/follow/`);
    } catch (e) {
        console.error("Follow toggle failed", e);
        const revertedList = [...likesList];
        revertedList[index].is_following = currentStatus;
        setLikesList(revertedList);
    }
  };

  const navigateToUser = (targetId: number) => {
    setLikesModalVisible(false);
    router.push({ pathname: "/user/[userId]", params: { userId: targetId } });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await client.post(`api/posts/${postId}/comment/`, {
        content: commentText,
        post: postId
      });
      const newComment = res.data;
      setPost((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setCommentText("");
    } catch (e) {
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !post) {
     return <SafeAreaView style={styles.screen}><ActivityIndicator /></SafeAreaView>;
  }

  const comments = post.comments || [];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={30} color="#69324C" />
              <Text style={styles.backText}>back</Text>
            </Pressable>
            <View style={{ width: 70 }} />
          </View>

          <View style={styles.userRow}>
            <Pressable onPress={() => router.push(`/user/${post.author}`)}>
               {post.author_avatar ? (
                  <Image source={{ uri: post.author_avatar }} style={styles.userAvatar} />
               ) : (
                  <View style={[styles.userAvatar, { backgroundColor: "#E9E3D8" }]} />
               )}
            </Pressable>
            
            <Pressable onPress={() => router.push(`/user/${post.author}`)}>
              <Text style={styles.headerTitle}>{post.author_username}</Text>
            </Pressable>
          </View>

          <View style={styles.photoWrap}>
            <Image source={{ uri: post.image }} style={styles.photo} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionGroup}>
              <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={8}>
                <Ionicons name={liked ? "paw" : "paw-outline"} size={30} color="#69324C" />
              </Pressable>
              
              {/* CLICKABLE LIKES COUNT */}
              <Pressable onPress={openLikesList} hitSlop={8}>
                  <View style={styles.countsRow}>
                    <Text style={styles.countText}>{likesCount}</Text>
                  </View> 
              </Pressable>
            </View>

            <View style={styles.actionGroup}>
              <Pressable style={styles.actionBtn} hitSlop={8}>
                <Ionicons name="chatbubble-outline" size={30} color="#69324C" />
              </Pressable>
              <View style={styles.countsRow}>
                <Text style={styles.countText}>{comments.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.captionRow}>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>

          <View style={styles.commentBox}>
              <View style={styles.commentRow}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="add a comment"
                  placeholderTextColor="#777"
                  style={styles.commentInput}
                  returnKeyType="send" 
                  onSubmitEditing={handleComment}
                  blurOnSubmit={false}
                />
                  <Pressable onPress={handleComment} hitSlop={8} disabled={submittingComment}>
                    {submittingComment ? (
                       <ActivityIndicator size="small" color="#69324C" />
                    ) : (
                       <Ionicons name="send" size={20} color="#69324C" />
                    )}
                  </Pressable>
              </View>
           </View>

          <View style={styles.commentsList}>
            {comments.map((c: any) => (
              <View key={c.id} style={styles.commentLine}>
                <Pressable onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: c.author } })}>
                  <Text style={styles.commentLineUser}>{c.author_username}  </Text>
                </Pressable>
                <Text style={styles.commentLineText}>{c.content}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* LIKES LIST MODAL */}
      <Modal visible={likesModalVisible} transparent animationType="fade" onRequestClose={() => setLikesModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLikesModalVisible(false)}>
            <Pressable style={styles.listCard} onPress={() => {}}>
                <Text style={styles.popoutTitle}>Likes</Text>
                
                {likesListLoading ? (
                    <ActivityIndicator color="#69324C" />
                ) : (
                    <FlatList 
                        data={likesList}
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
                                        <View style={[styles.listAvatar, {backgroundColor: "#E9E3D8"}]} />
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#FAF7F0" },
    header: { height: 56, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FAF7F0", marginBottom: 20 },
    backRow: { flexDirection: "row", alignItems: "center", width: 60 },
    backText: { color: "#69324C", fontSize: 14, fontWeight: "700", textTransform: "lowercase" },
    headerTitle: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E", textTransform: "lowercase" },
    userRow: { paddingHorizontal: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
    userAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#E9E3D8" },
    photoWrap: { paddingHorizontal: 14 },
    photo: { width: "100%", height: 360, borderRadius: 8, backgroundColor: "#E9E3D8" },
    actionGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    actionsRow: { paddingHorizontal: 14, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 12 },
    actionBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    countsRow: { flexDirection: "row", alignItems: "center" },
    countText: { fontSize: 15, color: "#1E1E1E", fontWeight: "bold" },
    captionRow: { paddingHorizontal: 14, paddingTop: 6, flexDirection: "row", flexWrap: "wrap" },
    commentRow: { flexDirection: "row", alignItems: "center" },
    captionUser: { fontSize: 13, fontWeight: "800", color: "#1E1E1E" },
    captionText: { fontSize: 13, color: "#1E1E1E" },
    commentBox: { marginTop: 10, marginHorizontal: 14, backgroundColor: "#F7F4EE", borderRadius: 10, borderWidth: 1, borderColor: "#00000022", paddingHorizontal: 10, paddingVertical: 8 },
    commentInput: { flex: 1, fontSize: 13, color: "#1E1E1E", paddingVertical: 6, paddingRight: 10 },
    commentsList: { paddingHorizontal: 14, paddingTop: 10 },
    commentLine: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    commentLineUser: { fontSize: 12, fontWeight: "800", color: "#1E1E1E" },
    commentLineText: { fontSize: 12, color: "#1E1E1E" },

    // Modal Styles
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
    listCard: { backgroundColor: "#FAF7F0", borderRadius: 18, padding: 16, height: "60%", width: "100%" },
    popoutTitle: { fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 16, textAlign: "center", textTransform: "capitalize" },
    
    // List Item Styles
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E9E3D8", marginRight: 10, borderWidth: 1, borderColor: "#69324C" },
    listUsername: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E" },
    userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
    
    // Mini Buttons
    miniFollowBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
    miniFollowBtnActive: { backgroundColor: "#69324C", borderColor: "#69324C" },
    miniFollowingBtn: { backgroundColor: "transparent", borderColor: "#C9BEB1" },
    miniFollowText: { fontSize: 11, fontWeight: "bold" },
    miniFollowTextActive: { color: "#FAF7F0" },
    miniFollowingText: { color: "#1E1E1E" },
});