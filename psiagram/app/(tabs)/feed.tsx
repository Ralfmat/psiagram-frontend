import client from "@/api/client";
import { useSession } from "@/context/ctx";
import React, { useState , useEffect} from "react";
import {ScrollView,Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList,ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";

import {MOCK_POSTS}from"@/assets/mock(feed)/constants"; //dane testowe, potem trzeba zamienic na te z bazy

const { width, height } = Dimensions.get("window");

export default function FeedScreen() {
  const [posts, setPosts] = useState(MOCK_POSTS);//dane testowe, potem trzeba zamienic na cos takiego jak komentarz ponizej
  //const [data, setPosts] = useState<any[]>([]);
  const { signOut } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await client.get('test/'); 
      setPosts(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postContainer}>
      <View style={styles.userHeader}>
        <Image source={{ uri: item.user?.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
        <Text style={styles.username}>{item.user?.username || "użytkownik"}</Text>
      </View>
      
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="bone" size={24} color="#2D4F1E" />
          <Text style={styles.actionText}>{item.likes || 0}</Text>
        </TouchableOpacity>
        <Ionicons name="chatbubble-outline" size={22} color="#2D4F1E" />
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.boldText}>{item.user?.username} </Text>
          {item.caption}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item,index)=>index.toString()}
        contentContainerStyle={styles.listContent}


      />
      <View style={styles.floatingBar}>
        <TouchableOpacity onPress={() => router.push("/groups")}>
          <Ionicons name="people-outline" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/createPost")}>
          <MaterialCommunityIcons name="plus-box-outline" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { }}>
          <Ionicons name="paw" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/search")}>
          <Ionicons name="search" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/myProfile")}>
          <Ionicons name="person-circle-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  listContent: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    color: "#0B380C",
    fontWeight: '600',
    marginBottom: 15,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingBottom: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    color: '#0B380C',
  },
  postImage: {
    width: width,
    height: width, 
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  actionText: {
    marginLeft: 5,
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  captionText: {
    color: '#0B380C',
  },
  primaryButton: {
    backgroundColor: "#69324C", 
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  footerSection: {
    padding: 20,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 13,
    color: "#0B380C",
  },
  bottomLink: {
    fontSize: 13,
    color: "#0B380C",
    fontWeight: "600",
    textDecorationLine: "underline"
  },
  floatingBar: {
    position: 'absolute', 
    bottom: 30,          
    left: 20,
    right: 20,
    height: 65,
    backgroundColor: "#69324C", 
    borderRadius: 35,
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  }
});