import React from "react";
import { View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { SearchProvider } from "../context/SearchContext";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

// Standard (non-auth) screens get the shared pinned bars; the auth
// screens keep their own native header with a back button.
function isStandardScreen(pathname) {
  return (
    pathname === "/" ||
    pathname === "/browse" ||
    pathname === "/orders" ||
    pathname === "/checkout" ||
    pathname.startsWith("/product")
  );
}

// Root layout — wraps every screen with providers, a navigation Stack,
// and (on standard screens) the shared pinned top bar and bottom nav,
// so both bars render identically on every page.
export default function RootLayout() {
  const pathname = usePathname();
  const standardScreen = isStandardScreen(pathname);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
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
                  name="register"
                  options={{ headerShown: true, title: "Create Account" }}
                />
                <Stack.Screen
                  name="login"
                  options={{ headerShown: true, title: "Sign In" }}
                />
              </Stack>
              {standardScreen && <TopBar />}
              {standardScreen && <BottomNav />}
            </View>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
