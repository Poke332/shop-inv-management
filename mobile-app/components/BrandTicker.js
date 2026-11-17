import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function BrandTicker() {
  const brands = [
    { name: "SONY", style: { fontWeight: "900", letterSpacing: 2 } },
    { name: "Anker", style: { fontWeight: "700" } },
    { name: "logitech", style: { fontWeight: "700", textTransform: "lowercase" } },
    { name: "SAMSUNG", style: { fontWeight: "900", letterSpacing: 1.5, fontSize: 13 } },
    { name: "JBL.", style: { fontWeight: "800", fontStyle: "italic" } },
    { name: "ASUS", style: { fontWeight: "900", letterSpacing: 2 } },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.labelWrap}>
        <Text style={styles.labelText}>GOOD COMPANY.</Text>
        <Text style={styles.labelBold}>GREAT TECH.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.brandScroll}
      >
        {brands.map((b, index) => (
          <View key={index} style={styles.brandItem}>
            <Text style={[styles.brandText, b.style]}>{b.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EAE7DF",
    backgroundColor: "#FAF9F6",
    marginBottom: 24,
  },
  labelWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  labelText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#888C7F",
    letterSpacing: 1,
  },
  labelBold: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 0.8,
  },
  brandScroll: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  brandItem: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  brandText: {
    fontSize: 16,
    color: "#3A3D34",
  },
});

