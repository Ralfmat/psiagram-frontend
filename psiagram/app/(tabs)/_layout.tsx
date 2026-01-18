import CustomTabBar from "@/components/tabBar";
import client from "@/api/client"; // Import client
import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Tabs, router, usePathname, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  const pathname = usePathname();
  const isNotifications = pathname.includes("notifications");
  const [returnTo, setReturnTo] = useState<Href>("/(tabs)/feed");
  const [hasUnread, setHasUnread] = useState(false);

  // Check for unread notifications whenever the user navigates
  useFocusEffect(
    useCallback(() => {
      const checkUnread = async () => {
        try {
          // Don't check if we are already on the notifications screen
          if (pathname.includes("notifications")) {
            setHasUnread(false);
            return;
          }
          
          const res = await client.get("/api/notifications/unread-count/");
          setHasUnread(res.data.count > 0);
        } catch (e) {
          console.log("Failed to fetch notification count");
        }
      };

      checkUnread();
    }, [pathname])
  );

  const openNotifications = () => {
    // Optimistically remove the red dot immediately
    setHasUnread(false);
    setReturnTo(pathname as Href);
    router.push("/notifications");
  };

  const closeNotifications = () => {
    router.replace(returnTo);
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerLeft: () => (
          <Pressable
            onPress={() => router.push("/(tabs)/feed")}
            style={styles.headerLeft}
            hitSlop={10}
          >
            <Image
              source={require("@/assets/images/logo_psiagram.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
        ),

        headerRight: () => (
          <Pressable
            onPress={() => {
              if (isNotifications) closeNotifications();
              else openNotifications();
            }}
            style={styles.headerRight}
            hitSlop={10}
          >
            <View>
              <Ionicons
                name={isNotifications ? "notifications" : "notifications-outline"}
                size={26}
                color="#69324C"
              />
              {/* RED DOT LOGIC */}
              {hasUnread && (
                <View style={styles.redDot} />
              )}
            </View>
          </Pressable>
        ),

        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#FAF7F0" },
        headerLeftContainerStyle: { paddingLeft: 20 },
        headerRightContainerStyle: { paddingRight: 20 },
      }}
    >
      <Tabs.Screen name="groups"/>
      <Tabs.Screen name="createPost"/>
      <Tabs.Screen name="feed"/>
      <Tabs.Screen name="search"/>
      <Tabs.Screen name="myProfile"/>
      <Tabs.Screen name="notifications"/>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: { paddingLeft: 0, justifyContent:"center" },
  logo: { width: 110, height: 110 ,marginLeft: -8,},
  headerRight: { paddingRight: 0 },
  // Red Dot Style
  redDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "#FAF7F0",
  }
});