import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E05326",
        tabBarInactiveTintColor: "#888C7F",
        tabBarStyle: {
          backgroundColor: "#FAF9F6",
          borderTopColor: "#EAE7DF",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 62,
          paddingBottom: Platform.OS === "ios" ? 22 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={20} color={color} />
          ),
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
          tabBarIcon: ({ color }) => (
            <Feather name="box" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
