import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

// Root layout — wraps every screen with AuthProvider, CartProvider, and a navigation Stack.
export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
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
      </CartProvider>
    </AuthProvider>
  );
}
