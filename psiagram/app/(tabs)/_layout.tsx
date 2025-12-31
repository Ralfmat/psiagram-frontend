import CustomTabBar from "@/components/tabBar";
import type { Href } from "expo-router";
import { Tabs, router, usePathname } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet,Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        tabBarStyle: { display: 'none' },
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
      }}
    >
      <Tabs.Screen name="feed" options={{

        headerTitle: () => (
          <Image 
            source={require("@/assets/images/logo_psiagram.png")} 
            style={{ width: 170, height: 350 }} 
            resizeMode="contain" 
          />
        ),
        
      }} />
      <Tabs.Screen name="groups" options={{ title: "Groups"  }} />
      <Tabs.Screen name="createPost" options={{ title:"Create" }} />
      <Tabs.Screen name="search" options={{ title: "Search"}} />
      <Tabs.Screen name="myProfile" options={{title: "Me" }} />
    
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: { paddingLeft: 10 },

  logo: { width: 110, height: 110 },

  headerRight: { paddingRight: 10 },
});
