import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AnnouncementBar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top + 2 : 7 },
      ]}
    >
      <Text style={styles.text}>
        A brighter everyday starts with a little upgrade.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F0EB",
    paddingBottom: 7,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EAE7DF",
  },
  text: {
    fontSize: 10.5,
    color: "#555A4E",
    fontWeight: "500",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
