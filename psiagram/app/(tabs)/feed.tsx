import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
  group: number | null;
  group_name: string | null;
}

interface Event {
  type: "event";
  id: number;
  name: string;
  description: string;
  location: string | null;
  start_time: string;
  end_time: string;
  group: number | null;
  group_name: string | null;
  organizer: number;
  organizer_username: string;
  organizer_avatar: string | null; // Added avatar field
  attendees_count: number;
  created_at: string;
}

type FeedItem = Post | Event;

export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // We keep track of cursors for both streams
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [eventsCursor, setEventsCursor] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed(true);
  }, []);

  const fetchFeed = async (reset = false) => {
    try {
      const postsUrl = reset ? "api/posts/feed/" : postsCursor;
      const eventsUrl = reset ? "api/events/feed/" : eventsCursor;

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
        return combined.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    } catch (error) {
      console.error("Feed fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPostsCursor(null);
    setEventsCursor(null);
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
      await client.post(`api/posts/${item.id}/like/`);
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
      return renderEvent(item);
    }
    return renderPost(item, index);
  };

  const renderEvent = (event: Event) => (
    <View style={[styles.postContainer, styles.eventContainer]}>
      {/* Header with Avatar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push(`/user/${event.organizer}`)}>
            {event.organizer_avatar ? (
              <Image source={{ uri: event.organizer_avatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatar} />
            )}
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.username}>{event.organizer_username}</Text>
          <Text style={styles.eventLabel}>created an event</Text>
        </View>
      </View>
      
      <Pressable 
        onPress={() => router.push(`/event/${event.id}`)}
        style={styles.eventCard}
      >
        <Text style={styles.eventName}>{event.name}</Text>
        
        {event.group_name && (
            <Text style={styles.eventGroupText}>with {event.group_name}</Text>
        )}

        <Text style={styles.eventDate}>
          {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
        <Text numberOfLines={2} style={styles.eventDesc}>{event.description}</Text>
        <View style={styles.eventFooter}>
           <Ionicons name="location-outline" size={16} color="#5F7751" />
           <Text style={styles.eventLocation}>{event.location || "Online"}</Text>
           <Text style={styles.attendeesCount}>{event.attendees_count} attending</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderPost = (item: Post, index: number) => (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push(`/user/${item.author}`)}>
            {item.author_avatar ? (
              <Image source={{ uri: item.author_avatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatar} />
            )}
        </Pressable>
        
        <View style={styles.headerTextContainer}>
          <Pressable onPress={() => router.push(`/user/${item.author}`)}>
             <Text style={styles.username}>{item.author_username}</Text>
          </Pressable>
          
          {item.group_name && (
             <Pressable onPress={() => router.push(`/(tabs)/group/${item.group}/posts`)}>
                 <Text style={styles.groupText}>in {item.group_name}</Text>
             </Pressable>
          )}
        </View>
      </View>

      <Pressable onPress={() => router.push(`/post/${item.id}`)}>
        <Image source={{ uri: item.image }} style={styles.postImage} />
      </Pressable>

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
            (!loading && feedItems.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Your feed is empty.</Text>
                    <Text style={styles.emptySubText}>Join groups or follow users to see content here!</Text>
                </View>
            ) : null
        }
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
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
  eventContainer: {
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9E3D8",
  },
  headerTextContainer: {
    justifyContent: 'center',
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
  groupText: {
    fontSize: 12,
    color: "#5F7751",
    fontWeight: "600",
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
  // Event specific styles
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
  },
  // Empty State
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
      paddingHorizontal: 20
  },
  emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#69324C',
      marginBottom: 8
  },
  emptySubText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center'
  }
});