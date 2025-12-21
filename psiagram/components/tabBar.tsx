import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const PURPLE = "#69324C";
const CREAM = "#FAF7F0";

const ALLOWED_TABS = [
  "feed",
  "groups",
  "createPost",
  "search",
  "myProfile",
];


function getIcon(routeName: string, focused: boolean) {
  switch (routeName) {
    case "feed":
      return focused ? "paw" : "paw-outline";
    case "groups":
      return focused ? "people" : "people-outline";
    case "createPost":
      return focused ? "add-circle" : "add-circle-outline";
    case "search":
      return focused ? "search" : "search-outline";
    case "myProfile":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse-outline";
  }
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
    
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes
            .filter((route) => ALLOWED_TABS.includes(route.name))
            .map((route) => {
            const index = state.routes.findIndex(
                (r) => r.key === route.key
            );
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = getIcon(route.name, focused);

          const isCenter = route.name === "feed";

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.item, isCenter && styles.centerItem]}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <Ionicons
                name={iconName as any}
                size={isCenter ? 30 : 30}
                color={CREAM}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
  },
  pill: {
    width: "90%",
    height: 58,
    borderRadius: 30,
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  item: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  centerItem: {
    transform: [{ translateY: -2 }],
  },
});
