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
  ActivityIndicator
} from "react-native";

export default function PostDetails() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await client.get(`api/posts/${postId}/`);
      setPost(res.data);
      // setLiked(res.data.is_liked) // If API returns this
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !post) {
     return <SafeAreaView style={styles.screen}><ActivityIndicator /></SafeAreaView>;
  }

  // Adjust display based on API data structure
  const likesToShow = liked ? (post.likes_count || 0) + 1 : (post.likes_count || 0);
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
             {/* Not all posts have author avatar in serializer, might need to fetch or include in serializer */}
            <View style={styles.userAvatar} /> 
            <Pressable onPress={() => router.push(`/user/${post.author}`)}>
              <Text style={styles.headerTitle}>{post.author_username}</Text>
            </Pressable>
          </View>

          <View style={styles.photoWrap}>
            <Image source={{ uri: post.image }} style={styles.photo} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionGroup}>
              <Pressable style={styles.actionBtn} onPress={() => setLiked((p) => !p)} hitSlop={8}>
                <Ionicons name={liked ? "paw" : "paw-outline"} size={30} color="#69324C" />
              </Pressable>
              <View style={styles.countsRow}>
                <Text style={styles.countText}>{likesToShow}</Text>
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
            <Text style={styles.captionUser}>{post.author_username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>

          <View style={styles.commentBox}>
              <View style={styles.commentRow}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="add a comment"
                  placeholderTextColor="#777"
                  style={styles.commentInput}/>
                  <Pressable onPress={() => setCommentText("")} hitSlop={8}>
                    <Ionicons name="send" size={20} color="#69324C" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    // ... (Use same styles as provided in the uploaded file)
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
});