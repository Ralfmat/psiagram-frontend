import CustomTabBar from "@/components/tabBar";
import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Tabs, router, usePathname } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";

export default function TabsLayout() {
  const pathname = usePathname();
  const isNotifications = pathname.includes("notifications");

  const [returnTo, setReturnTo] = useState<Href>("/(tabs)/feed");

  const openNotifications = () => {
    setReturnTo(pathname as Href);
    router.push("/(tabs)/notifications");
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
            <Ionicons
              name={isNotifications ? "notifications" : "notifications-outline"}
              size={26}
              color="#69324C"
            />
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


    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: { paddingLeft: 10 },

  logo: { width: 110, height: 110 },

  headerRight: { paddingRight: 10 },
});
