import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function HomeHeader({
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onShopNowPress,
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [activeMenu, setActiveMenu] = useState("home");

  function handleProfilePress() {
    if (isAuthenticated) {
      Alert.alert(
        `Signed in as ${user?.username || "buyer"}`,
        `Role: ${user?.role || "buyer"}\nEmail: ${user?.email || "—"}`,
        [
          { text: "My Orders", onPress: () => router.push("/(tabs)/orders") },
          { text: "Sign Out", style: "destructive", onPress: logout },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      router.push("/login");
    }
  }

  const usernameDisplay = user?.username ? user.username : "buyer_102";

  return (
    <View style={styles.headerContainer}>
      {/* Baris 1: Logo Wordmark & Right Tools */}
      <View style={styles.topRow}>
        {/* Brand Logo */}
        <TouchableOpacity
          style={styles.logoWrap}
          activeOpacity={0.8}
          onPress={() => {
            setActiveMenu("home");
            onSelectCategory("all");
          }}
        >
          <View style={styles.sunSymbol}>
            <Feather name="sun" size={17} color="#E05326" />
          </View>
          <View style={styles.logoTextWrap}>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmarkText}>sunset</Text>
              <Text style={styles.wordmarkDot}>.</Text>
            </View>
            <Text style={styles.wordmarkSub}>ELECTRONICS</Text>
          </View>
        </TouchableOpacity>

        {/* Right Tools: Profile Selector + Bag Icon */}
        <View style={styles.toolsWrap}>
          {/* Profile Selector */}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Feather name="user" size={13} color="#1A1A1A" />
            <Text style={styles.profileName} numberOfLines={1}>
              {usernameDisplay}
            </Text>
            <Feather name="chevron-down" size={12} color="#666666" />
          </TouchableOpacity>

          {/* Shopping Bag Button with Badge */}
          <TouchableOpacity
            style={styles.bagBtn}
            onPress={() => router.push("/checkout")}
            activeOpacity={0.7}
          >
            <Feather name="shopping-bag" size={17} color="#1A1A1A" />
            <View style={styles.bagBadge}>
              <Text style={styles.bagBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Baris 2: Menu Pills / Sub-header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuScroll}
      >
        <TouchableOpacity
          style={[styles.menuItem, activeMenu === "home" && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu("home");
            onSelectCategory("all");
          }}
        >
          {activeMenu === "home" && <Text style={styles.activeDot}>• </Text>}
          <Text
            style={[
              styles.menuText,
              activeMenu === "home" && styles.menuTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setActiveMenu("shop");
            if (onShopNowPress) onShopNowPress();
          }}
        >
          <Text style={styles.menuText}>Shop now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert("Categories", "Select a department to view:", [
              { text: "All picks", onPress: () => onSelectCategory("all") },
              { text: "Audio", onPress: () => onSelectCategory("audio") },
              { text: "Wearables", onPress: () => onSelectCategory("wearables") },
              { text: "Laptops & PC", onPress: () => onSelectCategory("laptops") },
              { text: "Gaming", onPress: () => onSelectCategory("gaming") },
              { text: "Smart Home", onPress: () => onSelectCategory("smart-home") },
              { text: "Accessories", onPress: () => onSelectCategory("accessories") },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={styles.menuText}>Categories</Text>
            <Feather name="chevron-down" size={11} color="#4A4D43" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/orders")}
        >
          <Text style={styles.menuText}>My orders</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Baris 3: Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={15} color="#767B6C" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find your next favorite"
          placeholderTextColor="#7C8071"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchSubmitBtn}
          onPress={() => {
            if (onShopNowPress) onShopNowPress();
          }}
        >
          <Feather name="arrow-up-right" size={16} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE7DF",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sunSymbol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCDFCF",
  },
  logoTextWrap: {
    justifyContent: "center",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  wordmarkText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.8,
    lineHeight: 22,
  },
  wordmarkDot: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E05326",
    lineHeight: 22,
  },
  wordmarkSub: {
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#666666",
    marginTop: 2,
  },
  toolsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5DF",
  },
  profileName: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#1A1A1A",
    maxWidth: 85,
  },
  bagBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5DF",
  },
  bagBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#E05326",
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bagBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  menuScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  menuItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#E05326",
    paddingBottom: 2,
  },
  activeDot: {
    color: "#E05326",
    fontSize: 14,
    fontWeight: "800",
  },
  menuText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#4A4D43",
  },
  menuTextActive: {
    color: "#1A1A1A",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E1D8",
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1A1A1A",
    height: "100%",
    paddingVertical: 0,
  },
  searchSubmitBtn: {
    padding: 6,
  },
});
