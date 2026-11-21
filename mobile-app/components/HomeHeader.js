import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Fixed top bar content height (the title + search row, excluding the
// safe-area top inset). Content screens pad their scroll containers by
// TOP_BAR_HEIGHT + the safe-area top inset so the pinned bar never
// covers page content.
export const TOP_BAR_HEIGHT = 44;

// Pinned top bar: the "Sunset Electronics" title on the left and a
// search field spanning all remaining width. No other controls.
export default function HomeHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Text style={styles.title} accessibilityLabel="Sunset Electronics">
          Sunset Electronics
        </Text>

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
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchSubmitBtn}
            onPress={onSearchSubmit}
            hitSlop={8}
            accessibilityLabel="Submit search"
          >
            <Feather name="arrow-up-right" size={16} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E05326",
    letterSpacing: -0.3,
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
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
