import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const GAP = 6;
const NUM_COLS = 3;
const H_PADDING = 18;
const TILE = (width - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

const fakeUser = {
  username: "janekkowalski",
  name: "Jan Kowalski",
  posts: 5,
  followers: 111,
  following: 76,
  avatarUri: "https://picsum.photos/seed/avatar_kk/300/300",
  bio: ["kocham pieski 🐾"],
};

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  // fake profil (później podmienic na API)
  const [profile] = useState(() => ({
    ...fakeUser,
    id: userId ?? "1",
  }));

  const [avatarVisible, setAvatarVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);


  const posts = useMemo(
    () =>
      Array.from({ length: profile.posts }).map((_, i) => ({
        id: String(i + 1),
        uri: `https://picsum.photos/seed/${profile.username}_${i + 1}/700/700`,
      })),
    [profile.posts, profile.username]
  );

  const Header = (
    <View>
      <View style={styles.topHeader}>
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#69324C" />
          <Text style={styles.backText}>back</Text>
        </Pressable>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Pressable onPress={() => setAvatarVisible(true)} hitSlop={10}>
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

              <Pressable
                style={[
                  styles.followBtn,
                  isFollowing ? styles.followingBtn : styles.followBtnActive,
                ]}
                onPress={() => setIsFollowing((prev) => !prev)}
                // trzeba zrobic zeby faktcznie to robiło follow  bo teraz tylko zmieneia colorek :)
              >
                <Text
                  style={[
                    styles.followText,
                    isFollowing ? styles.followingText : styles.followTextActive,
                  ]}
                >
                  {isFollowing ? "following" : "follow"}
                </Text>
              </Pressable>

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
    paddingTop: 6,
    paddingBottom: 70,
  },

  topHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#69324C",
    textTransform: "lowercase",
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
  avatarPlaceholder: {
    backgroundColor: "#E9E3D8",
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

  buttonsRow: {
    marginTop: 12,
    flexDirection: "row",
  },
  btnPrimary: {
    backgroundColor: "#E9E3D8",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  btnPrimaryText: {
    color: "#1E1E1E",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "lowercase",
  },

  bioBox: {
    marginTop: 10,
    paddingTop: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E1E1E",
    marginBottom: 4,
  },
  line: {
    height: 1,
    backgroundColor: "#69324C",
    marginVertical: 6,
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
    padding: 24,
  },
  avatarCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 18,
    padding: 16,
    maxHeight: "80%",
    alignItems: "center",
  },
  popoutTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 12,
    textAlign: "center",
  },
  avatarPreview: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    backgroundColor: "#E9E3D8",
    marginTop: 8,
  },
  followBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "center"
  },

  followBtnActive: {
    backgroundColor: "#69324C", 
    width: 220,
    height:30
  },

  followingBtn: {
    backgroundColor: "#E9E3D8", 
    width: 220,
    height: 30
  },

  followText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "lowercase",
    alignSelf: "center"
  },

  followTextActive: {
    color: "#FAF7F0",
  },

  followingText: {
    color: "#1E1E1E",
  },

});
