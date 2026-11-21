import React from "react";
import { View } from "react-native";
import { Stack, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import BottomNav from "../components/BottomNav";

// Routes where the pinned bottom nav bar is shown (main app surfaces)
const NAV_VISIBLE_ROUTES = ["", "browse", "orders", "checkout"];

// Root layout — wraps every screen with AuthProvider, CartProvider, and a navigation Stack.
export default function RootLayout() {
  const segments = useSegments();
  const current = segments[0] || "";
  const showBottomNav = NAV_VISIBLE_ROUTES.includes(current);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: "#FFFFFF" },
                headerTintColor: "#111827",
                headerTitleStyle: { fontWeight: "700" },
                headerShadowVisible: false,
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: true, title: "Product Detail" }}
              />
              <Stack.Screen
                name="checkout"
                options={{ headerShown: true, title: "Checkout" }}
              />
              <Stack.Screen
                name="register"
                options={{ headerShown: true, title: "Create Account" }}
              />
              <Stack.Screen
                name="login"
                options={{ headerShown: true, title: "Sign In" }}
              />
            </Stack>
            {showBottomNav && <BottomNav />}
          </View>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
