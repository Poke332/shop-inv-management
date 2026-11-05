import { Stack } from "expo-router";

// Root layout — wraps every screen in a navigation stack.
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1a1a1a",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Products" }} />
      <Stack.Screen name="product/[id]" options={{ title: "Product Detail" }} />
    </Stack>
  );
}

