import { Tabs, useRouter } from "expo-router";
import { Pressable, Text,Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerRight: () => (
          <Pressable
            style={{ marginRight: 16 }}
            onPress={() => router.push("/(tabs)/notifications")}
          >
          <Ionicons name="notifications-outline" size={26} color="#0B380C" />
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
