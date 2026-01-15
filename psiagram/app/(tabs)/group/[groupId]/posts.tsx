import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// --- Interfaces ---

interface Post {
  type: "post";
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

interface Event {
  type: "event";
  id: number;
  name: string;
  description: string;
  location: string | null;
  start_time: string;
  end_time: string;
  organizer: number;
  organizer_username: string;
  organizer_avatar: string | null;
  attendees_count: number;
  created_at: string;
}

type FeedItem = Post | Event;

export default function GroupFeedScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [eventsCursor, setEventsCursor] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");

  useEffect(() => {
    fetchGroupInfo();
    fetchFeed(true);
  }, [groupId]);

  const fetchGroupInfo = async () => {
    try {
        const id = Array.isArray(groupId) ? groupId[0] : groupId;
        const res = await client.get(`/api/groups/${id}/`);
        setGroupName(res.data.name);
    } catch (e) {
        console.error("Failed to load group info", e);
    }
  };

  const fetchFeed = async (reset = false) => {
    try {
      const id = Array.isArray(groupId) ? groupId[0] : groupId;
      
      const postsUrl = reset ? `/api/posts/group/${id}/` : postsCursor;
      const eventsUrl = reset ? `/api/events/group/${id}/` : eventsCursor;

      if (!reset && !postsUrl && !eventsUrl) return;

      const promises = [];
      if (postsUrl) promises.push(client.get(postsUrl));
      if (eventsUrl) promises.push(client.get(eventsUrl));

      if (promises.length === 0) return;

      const responses = await Promise.all(promises);

      let newItems: FeedItem[] = [];
      let nextPosts = reset ? null : postsCursor;
      let nextEvents = reset ? null : eventsCursor;

      let responseIndex = 0;
      
      if (postsUrl) {
        const pRes = responses[responseIndex++];
        const fetchedPosts = pRes.data.results.map((p: any) => ({ ...p, type: "post" }));
        newItems = [...newItems, ...fetchedPosts];
        nextPosts = pRes.data.next;
      }
      
      if (eventsUrl) {
        const eRes = responses[responseIndex++];
        const fetchedEvents = eRes.data.results.map((e: any) => ({ ...e, type: "event" }));
        newItems = [...newItems, ...fetchedEvents];
        nextEvents = eRes.data.next;
      }

      setPostsCursor(nextPosts);
      setEventsCursor(nextEvents);

      setFeedItems((prev) => {
        const combined = reset ? newItems : [...prev, ...newItems];
        // Sort descending by created_at
        return combined.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    } catch (error) {
      console.error("Group feed fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPostsCursor(null);
    setEventsCursor(null);
    fetchGroupInfo();
    fetchFeed(true);
  };

  const handleLoadMore = () => {
    if (!loading) {
      fetchFeed(false);
    }
  };

  const toggleLike = async (itemIndex: number) => {
    const item = feedItems[itemIndex];
    if (item.type !== 'post') return;

    const originalLiked = item.is_liked;
    const originalCount = item.likes_count;

    const updatedItems = [...feedItems];
    updatedItems[itemIndex] = {
      ...item,
      is_liked: !originalLiked,
      likes_count: originalLiked ? originalCount - 1 : originalCount + 1,
    } as Post;
    setFeedItems(updatedItems);

    try {
      await client.post(`/api/posts/${item.id}/like/`);
    } catch (error) {
      console.error("Like failed", error);
      const revertedItems = [...feedItems];
      revertedItems[itemIndex] = {
        ...item,
        is_liked: originalLiked,
        likes_count: originalCount,
      } as Post;
      setFeedItems(revertedItems);
    }
  };

  const renderItem = ({ item, index }: { item: FeedItem; index: number }) => {
    if (item.type === 'event') {
      return (
        <View style={[styles.postContainer, styles.eventContainer]}>
          {/* Header with Avatar */}
          <View style={styles.postHeader}>
             <Pressable onPress={() => router.push(`/user/${item.organizer}`)}>
                {item.organizer_avatar ? (
                  <Image source={{ uri: item.organizer_avatar }} style={styles.userAvatar} />
                ) : (
                  <View style={styles.userAvatar} />
                )}
            </Pressable>
            
            <View style={{marginLeft: 8, justifyContent: 'center'}}>
              <Text style={styles.username}>{item.organizer_username}</Text>
              <Text style={styles.eventLabel}>created an event</Text>
            </View>
          </View>
          
          <Pressable 
            onPress={() => router.push(`/event/${item.id}`)}
            style={styles.eventCard}
          >
            <Text style={styles.eventName}>{item.name}</Text>
            
            <Text style={styles.eventGroupText}>with {groupName}</Text>

            <Text style={styles.eventDate}>
              {new Date(item.start_time).toLocaleDateString()} at {new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
            <Text numberOfLines={2} style={styles.eventDesc}>{item.description}</Text>
            <View style={styles.eventFooter}>
               <Ionicons name="location-outline" size={16} color="#5F7751" />
               <Text style={styles.eventLocation}>{item.location || "Online"}</Text>
               <Text style={styles.attendeesCount}>{item.attendees_count} attending</Text>
            </View>
          </Pressable>
        </View>
      );
    }

    // Render Post
    const post = item as Post;
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Pressable
            style={styles.userRow}
            onPress={() => router.push(`/user/${post.author}`)}
          >
            {post.author_avatar ? (
              <Image source={{ uri: post.author_avatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatar} />
            )}
            <Text style={styles.username}>{post.author_username}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Image source={{ uri: post.image }} style={styles.postImage} />
        </Pressable>

        <View style={styles.actionsRow}>
          <View style={styles.actionGroup}>
            <Pressable
              onPress={() => toggleLike(index)}
              style={styles.iconBtn}
              hitSlop={10}
            >
              <Ionicons
                name={post.is_liked ? "paw" : "paw-outline"}
                size={28}
                color="#69324C"
              />
            </Pressable>
            <Text style={styles.countText}>{post.likes_count}</Text>
          </View>

          <View style={styles.actionGroup}>
            <Pressable
              onPress={() => router.push(`/post/${post.id}`)}
              style={styles.iconBtn}
              hitSlop={10}
            >
              <Ionicons name="chatbubble-outline" size={28} color="#69324C" />
            </Pressable>
            <Text style={styles.countText}>{post.comments_count}</Text>
          </View>
        </View>

        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.username}>{post.author_username}</Text> {post.caption}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </Pressable>
        <Text style={styles.headerTitle}>
            {groupName ? `${groupName}` : "Group Feed"}
        </Text>
        <Pressable onPress={() => router.push(`/(tabs)/group/${groupId}/info`)} hitSlop={10}>
          <Ionicons name="information-circle-outline" size={24} color="#1E1E1E" />
        </Pressable>
      </View>

      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#69324C" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          (loading && !refreshing) ? <ActivityIndicator size="small" color="#69324C" style={{ margin: 20 }} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            </View>
          ) : null
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAF7F0",
  },
  headerTitle: {
    fontSize: 14, fontWeight: "bold", color: "#1E1E1E",textTransform: 'lowercase', textAlign:"center"
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: "#FAF7F0",
  },
  eventContainer: {
    paddingHorizontal: 14,
  },
  postHeader: {
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
  eventLabel: {
    fontSize: 12,
    color: "#666",
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
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
  },
  // Event Styles
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9E3D8",
    gap: 6,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#69324C",
  },
  eventGroupText: {
      fontSize: 14,
      color: "#5F7751",
      fontWeight: "bold",
      marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#5F7751",
    fontWeight: "600",
  },
  eventDesc: {
    fontSize: 14,
    color: "#444",
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  eventLocation: {
    fontSize: 12,
    color: "#666",
    marginRight: 10,
  },
  attendeesCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: '600',
  }
});