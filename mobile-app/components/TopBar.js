import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearch } from "../context/SearchContext";

// Fixed top bar content height (the title + search row, excluding the
// safe-area top inset). Content screens pad their scroll containers by
// TOP_BAR_HEIGHT + the safe-area top inset so the pinned bar never
// covers page content.
export const TOP_BAR_HEIGHT = 56;

// Pinned top bar shared by every standard screen: the "Sunset" title on
// the left and a search field spanning all remaining width. Rendered
// once from the root layout, so every page shows the same bar.
//
// Browse variant: on the browse screen the bar shows the title only —
// search moved onto the browse page itself (a full-span input in the
// page content), so the search box is hidden there. The bar chrome
// (height, background, border, title) stays identical.
export default function TopBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { query, setQuery, homeScrollRef } = useSearch();
  const titleOnly = pathname === "/browse";

  // Home is the search-results surface: on home the submit scrolls the
  // product grid into view; from any other screen it navigates to home
  // so the query filters the catalog there.
  function handleSearchSubmit() {
    if (pathname === "/") {
      homeScrollRef.current?.();
    } else {
      router.push("/");
    }
  }

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* Store wordmark — same treatment as the web storefront title:
            DM Sans 700 lowercase "sunset." with the orange dot and the
            small ELECTRONICS subline (web: 28px at the mobile width). */}
        <View
          style={styles.titleBlock}
          accessibilityRole="text"
          accessibilityLabel="Sunset Electronics"
        >
          <Text style={styles.title}>
            sunset<Text style={styles.titleDot}>.</Text>
          </Text>
          <Text style={styles.titleSub} accessibilityElementsHidden>
            ELECTRONICS
          </Text>
        </View>

        {titleOnly ? null : (
          <View style={styles.searchBar}>
            <Feather
              name="search"
              size={15}
              color="#767B6C"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              accessibilityLabel="Search products"
              placeholder="Find your next favorite"
              placeholderTextColor="#7C8071"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchSubmitBtn}
              onPress={handleSearchSubmit}
              hitSlop={8}
              accessibilityLabel="Submit search"
            >
              <Feather name="arrow-up-right" size={16} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FAF9F6",
    borderBottomWidth: 1,
    borderBottomColor: "#EAE7DF",
  },
  row: {
    height: TOP_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  titleBlock: {
    flexShrink: 0,
    alignItems: "flex-start",
  },
  title: {
    // Web wordmark metrics at the mobile size: 28px / 700 / -0.054em.
    fontSize: 28,
    lineHeight: 28,
    fontFamily: "DMSans",
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#252821",
  },
  titleDot: {
    color: "#C64A22",
  },
  titleSub: {
    fontSize: 7,
    lineHeight: 7,
    fontFamily: "DMSans",
    fontWeight: "500",
    letterSpacing: 1.5,
    color: "#252821",
    marginTop: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    // Shorter than the bar, so centering leaves an inset between the box
    // border and the bar's top/bottom edges.
    height: 32,
    backgroundColor: "#F2F2EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E1D8",
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1A1A1A",
    height: "100%",
    paddingVertical: 0,
  },
  searchSubmitBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
