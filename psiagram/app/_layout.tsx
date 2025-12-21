import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SessionProvider, useSession } from "../context/ctx";

function InitialLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // check current path group
    // segments[0] might be '(auth)' or '(tabs)'
    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      // user is logged in, but tries to enter (auth) -> redirect to app
      router.replace("/(tabs)/feed");
    } else if (!session && !inAuthGroup) {
      // user not logged in and tries to enter app -> redirect to auth page
      // using replace, makes sure user can't go back with arrow in broweser
      router.replace("/(auth)/login");
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="post/[postId]" /> 
      </Stack>
    );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <InitialLayout />
    </SessionProvider>
  );
}
