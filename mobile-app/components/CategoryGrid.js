import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function CategoryGrid({ onSelectCategory, selectedCategory }) {
  const categories = [
    {
      slug: "audio",
      label: "Audio",
      renderIcon: (color) => <Feather name="headphones" size={24} color={color} />,
    },
    {
      slug: "wearables",
      label: "Wearables",
      renderIcon: (color) => <Feather name="watch" size={24} color={color} />,
    },
    {
      slug: "laptops",
      label: "Laptops & PC",
      renderIcon: (color) => (
        <Ionicons name="laptop-outline" size={25} color={color} />
      ),
    },
    {
      slug: "gaming",
      label: "Gaming",
      renderIcon: (color) => (
        <Ionicons name="game-controller-outline" size={25} color={color} />
      ),
    },
    {
      slug: "smart-home",
      label: "Smart Home",
      renderIcon: (color) => <Feather name="home" size={24} color={color} />,
    },
    {
      slug: "accessories",
      label: "Accessories",
      renderIcon: (color) => <Feather name="zap" size={24} color={color} />,
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      {/* Section Heading */}
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.eyebrowRow}>
            <View style={styles.orangeDot} />
            <Text style={styles.eyebrowText}>FIND YOUR THING</Text>
          </View>
          <Text style={styles.headingTitle}>A little something for every day.</Text>
        </View>

        <TouchableOpacity
          onPress={() => onSelectCategory("all")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.linkRow}
        >
          <Text style={styles.headingLink}>All categories</Text>
          <Feather name="arrow-up-right" size={12} color="#181A15" />
        </TouchableOpacity>
      </View>

      {/* Grid: 3 Columns x 2 Rows */}
      <View style={styles.grid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          const iconColor = isSelected ? "#E05326" : "#626B52";

          return (
            <TouchableOpacity
              key={cat.slug}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelectCategory(cat.slug)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>{cat.renderIcon(iconColor)}</View>
              <Text
                style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
              <Feather
                name="arrow-up-right"
                size={11}
                color={isSelected ? "#E05326" : "#9A9E91"}
                style={styles.cardArrow}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  orangeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E05326",
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6A6E61",
    letterSpacing: 1,
  },
  headingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#181A15",
    letterSpacing: -0.4,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  headingLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#181A15",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  card: {
    width: "31.3%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSelected: {
    borderColor: "#E05326",
    backgroundColor: "#FEF4F0",
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#181A15",
    textAlign: "center",
  },
  cardLabelSelected: {
    color: "#E05326",
    fontWeight: "700",
  },
  cardArrow: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
