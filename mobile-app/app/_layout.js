import React from "react";
import { View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { useFonts } from "expo-font";
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
    pathname === "/checkout-wizard" ||
    pathname === "/chat" ||
    pathname.startsWith("/product")
  );
}

// Root layout — wraps every screen with providers, a navigation Stack,
// and (on standard screens) the shared pinned top bar and bottom nav,
// so both bars render identically on every page.
export default function RootLayout() {
  // Storefront wordmark face: DM Sans (the same family the web store title
  // loads), bundled as the variable TTF; "DMSans" is what the title
  // styles reference, weight comes from the font's wght axis.
  const [fontsLoaded] = useFonts({
    DMSans: require("../assets/fonts/DMSansVariable.ttf"),
  });

  const pathname = usePathname();
  const standardScreen = isStandardScreen(pathname);

  // Hold first paint until the wordmark font is in (local asset, a few
  // ms) so the titles never flash in the system fallback face.
  if (!fontsLoaded) return null;

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
                <Stack.Screen name="chat" options={{ headerShown: false }} />
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
