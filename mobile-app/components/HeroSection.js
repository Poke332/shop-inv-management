import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function HeroSection({ onExploreAudio, onFindUpgrade }) {
  const router = useRouter();

  return (
    <View style={styles.heroContainer}>
      {/* 1. Copy Section */}
      <View style={styles.copyContainer}>
        {/* Eyebrow Tagline */}
        <View style={styles.eyebrowRow}>
          <View style={styles.orangeDot} />
          <Text style={styles.eyebrowText}>
            A LITTLE UPGRADE. A BIG DIFFERENCE.
          </Text>
        </View>

        {/* Display Heading */}
        <Text style={styles.displayHeading}>
          Good tech.{"\n"}Better{" "}
          <Text style={styles.italicEveryday}>everyday.</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your next favorite, from the brands you love. Discover tech that fits
          the way you live.
        </Text>

        {/* Dual Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onFindUpgrade}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Find your next upgrade</Text>
            <Feather name="arrow-up-right" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onExploreAudio}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Explore audio</Text>
            <Feather name="arrow-right" size={14} color="#181A15" />
          </TouchableOpacity>
        </View>

        {/* Bottom Note */}
        <View style={styles.bottomNoteRow}>
          <Text style={styles.sunDot}>•</Text>
          <Text style={styles.bottomNoteText}>
            Thoughtfully picked. Ready for your everyday.
          </Text>
        </View>
      </View>

      {/* 2. Featured Product Card */}
      <TouchableOpacity
        style={styles.visualCard}
        activeOpacity={0.9}
        onPress={() => router.push("/product/P-231")}
      >
        <Image
          source={require("../assets/p-231.png")}
          style={styles.heroProductImage}
          resizeMode="cover"
        />

        {/* Circular Sticker Badge */}
        <View style={styles.stickerBadge}>
          <Text style={styles.stickerText}>SOUND ON.</Text>
          <Text style={styles.stickerText}>WORLD OFF.</Text>
          <Feather
            name="arrow-up-right"
            size={14}
            color="#424A2C"
            style={{ marginTop: 2 }}
          />
        </View>

        {/* Bottom Label Overlay */}
        <View style={styles.productBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTag}>THE EVERYDAY EDIT / 01</Text>
            <Text style={styles.bannerTitle}>Sony WF-C710N</Text>
            <Text style={styles.bannerSubtitle}>Wireless. Effortless. Yours.</Text>
          </View>
          <View style={styles.roundArrowBtn}>
            <Feather name="arrow-up-right" size={14} color="#181A15" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    backgroundColor: "#F6F4EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E4D9",
    overflow: "hidden",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  copyContainer: {
    padding: 22,
    paddingBottom: 18,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E05326",
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#6A6E61",
    letterSpacing: 1.1,
  },
  displayHeading: {
    fontSize: 32,
    fontWeight: "600",
    color: "#181A15",
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  italicEveryday: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontStyle: "italic",
    fontWeight: "400",
    color: "#E05326",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6A6D61",
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#E05326",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#E05326",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryBtnText: {
    color: "#181A15",
    fontSize: 12.5,
    fontWeight: "700",
  },
  bottomNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(227, 224, 213, 0.7)",
  },
  sunDot: {
    fontSize: 16,
    color: "#B25B36",
    lineHeight: 16,
  },
  bottomNoteText: {
    fontSize: 10,
    color: "#7C7E70",
    fontWeight: "500",
  },
  visualCard: {
    position: "relative",
    height: 300,
    backgroundColor: "#E7E5DC",
  },
  heroProductImage: {
    width: "100%",
    height: "100%",
  },
  stickerBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E6EDC8",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "12deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stickerText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#424A2C",
    letterSpacing: 0.4,
    lineHeight: 11,
  },
  productBanner: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EAE7DF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  bannerTag: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#888C7F",
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#181A15",
  },
  bannerSubtitle: {
    fontSize: 10.5,
    color: "#666A5D",
    marginTop: 1,
  },
  roundArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F0EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1DFD6",
  },
});
