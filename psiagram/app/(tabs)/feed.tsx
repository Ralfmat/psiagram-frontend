import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";

interface Post {
  id: number;
  author: number;
  author_username: string;
  image: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  author_avatar: string | null;
}


export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (url?: string | null) => {
    if (url === null) return;

    try {
      // If no URL provided, we are fetching the first page (feed/)
      const endpoint = url || "api/posts/feed/";
      
      // Note: If 'url' comes from 'next', it's an absolute URL. 
      // client.get handles absolute URLs correctly by ignoring baseURL.
      const response = await client.get(endpoint);

      const newPosts = response.data.results;
      const nextLink = response.data.next;

      setPosts((prev) => (url ? [...prev, ...newPosts] : newPosts));
      setNextCursor(nextLink);
    } catch (error) {
      console.error("Feed fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setNextCursor(null);
    fetchPosts();
  };

  const handleLoadMore = () => {
    if (!loading && nextCursor) {
      fetchPosts(nextCursor);
    }
  };

  const toggleLike = async (postIndex: number) => {
    const post = posts[postIndex];
    const originalLiked = post.is_liked;
    const originalCount = post.likes_count;

    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...post,
      is_liked: !originalLiked,
      likes_count: originalLiked ? originalCount - 1 : originalCount + 1,
    };
    setPosts(updatedPosts);

    try {
      await client.post(`api/posts/${post.id}/like/`);
    } catch (error) {
      console.error("Like failed", error);
      const revertedPosts = [...posts];
      revertedPosts[postIndex] = {
        ...post,
        is_liked: originalLiked,
        likes_count: originalCount,
      };
      setPosts(revertedPosts);
    }
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <View style={styles.postContainer}>
      {/* Header: User Info */}
      <View style={styles.header}>
        <Pressable
          style={styles.userRow}
          onPress={() => router.push(`/user/${item.author}`)}
        >
          {item.author_avatar ? (
            <Image source={{ uri: item.author_avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatar} />
          )}
          <Text style={styles.username}>{item.author_username}</Text>
        </Pressable>
      </View>

      {/* Post Image */}
      <Pressable onPress={() => router.push(`/post/${item.id}`)}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </Pressable>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={() => toggleLike(index)}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons
              name={item.is_liked ? "paw" : "paw-outline"}
              size={28}
              color="#69324C"
            />
          </Pressable>
          <Text style={styles.countText}>{item.likes_count}</Text>
        </View>

        <View style={styles.actionGroup}>
          <Pressable
            onPress={() => router.push(`/post/${item.id}`)}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons name="chatbubble-outline" size={28} color="#69324C" />
          </Pressable>
          <Text style={styles.countText}>{item.comments_count}</Text>
        </View>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.username}>{item.author_username}</Text> {item.caption}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#69324C" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          (loading && !refreshing) ? <ActivityIndicator size="small" color="#69324C" style={{ margin: 20 }} /> : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: "#FAF7F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E9E3D8",
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E1E1E",
  },
  postImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#E9E3D8",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 16,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    padding: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  captionText: {
    fontSize: 14,
    color: "#1E1E1E",
    lineHeight: 18,
  },
});