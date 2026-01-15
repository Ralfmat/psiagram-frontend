import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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

interface Notification {
  id: number;
  sender: number;
  sender_username: string;
  sender_avatar: string | null;
  notification_type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  post: number | null;
  post_image: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const weeks = Math.floor(diffInDays / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await client.get("/api/notifications/");
      setNotifications(res.data.results || res.data);
      
      // Mark as read immediately after fetching
      await client.post("/api/notifications/mark-read/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handlePress = (item: Notification) => {
    if (item.notification_type === "FOLLOW") {
      router.push(`/user/${item.sender}`);
    } else if (item.post) {
      router.push(`/post/${item.post}`);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    let message = "";
    let icon = "";

    switch (item.notification_type) {
      case "LIKE":
        message = "gave bone to your post!";
        icon = "heart";
        break;
      case "COMMENT":
        message = "commented on your post!";
        icon = "chatbubble";
        break;
      case "FOLLOW":
        message = "started following you!";
        icon = "person-add";
        break;
    }

    return (
      <Pressable 
        style={[styles.row, !item.is_read && styles.unreadRow]} 
        onPress={() => handlePress(item)}
      >
        <View style={styles.avatarContainer}>
            {item.sender_avatar ? (
                <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, { backgroundColor: "#E9E3D8" }]} />
            )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.textLine}>
            <Text style={styles.username}>{item.sender_username}</Text> <Text style={styles.message}>{message}</Text>            
          </Text>
          <Text style={styles.timeText}> {timeAgo(item.created_at)}</Text>
        </View>

        {item.post_image ? (
          <Image source={{ uri: item.post_image }} style={styles.postThumb} />
        ) : (
           <Ionicons name={icon as any} size={24} color="#69324C" />
        )}
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return <SafeAreaView style={styles.screen}><ActivityIndicator /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBar}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#69324C" />
          <Text style={styles.backText}>back</Text>
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>notifications</Text>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#69324C"/>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No new notifications</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  
  headerBar: { 
    height: 56, 
    paddingHorizontal: 14, 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FAF7F0" 
  },
  backRow: { flexDirection: "row", alignItems: "center", width: 60 },
  backText: { color: "#69324C", fontSize: 14, fontWeight: "700", textTransform: "lowercase" },

  pageTitle: { fontSize: 14, fontWeight: "bold", color: "#1E1E1E",textTransform: 'lowercase', textAlign:"center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  unreadRow: {
    backgroundColor: "#F2EBE0", 
  },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  textContainer: { flex: 1, marginRight: 10 ,alignItems: 'flex-start',},
  textLine: { fontSize: 14, color: "#1E1E1E", lineHeight: 20 },
  username: { fontWeight: "bold" },
  message: { color: "#1E1E1E" },
  timeText: { color: "#888", fontSize: 12 }, 
  postThumb: { width: 44, height: 44, borderRadius: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' }
});