import client from "@/api/client";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';


export default function EditEventScreen() {
  const params = useLocalSearchParams();
  const eventId = params.id || params.eventId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await client.get(`/api/events/${eventId}/`);
      const data = response.data;
      
      setName(data.name);
      setDescription(data.description);
      setLocation(data.location || "");
      if (data.start_time) setStartTime(new Date(data.start_time));
      if (data.end_time) setEndTime(new Date(data.end_time));
      
    } catch (error) {
      console.error("Fetch event error:", error);
      Alert.alert("Error", "Could not load event details.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Event name is required.");
      return;
    }
    if (endTime <= startTime) {
      Alert.alert("Error", "End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await client.patch(`/api/events/${eventId}/`, {
        name,
        description,
        location,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });
      
      Alert.alert("Success", "Event updated successfully!");
      router.back(); // Go back to Detail page
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert("Error", "Failed to update event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
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
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      await client.delete(`/api/events/${eventId}/`);
      Alert.alert("Deleted", "Event has been deleted.");
      // Navigate back to Feed or previous screen (pop twice: edit -> detail -> feed)
      router.dismissAll(); 
      router.replace("/(tabs)/feed");
    } catch (error) {
      console.error("Delete failed", error);
      Alert.alert("Error", "Failed to delete event.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#69324C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color="#1E1E1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            
            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Event Name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
            />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <DateTimeField label="Start Time" date={startTime} setDate={setStartTime} />
                </View>
                <View style={{ flex: 1 }}>
                    <DateTimeField label="End Time" date={endTime} setDate={setEndTime} />
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.disabledBtn]} 
              onPress={handleUpdate}
              disabled={saving || deleting}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Delete Button */}
            <TouchableOpacity 
              style={[styles.deleteBtn, deleting && styles.disabledBtn]} 
              onPress={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? (
                 <ActivityIndicator color="#D32F2F" />
              ) : (
                 <Text style={styles.deleteBtnText}>Delete Event</Text>
              )}
            </TouchableOpacity>

          </View>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5F7751",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sectionLabel: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#5F7751", 
    marginBottom: 6, 
    textTransform: "uppercase" 
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    color: "#333",
  },
  textArea: {
    minHeight: 80,
  },
  row: { 
    flexDirection: "row",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 20,
  },
  saveBtn: {
    backgroundColor: "#69324C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  
  // Date Picker Styles
  dateFieldContainer: { marginBottom: 16 },
  dateInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateInputText: { fontSize: 14, color: "#333" },
  iosPickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'flex-start'
  },
});