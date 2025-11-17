import { Tabs, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable
            style={{ marginRight: 16 }}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Text> dzwonek </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="createPost" options={{ title: "Create" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="myProfile" options={{ title: "Me" }} />
    </Tabs>
  );
}
