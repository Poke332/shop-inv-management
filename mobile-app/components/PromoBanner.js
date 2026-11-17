import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function PromoBanner({ onUpgradePress }) {
  return (
    <View style={styles.container}>
      {/* Editorial Card */}
      <View style={styles.card}>
        <View style={styles.eyebrowRow}>
          <View style={styles.orangeDot} />
          <Text style={styles.eyebrowText}>MAKE ROOM FOR BETTER</Text>
        </View>

        <Text style={styles.heading}>
          Small upgrades.{"\n"}A whole new feeling.
        </Text>

        <Text style={styles.description}>
          For the desk, the commute, and everything in between.
        </Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onUpgradePress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Upgrade your everyday</Text>
          <Feather name="arrow-up-right" size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Shopping Benefits / Trust Strip */}
      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <View style={styles.iconCircle}>
            <Feather name="box" size={18} color="#626B52" />
          </View>
          <View style={styles.trustTextWrap}>
            <Text style={styles.trustTitle}>Everything in one place</Text>
            <Text style={styles.trustSubtitle}>
              From daily essentials to your next upgrade.
            </Text>
          </View>
        </View>

        <View style={styles.trustItem}>
          <View style={styles.iconCircle}>
            <Feather name="shield" size={18} color="#626B52" />
          </View>
          <View style={styles.trustTextWrap}>
            <Text style={styles.trustTitle}>Shop with clarity</Text>
            <Text style={styles.trustSubtitle}>
              Clear specs, real stock, and transparent pricing.
            </Text>
          </View>
        </View>

        <View style={styles.trustItem}>
          <View style={styles.iconCircle}>
            <Feather name="headphones" size={18} color="#626B52" />
          </View>
          <View style={styles.trustTextWrap}>
            <Text style={styles.trustTitle}>Find your perfect fit</Text>
            <Text style={styles.trustSubtitle}>
              Explore details and reviews before you decide.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 36,
  },
  card: {
    backgroundColor: "#F1EFE6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E4D9",
    padding: 22,
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
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
  heading: {
    fontSize: 25,
    fontWeight: "700",
    color: "#181A15",
    lineHeight: 29,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#6A6D61",
    marginBottom: 18,
  },
  ctaButton: {
    backgroundColor: "#E05326",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#E05326",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  trustStrip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 16,
    gap: 14,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F0EB",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
  },
  trustSubtitle: {
    fontSize: 11,
    color: "#6A6D61",
    marginTop: 1,
    lineHeight: 15,
  },
});
