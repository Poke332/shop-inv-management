import React from "react";
import { Tabs } from "expo-router";

// The bottom navigation is the custom pinned BottomNav (components/BottomNav.js),
// rendered from the root layout — so this Tabs group keeps its screens but
// disables the native tab bar (the 5-slot custom bar replaces it).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBar: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "My Orders",
          headerShown: true,
          headerStyle: { backgroundColor: "#FAF9F6" },
          headerTintColor: "#181A15",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Tabs>
  );
}
