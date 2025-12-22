import { useSession } from "@/context/ctx";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Dimensions,
  FlatList,
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
  View
} from "react-native";


const fakeProfile = {
  username: "zuzannanowak",
  name: "Zuzanna Nowak",
  posts: 17,
  followers: 245,
  following: 201,
  avatarUri: "https://picsum.photos/seed/avatar/300/300",
  bio: [
    "Soft fur, warm hearts, happy souls 🐾",
    "Little paws, big love ✨",
    "Captured moments, endless joy 📸",
    "Welcome to our fluffy world 🐶",
  ],
};

const { width } = Dimensions.get("window");

const GAP = 6;
const NUM_COLS = 3;
const H_PADDING = 18;
const TILE = (width - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;



export default function MyProfile() {
  const [avatarVisible, setAvatarVisible] = useState(false);
  const [changingAvatar, setChangingAvatar] = useState(false);


  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);


  const [profile, setProfile] = useState(fakeProfile);
  const [editVisible, setEditVisible] = useState(false);

  const [editUsername, setEditUsername] = useState(profile.username);
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio.join("\n"));
  const [editPassword, setEditPassword] = useState("");


  const deleteAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUri: "" })); // albo null
    setAvatarVisible(false);
  };

  const pickNewAvatar = async () => {
    try {
      setChangingAvatar(true);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setChangingAvatar(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        if (uri) {
          setProfile((prev) => ({ ...prev, avatarUri: uri }));
        }
        setAvatarVisible(false);
      }
    } finally {
      setChangingAvatar(false);
    }
  };


  const openEdit = () => {
    setEditUsername(profile.username);
    setEditName(profile.name);
    setEditBio(profile.bio.join("\n"));
    setEditPassword("");
    setEditVisible(true);
  };

  const saveEdit = () => {
    setProfile((prev) => ({
      ...prev,
      username: editUsername.trim(),
      name: editName.trim(),
      bio: editBio
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    }));
    setEditVisible(false);
  };

  const { signOut } = useSession();

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      // TODO: tu później będzie fetch DELETE do API

      await signOut(); 
    } finally {
      setDeleting(false);
      setDeleteVisible(false);
    }
  };

  const posts = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: String(i + 1),
        uri: `https://picsum.photos/seed/dog_${i + 1}/700/700`,
      })),
    []
  );

  const Header = (
    <View>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Pressable onPress={() => setAvatarVisible(true)}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </Pressable>

          <View style={styles.rightCol}>
            <Text style={styles.username}>{profile.username}</Text>

            <View style={styles.statsRow}>
              <Stat value={profile.posts} label="posts" />
              <Stat value={profile.followers} label="followers" />
              <Stat value={profile.following} label="following" />
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={openEdit}>
                <Text style={styles.btnPrimaryText}>edit profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSecondary} onPress={() => setDeleteVisible(true)}  >
                <Text style={styles.btnSecondaryText}>delete profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bioBox}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.line} /> 
          {profile.bio.map((line, idx) => (
            <Text key={idx} style={styles.bioLine}>
              {line}
            </Text>
          ))}
        </View>
  
      </View>

      <View style={{ height: 10 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={Header}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.tile}
              onPress={() =>
                router.push({
                  pathname: "/post/[postId]",
                  params: { postId: item.id, uri: item.uri },
                })
              }
            >
              <Image source={{ uri: item.uri }} style={styles.tileImage} />
            </Pressable>
          )}

        showsVerticalScrollIndicator={false}
      />
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setEditVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <Pressable style={styles.popoutCard} onPress={() => {}}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <Text style={styles.popoutTitle}>edit profile</Text>

                <Text style={styles.modalLabel}>username</Text>
                <TextInput
                  value={editUsername}
                  onChangeText={setEditUsername}
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>name & surname</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>bio</Text>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  style={[styles.modalInput, styles.modalMultiline]}
                  multiline
                />

                <Text style={styles.modalLabel}>password</Text>
                <TextInput
                  value={editPassword}
                  onChangeText={setEditPassword}
                  style={styles.modalInput}
                  secureTextEntry
                  returnKeyType="done"
                />

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnGhost]}
                    onPress={() => setEditVisible(false)}
                  >
                    <Text style={styles.modalBtnGhostText}>cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={saveEdit}
                  >
                    <Text style={styles.modalBtnPrimaryText}>save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDeleteVisible(false)}>
          <Pressable style={styles.popoutCardDelete} onPress={() => {}}>
            <Text style={styles.popoutTitle}>delete account?</Text>

            <Text style={styles.deleteText}>
              are you sure you want to delete your account?{"\n"}
              this action cannot be undone.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setDeleteVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalBtnGhostText}>cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.deleteBtn]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                <Text style={styles.deleteBtnText}>
                  {deleting ? "deleting..." : "delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={avatarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAvatarVisible(false)}>
          <Pressable style={styles.avatarCard} onPress={() => {}}>
            <Text style={styles.popoutTitle}>profile photo</Text>

            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarPreview} />
            ) : (
              <View style={[styles.avatarPreview, styles.avatarPlaceholder]} />
            )}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setAvatarVisible(false)}
              >
                <Text style={styles.modalBtnGhostText}>cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={deleteAvatar}
              >
                <Text style={styles.modalBtnGhostText}>delete photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={pickNewAvatar}
                disabled={changingAvatar}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {changingAvatar ? "opening..." : "change photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },

  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 10,
    paddingBottom: 50,
  },

  profileCard: {
    backgroundColor: "#FAF7F0",
    padding: 12,
  },
  profileTopRow: {
    flexDirection: "row",
    gap: 10,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 80,
    borderColor: "#69324C",
    borderWidth: 1,
  },
  rightCol: {
    flex: 1,
  },

  username: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: "row",
    marginRight: 20,
    alignSelf: "center",
  },
  stat: { 
    width: 70,
    textAlign: "center",
    marginRight: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#3B3B3B",
    textAlign: "center",
  },
  line: {
    height: 1,
    backgroundColor: "#69324C",
    marginVertical: 6,
  },

  buttonsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
  },
  btnPrimary: {
    backgroundColor: "#E9E3D8",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  btnPrimaryText: {
    color: "#1E1E1E",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "lowercase",
  },
  btnSecondary: {
    backgroundColor: "#E9E3D8",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  btnSecondaryText: {
    color: "#1E1E1E",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "lowercase",
  },

  bioBox: {
    marginTop: 10,
    borderTopColor: "#C9BEB1",
    paddingTop: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E1E1E",
    marginBottom: 4,
  },
  bioLine: {
    fontSize: 14,
    color: "#1E1E1E",
    lineHeight: 16,
  },

  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#173F1A",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 10,
  },
  popoutCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 12,
    padding: 12,
  },
  popoutCardDelete: {
    backgroundColor: "#FAF7F0",
    borderRadius: 12,
    padding: 20,
    height: 220,
    width: 300,
    alignSelf: "center",
    justifyContent: "center",
  },
  popoutTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 12,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 12,
    color: "#5F7751",
    marginBottom: 6,
    marginTop: 10,
    textTransform: "lowercase",
  },
  modalInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00000022",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E1E1E",
  },
  modalMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnGhost: {
    backgroundColor: "#E9E3D8",
  },
  modalBtnGhostText: {
    color: "#1E1E1E",
    fontWeight: "700",
    textTransform: "lowercase",
  },
  modalBtnPrimary: {
    backgroundColor: "#69324C",
  },
  modalBtnPrimaryText: {
    color: "#FAF7F0",
    fontWeight: "700",
    textTransform: "lowercase",
  },
  deleteText: {
    fontSize: 13,
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 18,
  },
  deleteBtn: {
    backgroundColor: "#B3261E", 
  },
  deleteBtnText: {
    color: "#FAF7F0",
    fontWeight: "800",
    textTransform: "lowercase",
  },
  avatarPlaceholder: {
    backgroundColor: "#E9E3D8",
  },
  avatarCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 18,
    padding: 16,
    maxHeight: "80%",
    alignItems: "center",
  },
  avatarPreview: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    backgroundColor: "#E9E3D8",
    marginTop: 8,
  },

});
