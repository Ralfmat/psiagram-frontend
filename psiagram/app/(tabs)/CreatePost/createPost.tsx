import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client"; // Import your axios client

const { width } = Dimensions.get("window");
const SIDE = Math.min(width - 36, 360);

/**
 * Checks if a dog is present in the photo using the backend's AWS Rekognition flow.
 * 1. Get presigned URL.
 * 2. Upload to S3.
 * 3. Verify content.
 */
async function checkDogInPhoto(uri: string): Promise<{ approved: boolean, file_key?: string }> {
  try {
    // 1. Prepare file metadata
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // 2. Initiate Upload (Get Presigned URL)
    const initRes = await client.post("/api/v1/rekognition/initiate-upload/", {
      filename,
      content_type: type,
    });
    const { upload_url, file_key } = initRes.data;

    // 3. Upload to S3 directly
    // We use standard 'fetch' here instead of 'client' to avoid attaching the 
    // Django Auth token to the AWS request (which would cause a 400/403 error).
    const imageBlob = await fetch(uri).then((r) => r.blob());
    
    await fetch(upload_url, {
      method: "PUT",
      body: imageBlob,
      headers: {
        "Content-Type": type,
      },
    });

    // 4. Complete & Analyze
    const compRes = await client.post("/api/v1/rekognition/upload-complete/", {
      file_key,
    });

    // The backend returns { status: "approved" | "rejected", ... }
    return {
      approved: compRes.data.status === "approved",
      file_key: file_key
     };

  } catch (error: any) {
    console.error("Check Dog Error:", error.response?.data || error.message);
    // If rejected by logic (400), return false. For other errors, you might want to show an alert.
    return { approved: false };
  }
}

/**
 * Publishes the post to the main feed.
 * Sends data as multipart/form-data.
 */
async function publishPost(payload: {
  s3_key?: string;
  imageUri?: string; // Fallback, if we change the approach
  caption: string;
  shareOnProfile: boolean;
  groupIds: string[];
}) {

  // If we have an S3 Key, send a lightweight JSON request
  if (payload.s3_key) {
    const response = await client.post("api/posts/create/", {
      caption: payload.caption,
      s3_key: payload.s3_key,
      // groupIds: payload.groupIds (add when backend supports it)
    });
    return { ok: response.status === 201 };
  }

  // Fallback: If no s3_key, use the old FormData method (omitted for brevity)
  return { ok: false };
  // const formData = new FormData();

  // // Append simple data
  // formData.append("caption", payload.caption);
  
  // // Note: Your current backend 'Post' model does not seem to have a 'groups' field 
  // // or logic to handle 'groupIds' yet. We send it in case you add it later, 
  // // but it might be ignored by the server for now.
  // // formData.append("groupIds", JSON.stringify(payload.groupIds));

  // // Append Image
  // // React Native expects an object { uri, name, type } for file uploads
  // const filename = payload.imageUri.split("/").pop() || "post.jpg";
  // const match = /\.(\w+)$/.exec(filename);
  // const type = match ? `image/${match[1]}` : `image/jpeg`;

  // formData.append("image", {
  //   uri: payload.imageUri,
  //   name: filename,
  //   type,
  // } as any);

  // // Send request
  // // We don't need to manually set Content-Type to multipart/form-data; 
  // // axios/fetch usually handles boundary creation automatically when it sees FormData.
  // // However, sometimes it helps to explicitely let the client know.
  // const response = await client.post("api/posts/create/", formData, {
  //   headers: {
  //     "Content-Type": undefined, 
  //   } as any,
  // });

  // return { ok: response.status === 201 };
}

type Group = { id: string; name: string };

export default function CreatePost() {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [noDogVisible, setNoDogVisible] = useState(false);
  const [publishVisible, setPublishVisible] = useState(false);

  const [caption, setCaption] = useState("");
  const [shareOnProfile, setShareOnProfile] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Example groups - eventually fetch these from backend
  const groups = useMemo<Group[]>(
    () => [
      { id: "g1", name: "Pieski Warszawa" },
      { id: "g2", name: "Spacery" },
      { id: "g5", name: "Pomeranian club" },
    ],
    []
  );

  const pickAndCropSquare = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) setSelectedUri(uri);
    }
  };

  const onConfirm = async () => {
    if (!selectedUri || checking) return;

    try {
      setChecking(true);
      // Run the check logic
      const res = await checkDogInPhoto(selectedUri);

      if (!res.approved) {
        setNoDogVisible(true);
        return;
      }

      // SAVE THE KEY
      if (res.file_key) {
        setUploadedKey(res.file_key);
      }

      // If approved, proceed to publish screen
      setCaption("");
      setShareOnProfile(true);
      setSelectedGroupIds([]);
      setPublishVisible(true);
    } finally {
      setChecking(false);
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onPublish = async () => {
    if (!selectedUri || publishing) return;

    try {
      setPublishing(true);
      
      // Use the stored key
      await publishPost({
        s3_key: uploadedKey || undefined, 
        imageUri: selectedUri,
        caption: caption.trim(),
        shareOnProfile,
        groupIds: selectedGroupIds,
      });

      setPublishVisible(false);
      setSelectedUri(null);
      setUploadedKey(null); // Reset key
      // Optional: Add success feedback or navigation here
    } catch (e) {
      console.error("Publish failed", e);
      alert("Failed to publish post.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.topTitle}>new post</Text>

      <View style={styles.center}>
        <Pressable
          onPress={() => pickAndCropSquare()}
          style={styles.previewWrap}
          hitSlop={10}
        >
          {selectedUri ? (
            <Image source={{ uri: selectedUri }} style={styles.preview} />
          ) : (
            <View style={styles.previewEmpty}>
              <Ionicons name="image-outline" size={40} color="#69324C" />
              <Text style={styles.previewEmptyTitle}>choose picture</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={pickAndCropSquare}
          >
            <Text style={styles.secondaryText}>change pic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!selectedUri || checking) && styles.btnDisabled,
            ]}
            onPress={onConfirm}
            disabled={!selectedUri || checking}
          >
            {checking ? (
              <ActivityIndicator color="#FAF7F0" />
            ) : (
              <Text style={styles.primaryText}>confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={noDogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoDogVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setNoDogVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>there is no dog on this photo</Text>

            <TouchableOpacity
              style={styles.noDogBtn}
              onPress={async () => {
                setNoDogVisible(false);
                await pickAndCropSquare();
              }}
            >
              <Text style={styles.noDogBtnText}> :((( </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={publishVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPublishVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setPublishVisible(false)}>
          <Pressable style={styles.publishCard} onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ width: "100%" }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {selectedUri ? (
                  <Image source={{ uri: selectedUri }} style={styles.publishPreview} />
                ) : null}

                <Text style={styles.label}>description</Text>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="add a description..."
                  placeholderTextColor="#777"
                  style={styles.input}
                  multiline
                />

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setShareOnProfile((p) => !p)}
                  hitSlop={10}
                >
                  <View style={[styles.checkbox, shareOnProfile && styles.checkboxChecked]}>
                    {shareOnProfile ? (
                      <Ionicons name="checkmark" size={16} color="#FAF7F0" />
                    ) : null}
                  </View>
                  <Text style={styles.checkboxText}>share on your profile</Text>
                </Pressable>

                <Text style={styles.label}>select group</Text>
                <View style={styles.groupsBox}>
                  <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator>
                    {groups.map((g) => {
                      const selected = selectedGroupIds.includes(g.id);
                      return (
                        <Pressable
                          key={g.id}
                          style={[styles.groupRow, selected && styles.groupRowSelected]}
                          onPress={() => toggleGroup(g.id)}
                        >
                          <Text style={styles.groupText}>{g.name}</Text>
                          {selected ? (
                            <Ionicons name="checkmark-circle" size={18} color="#69324C" />
                          ) : (
                            <Ionicons name="ellipse-outline" size={18} color="#999" />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={[
                    styles.publishBtn,
                    (publishing ||
                      (!shareOnProfile && selectedGroupIds.length === 0)) &&
                      styles.btnDisabled,
                  ]}
                  onPress={onPublish}
                  disabled={publishing || (!shareOnProfile && selectedGroupIds.length === 0)}
                >
                  {publishing ? (
                    <ActivityIndicator color="#FAF7F0" />
                  ) : (
                    <Text style={styles.publishBtnText}>publish</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPublishVisible(false)}
                  disabled={publishing}
                >
                  <Text style={styles.cancelBtnText}>cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#FAF7F0" 
  },

  topTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E1E1E",
    alignSelf: "center",
    paddingBottom:10,
    marginTop: -20
  },

  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 250,
  },

  previewWrap: {
    width: SIDE,
    height: SIDE,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E9E3D8",
  },
  preview: { 
    width: "100%", 
    height: "100%" },

  previewEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  previewEmptyTitle: { 
    fontSize: 13,
    fontWeight: "bold", 
    color: "#1E1E1E" 
  },

  buttonsRow: {
    flexDirection: "row",
    gap: 30,
    marginTop: 20

  },
  primaryBtn: {
    backgroundColor: "#69324C",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    width: 100
  },
  primaryText: { 
    color: "#FAF7F0",
    fontWeight: "bold", 
  },

  secondaryBtn: {
    backgroundColor: "#E9E3D8",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    width: 100,
    
  },
  secondaryText: { 
    color: "#1E1E1E", 
    fontWeight: "bold", 
  },
  btnDisabled: {
     opacity: 0.6 
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 50,
  },

  modalCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B380C",
    textAlign: "center",
    marginBottom: 12,
  },
  noDogBtn: {
    backgroundColor: "#69324C",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: 150,
    alignItems: "center",
  },
  noDogBtnText: { 
    color: "#FAF7F0", 
    fontWeight: "bold", 
  },

  publishCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 16,
    padding: 16,
    maxHeight: "85%",
    width: 380,
    alignSelf:"center"
  },

  publishPreview: {
    width: "100%",
    height: SIDE,
    borderRadius: 12,
    backgroundColor: "#E9E3D8",
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    color: "#5F7751",
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 6,
    textTransform: "lowercase",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00000022",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E1E1E",
    minHeight: 90,
    textAlignVertical: "top",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
    marginBottom: 12
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#69324C",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { 
    backgroundColor: "#69324C" 
  },
  checkboxText: {
    fontSize: 13,
    color: "#1E1E1E",
    fontWeight: "bold",
    textTransform: "lowercase",
  },

  groupsBox: {
    backgroundColor: "#F7F4EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00000022",
    padding: 8,
  },
  groupRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00000012",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupRowSelected: { 
    borderColor: "#69324C" 
  },
  groupText: { 
    color: "#1E1E1E", 
    fontWeight: "800" 
  },

  publishBtn: {
    marginTop: 14,
    backgroundColor: "#69324C",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  publishBtnText: { 
    color: "#FAF7F0", 
    fontWeight: "bold", 
  },

  cancelBtn: {
    marginTop: 10,
    backgroundColor: "#E9E3D8",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#1E1E1E", 
    fontWeight: "bold", 
  },
});