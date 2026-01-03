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
  Alert
} from "react-native";

// 1. Add this utility function at the top or bottom of the file
function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return `${Math.floor(diffInDays / 7)}w`;
}

export default function PostDetails() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (postId) fetchData();
  }, [postId]);

  const fetchData = async () => {
    try {
      setLoading(true);
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
    } catch (e) { console.error("Like failed", e); }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this post?")) performDelete();
    } else {
      Alert.alert("Delete Post", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  const performDelete = async () => {
    try {
      await client.delete(`api/posts/${postId}/`);
      router.back();
    } catch (error) { Alert.alert("Error", "Failed to delete post."); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await client.post(`api/posts/${postId}/comment/`, { content: commentText, post: postId });
      setPost((prev: any) => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
      setCommentText("");
    } catch (e) { Alert.alert("Error", "Could not post comment."); } 
    finally { setSubmittingComment(false); }
  };

  if (loading || !post) return <SafeAreaView style={styles.screen}><ActivityIndicator /></SafeAreaView>;

  const comments = post.comments || [];
  const isOwner = currentUserId === post.author;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={30} color="#69324C" />
              <Text style={styles.backText}>back</Text>
            </Pressable>
            <View style={{ width: 70, alignItems: 'flex-end' }}>
              {isOwner && (
                <Pressable onPress={handleDelete} hitSlop={10}>
                  <Ionicons name="trash-outline" size={24} color="#D9534F" />
                </Pressable>
              )}
            </View>
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
              <View style={styles.countsRow}>
                <Text style={styles.countText}>{likesCount}</Text>
              </View> 
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
            <Text style={styles.captionText}>
                <Text style={styles.captionUser}>{post.author_username} </Text>
                {post.caption}
            </Text>
            {/* 2. Display Post Time */}
            <Text style={styles.timeText}>{timeAgo(post.created_at)}</Text>
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
                    {submittingComment ? <ActivityIndicator size="small" color="#69324C" /> : <Ionicons name="send" size={20} color="#69324C" />}
                  </Pressable>
              </View>
           </View>

          <View style={styles.commentsList}>
            {comments.map((c: any) => (
              <View key={c.id} style={styles.commentLine}>
                <Text style={styles.commentContent}>
                    <Text style={styles.commentLineUser} onPress={() => router.push(`/user/${c.author}`)}>
                        {c.author_username}{" "}
                    </Text>
                    <Text style={styles.commentLineText}>{c.content}</Text>
                    {/* 3. Display Comment Time */}
                    <Text style={styles.commentTime}>  {timeAgo(c.created_at)}</Text>
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    captionRow: { paddingHorizontal: 14, paddingTop: 6 },
    commentRow: { flexDirection: "row", alignItems: "center" },
    captionUser: { fontSize: 13, fontWeight: "800", color: "#1E1E1E" },
    captionText: { fontSize: 13, color: "#1E1E1E", lineHeight: 18 },
    commentBox: { marginTop: 10, marginHorizontal: 14, backgroundColor: "#F7F4EE", borderRadius: 10, borderWidth: 1, borderColor: "#00000022", paddingHorizontal: 10, paddingVertical: 8 },
    commentInput: { flex: 1, fontSize: 13, color: "#1E1E1E", paddingVertical: 6, paddingRight: 10 },
    commentsList: { paddingHorizontal: 14, paddingTop: 10 },
    commentLine: { marginBottom: 6 },
    commentContent: { flexDirection: 'row', flexWrap: 'wrap' },
    commentLineUser: { fontSize: 12, fontWeight: "800", color: "#1E1E1E" },
    commentLineText: { fontSize: 12, color: "#1E1E1E" },
    // 4. New Styles
    timeText: { fontSize: 11, color: "#888", marginTop: 4 },
    commentTime: { fontSize: 10, color: "#999" }
});