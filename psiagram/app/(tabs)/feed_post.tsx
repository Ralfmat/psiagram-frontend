import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const PostItem = ({ post }: { post: any }) => {
  return (
    <View style={styles.postContainer}>
      <View style={styles.userHeader}>
        <Image source={{ uri: post.user.avatarUrl }} style={styles.avatar} />
        <Text style={styles.username}>{post.user.username}</Text>
      </View>

      <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />

     
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="bone" size={28} color="#2D4F1E" />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#2D4F1E" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.descriptionContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.boldText}>{post.user.username} </Text>
          {post.caption}
        </Text>
        
        {post.comments.map((comment: any, index: number) => (
          <Text key={index} style={styles.commentText}>
            <Text style={styles.boldText}>{comment.username} </Text>
            {comment.text}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: { marginBottom: 20, backgroundColor: '#FAF7F0' },
  userHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: '700', fontSize: 16, color: '#0B380C' },
  postImage: { width: '100%', aspectRatio: 1 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  actionText: { marginLeft: 4, fontWeight: '600', color: '#0B380C' },
  descriptionContainer: { paddingHorizontal: 12, paddingVertical: 8 },
  boldText: { fontWeight: '700' },
  captionText: { fontSize: 14, color: '#0B380C', marginBottom: 4 },
  commentText: { fontSize: 13, color: '#0B380C', marginTop: 2 },
});