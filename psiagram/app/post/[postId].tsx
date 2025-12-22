import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PostDetails() {
  const { id, uri } = useLocalSearchParams<{ id: string; uri?: string }>();

  // fake post, potem z backu
  const post = useMemo(
    () => ({
      id: id ?? "1",
      username: "janekkowalski",
      avatarUri: "https://picsum.photos/seed/user_11/120/120",
      imageUri: uri ?? "https://picsum.photos/seed/post_fallback/900/900",
      likes: 257,
      commentsCount: 17,
      caption: "ha! ha! mega happy piesek",
    }),
    [id, uri]
  );

  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  const comments = useMemo(
    () => [
      { id: "c2", user: "niunia1", text: "wow faktycznie mega happy" },
      { id: "c3", user: "niunia", text: "wow faktycznie mega happy" },
      { id: "c4", user: "ariszka", text: "wow faktycznie mega happy" },
      { id: "c5", user: "gotka", text: "wow faktycznie mega happy" },
      { id: "c6", user: "mati", text: "wow faktycznie mega happy" },
      { id: "c7", user: "wanda", text: "wow faktycznie mega happy" },
      { id: "c8", user: "krzychu", text: "piękny pieseczek" },
    ],
    []
  );

  const likesToShow = liked ? post.likes + 1 : post.likes;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={30} color="#69324C" />
              <Text style={styles.backText}>back</Text>
            </Pressable>

            <View style={{ width: 70 }} />
          </View>

          <View style={styles.userRow}>
            <Image source={{ uri: post.avatarUri }} style={styles.userAvatar} />

            <Pressable onPress={() => router.push(`/user/${post.username}`)}>
              <Text style={styles.headerTitle}>{post.username}</Text>
            </Pressable>

          </View>

          <View style={styles.photoWrap}>
            <Image source={{ uri: post.imageUri }} style={styles.photo} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionGroup}>
                
              <Pressable
                style={styles.actionBtn}
                onPress={() => setLiked((p) => !p)}
                hitSlop={8}
              >
                <Ionicons
                  name={liked ? "paw" : "paw-outline"}
                  size={30}
                  color="#69324C"
                />
              </Pressable>
              <View style={styles.countsRow}>
                <Text style={styles.countText}>{likesToShow}</Text>
              </View> 
            </View>

            <View style={styles.actionGroup}>
              <Pressable style={styles.actionBtn} hitSlop={8}>
                <Ionicons
                  name="chatbubble-outline"
                  size={30}
                  color="#69324C"
                />
              </Pressable>

              <View style={styles.countsRow}>
                <Text style={styles.countText}>{post.commentsCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.captionRow}>
            <Text style={styles.captionUser}>{post.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>

          <View style={styles.commentBox}>
            <Text style={styles.commentUser}>zuzannanowak</Text>
              <View style={styles.commentRow}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="add a comment"
                  placeholderTextColor="#777"
                  style={styles.commentInput}/>

                  <Pressable
                    onPress={() => {
                      if (!commentText.trim()) return;
                      // tu później: wysyłanie komentarza
                      setCommentText("");
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="send"
                      size={20}
                      color={commentText ? "#69324C" : "#69324C"}
                    />
                  </Pressable>
              </View>
           </View>

          <View style={styles.commentsList}>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentLine}>

                <Pressable onPress={() => router.push({ pathname: "/user/[userId]", params: { userId: c.user } })}>
                  <Text style={styles.commentLineUser}>{c.user}  </Text>
                </Pressable>

                <Text style={styles.commentLineText}>{c.text}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF7F0",
    marginBottom: 20,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
  },
  backText: {
    color: "#69324C",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  headerCenter: {
    alignItems: "center",
    marginTop: 25,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E1E1E",
    textTransform: "lowercase",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 1,
  },

  userRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E9E3D8",
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  photoWrap: {
    paddingHorizontal: 14,
  },
  photo: {
    width: "100%",
    height: 360,
    borderRadius: 8,
    backgroundColor: "#E9E3D8",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionsRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countText: {
    fontSize: 15,
    color: "#1E1E1E",
    fontWeight: "bold",
  },

  captionRow: {
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  captionUser: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  captionText: {
    fontSize: 13,
    color: "#1E1E1E",
  },

  commentBox: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "#F7F4EE",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00000022",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E1E1E",
    paddingVertical: 6,
    paddingRight: 10,
  },

  commentsList: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  commentLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  commentLineUser: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  commentLineText: {
    fontSize: 12,
    color: "#1E1E1E",
  },
});
