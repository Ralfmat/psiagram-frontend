import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from "expo-router";
import client from "../../api/client";

const { width } = Dimensions.get("window");
const SIDE = Math.min(width - 36, 360);

// --- API HELPERS ---

async function checkDogInPhoto(uri: string): Promise<{ approved: boolean, file_key?: string }> {
  try {
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const initRes = await client.post("/api/v1/rekognition/initiate-upload/", {
      filename,
      content_type: type,
    });
    const { upload_url, file_key } = initRes.data;

    const imageBlob = await fetch(uri).then((r) => r.blob());
    await fetch(upload_url, {
      method: "PUT",
      body: imageBlob,
      headers: { "Content-Type": type },
    });

    const compRes = await client.post("/api/v1/rekognition/upload-complete/", {
      file_key,
    });

    return {
      approved: compRes.data.status === "approved",
      file_key: file_key
     };
  } catch (error: any) {
    console.error("Check Dog Error:", error);
    return { approved: false };
  }
}

async function publishPost(payload: {
  s3_key?: string;
  caption: string;
  groupId: string | null;
}) {
  if (payload.s3_key) {
    const response = await client.post("/api/posts/create/", {
      caption: payload.caption,
      s3_key: payload.s3_key,
      group: payload.groupId,
    });
    return { ok: response.status === 201 };
  }
  return { ok: false };
}

async function createEvent(payload: {
  name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  groupId: string | null;
}) {
  const response = await client.post("/api/events/create/", {
    name: payload.name,
    description: payload.description,
    location: payload.location,
    start_time: payload.start_time,
    end_time: payload.end_time,
    group: payload.groupId,
  });
  return { ok: response.status === 201 };
}

// --- HELPER COMPONENTS ---

// Custom Field to handle Date/Time picking on both iOS (inline/modal) and Android (dialog)
const DateTimeField = ({ label, date, setDate }: { label: string, date: Date, setDate: (d: Date) => void }) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const onChange = (event: any, selectedDate?: Date) => {
    // On Android, dismissing the dialog returns undefined selectedDate
    if (!selectedDate) {
      setShow(false);
      return;
    }

    const currentDate = selectedDate;
    
    if (Platform.OS === 'android') {
      setShow(false); // Hide the current picker
      if (mode === 'date') {
        // If we just picked a date, preserve the time from the previous state but update the date
        const newDate = new Date(date);
        newDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        setDate(newDate);
        
        // Immediately show time picker for smooth UX
        setMode('time');
        setShow(true);
      } else {
        // We just picked a time, update the hours/mins
        const newDate = new Date(date);
        newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
        setDate(newDate);
        setMode('date'); // Reset for next time
      }
    } else {
      // iOS
      setDate(currentDate);
    }
  };

  const showDatepicker = () => {
    setMode('date');
    setShow(true);
  };

  // Format for display
  const displayValue = date.toLocaleString([], { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <View style={styles.dateFieldContainer}>
      <Text style={styles.sectionLabel}>{label}</Text>
      
      {Platform.OS === 'android' && (
        <Pressable onPress={showDatepicker} style={styles.dateInput}>
          <Text style={styles.dateInputText}>{displayValue}</Text>
          <Ionicons name="calendar-outline" size={20} color="#69324C" />
        </Pressable>
      )}

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          onChange={onChange}
        />
      )}

      {Platform.OS === 'ios' && (
         <View style={styles.iosPickerContainer}>
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="datetime"
              display="compact"
              onChange={onChange}
              style={{ alignSelf: 'flex-start' }}
              themeVariant="light"
            />
         </View>
      )}
    </View>
  );
};


// --- MAIN COMPONENT ---

type Group = { id: string; name: string };
type Mode = "POST" | "EVENT";

export default function CreateScreen() {
  const [mode, setMode] = useState<Mode>("POST");
  const [loading, setLoading] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Shared State
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Post State
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [postS3Key, setPostS3Key] = useState<string | null>(null);
  const [checkingDog, setCheckingDog] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [dogCheckFailed, setDogCheckFailed] = useState(false);

  // Event State
  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLoc, setEventLoc] = useState("");
  
  // Initialize start time to next hour, end time to hour after that
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });

  // Load Groups on Mount
  useEffect(() => {
    client.get("/api/groups/my_groups/")
      .then(res => setMyGroups(res.data))
      .catch(err => console.log("Failed to load groups", err));
  }, []);
  const handleSuccessConfirm = () => {
      setShowSuccessModal(false);
      router.replace("/(tabs)/feed");
  };
  // --- Handlers: Post ---

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPostImageUri(uri);
      setDogCheckFailed(false);
      setPostS3Key(null);
      
      // Auto-check immediately for better UX
      setCheckingDog(true);
      const check = await checkDogInPhoto(uri);
      setCheckingDog(false);

      if (check.approved && check.file_key) {
        setPostS3Key(check.file_key);
      } else {
        setDogCheckFailed(true);
      }
    }
  };

  const handleSubmitPost = async () => {
    if (!postS3Key) return;
    try {
      setLoading(true);
      await publishPost({
        s3_key: postS3Key,
        caption: postCaption.trim(),
        groupId: selectedGroupId,
      });

      setShowSuccessModal(true);
      Alert.alert("Success", "Post published!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/feed") }
      ]);

      // Reset
      setPostImageUri(null);
      setPostCaption("");
      setPostS3Key(null);
      setSelectedGroupId(null);
    } catch (e) {
      Alert.alert("Error", "Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Event ---

  const handleSubmitEvent = async () => {
    if (!eventName) {
      Alert.alert("Missing Info", "Please enter an event name.");
      return;
    }
    if (endTime <= startTime) {
      Alert.alert("Invalid Time", "End time must be after start time.");
      return;
    }

    try {
      setLoading(true);
      await createEvent({
        name: eventName,
        description: eventDesc,
        location: eventLoc,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        groupId: selectedGroupId,
      });

      setShowSuccessModal(true);
      Alert.alert("Success", "Event created!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/feed") }
      ]);

      // Reset
      setEventName("");
      setEventDesc("");
      setEventLoc("");
      setSelectedGroupId(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  // --- Renders ---

  const renderGroupSelector = () => (
    <View style={styles.groupSection}>
      <Text style={styles.sectionLabel}>post to...</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupScroll}>
        <Pressable
          style={[styles.groupChip, selectedGroupId === null && styles.groupChipSelected]}
          onPress={() => setSelectedGroupId(null)}
        >
          <Text style={[styles.groupChipText, selectedGroupId === null && styles.groupChipTextSelected]}>
            Public Feed
          </Text>
        </Pressable>
        {myGroups.map((g) => {
          const isSelected = selectedGroupId === g.id;
          return (
            <Pressable
              key={g.id}
              style={[styles.groupChip, isSelected && styles.groupChipSelected]}
              onPress={() => setSelectedGroupId(g.id)}
            >
              <Text style={[styles.groupChipText, isSelected && styles.groupChipTextSelected]}>
                {g.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderPostForm = () => (
    <View>
      <Pressable onPress={handlePickImage} style={styles.imagePicker}>
        {postImageUri ? (
          <Image source={{ uri: postImageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#69324C" />
            <Text style={styles.placeholderText}>Tap to select photo</Text>
          </View>
        )}
        
        {/* Overlays for Check Status */}
        {checkingDog && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FAF7F0" />
            <Text style={styles.overlayText}>Checking for dog...</Text>
          </View>
        )}
        {dogCheckFailed && !checkingDog && postImageUri && (
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.overlayText}>No dog detected!</Text>
            <Text style={styles.overlaySubText}>Please choose another photo.</Text>
          </View>
        )}
      </Pressable>

      {/* Only show form if image is valid */}
      {postS3Key && (
        <View style={styles.formBody}>
          <Text style={styles.sectionLabel}>caption</Text>
          <TextInput
            style={styles.inputMultiline}
            placeholder="what's your dog thinking?"
            multiline
            value={postCaption}
            onChangeText={setPostCaption}
          />
          
          {renderGroupSelector()}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]} 
            onPress={handleSubmitPost}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FAF7F0"/> : <Text style={styles.submitBtnText}>publish post</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEventForm = () => (
    <View style={styles.formBody}>
      <Text style={styles.sectionLabel}>Event Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Sunday Park Walk"
        value={eventName}
        onChangeText={setEventName}
      />

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput
        style={styles.inputMultiline}
        placeholder="Details about the event..."
        multiline
        value={eventDesc}
        onChangeText={setEventDesc}
      />

      <Text style={styles.sectionLabel}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Central Park"
        value={eventLoc}
        onChangeText={setEventLoc}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
            <DateTimeField label="Start Time" date={startTime} setDate={setStartTime} />
        </View>
        <View style={{ flex: 1 }}>
            <DateTimeField label="End Time" date={endTime} setDate={setEndTime} />
        </View>
      </View>

      {renderGroupSelector()}

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.disabledBtn]} 
        onPress={handleSubmitEvent}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FAF7F0"/> : <Text style={styles.submitBtnText}>create event</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* Header Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable 
              style={[styles.toggleBtn, mode === "POST" && styles.toggleBtnActive]}
              onPress={() => setMode("POST")}
            >
              <Text style={[styles.toggleText, mode === "POST" && styles.toggleTextActive]}>create post</Text>
            </Pressable>
            <Pressable 
              style={[styles.toggleBtn, mode === "EVENT" && styles.toggleBtnActive]}
              onPress={() => setMode("EVENT")}
            >
              <Text style={[styles.toggleText, mode === "EVENT" && styles.toggleTextActive]}>create event</Text>
            </Pressable>
          </View>

          {mode === "POST" ? renderPostForm() : renderEventForm()}

        </ScrollView>
      </KeyboardAvoidingView>
<Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            <Pressable style={styles.closeModalBtn} onPress={handleSuccessConfirm}>
                <Ionicons name="close" size={20} color="#2F4F2F" />
            </Pressable>
           
            <Text style={styles.successTitle}>
                your {mode === "EVENT" ? "event" : "post"} has been created
            </Text>
            
            <Image 
                source={require("@/assets/images/dog.png")}
                style={styles.successImage}
                resizeMode="contain"
            />

            <TouchableOpacity style={styles.yippeeBtn} onPress={handleSuccessConfirm}>
                <Text style={styles.yippeeText}>yippee!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF7F0" },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E9E3D8",
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  toggleBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  toggleText: { fontWeight: "600", color: "#888" },
  toggleTextActive: { color: "#69324C", fontWeight: "800" },

  imagePicker: {
    width: width - 32,
    height: width - 32,
    backgroundColor: "#E9E3D8",
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", gap: 8 },
  placeholderText: { color: "#69324C", fontWeight: "600" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  overlayText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginTop: 10 },
  overlaySubText: { color: "#fff", fontSize: 14 },

  formBody: { paddingHorizontal: 16 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#5F7751", marginBottom: 6, textTransform: "lowercase" },
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
  inputMultiline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row" },
  
  // Date Fields
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
  
  groupSection: { marginBottom: 20 },
  groupScroll: { gap: 8 },
  groupChip: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  groupChipSelected: {
    backgroundColor: "#69324C",
    borderColor: "#69324C",
  },
  groupChipText: { color: "#69324C", fontWeight: "600" },
  groupChipTextSelected: { color: "#fff" },

  submitBtn: {
    backgroundColor: "#69324C",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B380C", 
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    marginTop: 10,
  },
  successImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  yippeeBtn: {
    backgroundColor: "#69324C",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  yippeeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  }

});