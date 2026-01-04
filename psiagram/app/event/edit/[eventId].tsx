import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router"; // Added useNavigation
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from "react-native";
import { useSession } from "@/context/ctx";

interface EventDetail {
  id: number;
  name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  organizer: number;
  organizer_username: string;
  attendees_count: number;
  is_attending: boolean;
  group_name: string | null;
  group: number | null;
}

export default function EventScreen() {
  const params = useLocalSearchParams();
  const eventId = params.id || params.eventId;
  
  const router = useRouter();
  const navigation = useNavigation(); // Hook to check navigation history
  const { session } = useSession();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      try {
        const parsed = JSON.parse(session);
        const uid = parsed?.user?.id || parsed?.user?.pk;
        if (uid) {
          setCurrentUserId(Number(uid));
        }
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }

    client.get('/api/users/me/')
      .then(response => {
        if (response.data && response.data.id) {
          setCurrentUserId(response.data.id);
        }
      })
      .catch(err => {
        console.log("Could not fetch user details", err);
      });

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, session]);

  const fetchEventDetails = async () => {
    try {
      const response = await client.get(`/api/events/${eventId}/`);
      setEvent(response.data);
    } catch (error) {
      console.error("Fetch event error:", error);
      Alert.alert("Error", "Could not load event details.");
    } finally {
      setLoading(false);
    }
  };

  // --- SAFE BACK NAVIGATION HANDLER ---
  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      // Fallback if opened directly (e.g. via link or refresh)
      router.replace("/(tabs)/feed");
    }
  };

  const handleJoinLeave = async () => {
    if (!event) return;
    setJoining(true);
    try {
      const response = await client.post(`/api/events/${event.id}/join/`);
      const newStatus = response.data.status === 'joined';
      
      setEvent(prev => prev ? ({
          ...prev,
          is_attending: newStatus,
          attendees_count: prev.is_attending ? prev.attendees_count - 1 : prev.attendees_count + 1
      }) : null);

    } catch (error) {
      console.error("Join event error:", error);
      Alert.alert("Error", "Failed to update attendance.");
    } finally {
      setJoining(false);
    }
  };

  const performDelete = async () => {
    try {
      await client.delete(`/api/events/${eventId}/`);
      
      if (Platform.OS === 'web') {
          window.alert("Event has been deleted.");
      } else {
          Alert.alert("Deleted", "Event has been deleted.");
      }
      handleBack(); // Use safe back handler
    } catch (error) {
      console.error("Delete failed", error);
      if (Platform.OS === 'web') {
          window.alert("Failed to delete event.");
      } else {
          Alert.alert("Error", "Failed to delete event.");
      }
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            performDelete();
        }
    } else {
        Alert.alert(
          "Delete Event",
          "Are you sure you want to delete this event? This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive",
              onPress: performDelete
            }
          ]
        );
    }
  };

  const isOrganizer = event && currentUserId && Number(event.organizer) === Number(currentUserId);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#69324C" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found.</Text>
        {/* Use handleBack here */}
        <Pressable onPress={handleBack}>
            <Text style={{color: '#69324C', marginTop: 10, fontWeight: 'bold'}}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        {/* Use handleBack here */}
        <Pressable onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Event Details</Text>
        
        {isOrganizer ? (
           <View style={styles.headerActions}>
             <Pressable onPress={() => router.push(`/event/edit/${event.id}`)} hitSlop={10}>
               <Ionicons name="pencil" size={22} color="#1E1E1E" />
             </Pressable>
             <Pressable onPress={handleDelete} hitSlop={10}>
               <Ionicons name="trash-outline" size={22} color="#D32F2F" />
             </Pressable>
           </View>
        ) : (
           <View style={{ width: 24 }} /> 
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            {event.group_name && (
                <Pressable onPress={() => router.push(`/(tabs)/group/${event.group}/posts`)}>
                     <Text style={styles.groupName}>{event.group_name}</Text>
                </Pressable>
            )}
            
            <Text style={styles.title}>{event.name}</Text>
            
            <View style={styles.organizerRow}>
                <Text style={styles.label}>Hosted by </Text>
                <Pressable onPress={() => router.push(`/user/${event.organizer}`)}>
                    <Text style={styles.organizer}>{event.organizer_username}</Text>
                </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={24} color="#69324C" />
                <View>
                    <Text style={styles.infoTitle}>When</Text>
                    <Text style={styles.infoText}>
                        {new Date(event.start_time).toLocaleDateString()}
                    </Text>
                    <Text style={styles.infoSubText}>
                        {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={24} color="#69324C" />
                <View>
                    <Text style={styles.infoTitle}>Where</Text>
                    <Text style={styles.infoText}>{event.location || "Online Event"}</Text>
                </View>
            </View>
            
            <View style={styles.descContainer}>
                <Text style={styles.infoTitle}>About</Text>
                <Text style={styles.descText}>{event.description}</Text>
            </View>

            <View style={styles.attendeesContainer}>
                <Ionicons name="people" size={20} color="#5F7751" />
                <Text style={styles.attendeesText}>{event.attendees_count} people attending</Text>
            </View>

            <Pressable 
                style={[styles.joinBtn, event.is_attending && styles.leaveBtn]} 
                onPress={handleJoinLeave}
                disabled={joining}
            >
                {joining ? (
                    <ActivityIndicator color={event.is_attending ? "#69324C" : "#FFF"} />
                ) : (
                    <Text style={[styles.joinBtnText, event.is_attending && styles.leaveBtnText]}>
                        {event.is_attending ? "Leave Event" : "Join Event"}
                    </Text>
                )}
            </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E1E1E",
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  groupName: {
      fontSize: 12,
      color: "#5F7751",
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: 4,
  },
  title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1E1E1E",
      marginBottom: 8,
  },
  organizerRow: {
      flexDirection: "row",
      marginBottom: 16,
  },
  label: {
      color: "#666",
      fontSize: 14,
  },
  organizer: {
      color: "#1E1E1E",
      fontWeight: "bold",
      fontSize: 14,
  },
  divider: {
      height: 1,
      backgroundColor: "#EEE",
      marginBottom: 16,
  },
  infoRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20,
  },
  infoTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#1E1E1E",
      marginBottom: 2,
  },
  infoText: {
      fontSize: 16,
      color: "#333",
  },
  infoSubText: {
      fontSize: 14,
      color: "#666",
  },
  descContainer: {
      marginBottom: 20,
  },
  descText: {
      fontSize: 15,
      color: "#444",
      lineHeight: 22,
      marginTop: 4,
  },
  attendeesContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 24,
      backgroundColor: "#F2F5F0",
      padding: 10,
      borderRadius: 8,
  },
  attendeesText: {
      color: "#5F7751",
      fontWeight: "600",
  },
  joinBtn: {
      backgroundColor: "#69324C",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
  },
  joinBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
  },
  leaveBtn: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#69324C",
  },
  leaveBtnText: {
      color: "#69324C",
  }
});