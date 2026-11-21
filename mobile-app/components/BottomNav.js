import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Fixed bar content height. Content screens pad their scroll containers by
// BOTTOM_NAV_HEIGHT + safe-area bottom inset so the pinned bar never covers
// page content.
export const BOTTOM_NAV_HEIGHT = 56;

// 2/2 button split with the account button in the center slot:
// [Home, Browse] [Account] [Cart, Orders]
const NAV_BUTTONS = [
  { key: "home", label: "Home", icon: "home", route: "/", side: "left" },
  {
    key: "browse",
    label: "Browse",
    icon: "grid",
    route: "/browse",
    side: "left",
  },
  {
    key: "cart",
    label: "Cart",
    icon: "shopping-bag",
    route: "/checkout",
    side: "right",
  },
  {
    key: "orders",
    label: "Orders",
    icon: "box",
    route: "/orders",
    side: "right",
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const insets = useSafeAreaInsets();
  const [popoutOpen, setPopoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Active-route highlight must track the CURRENT page. Matching against
  // the normalized pathname (not useSegments, which on web returns the
  // route group "(tabs)" as a literal segment) keeps the highlight on
  // the screen the user is actually on.
  function isActive(key) {
    if (key === "home") return pathname === "/";
    if (key === "browse") return pathname === "/browse";
    if (key === "orders") return pathname === "/orders";
    if (key === "cart") return pathname === "/checkout";
    return false;
  }

  function handleAccountPress() {
    // Not logged in: go to the sign-in page (register is reachable from there).
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Logged in: toggle the sign-out popout anchored above the bar.
    setPopoutOpen((open) => !open);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setPopoutOpen(false);
      setSigningOut(false);
    }
    router.replace("/");
  }

  function renderNavButton(button) {
    const active = isActive(button.key);
    const color = active ? "#E05326" : "#888C7F";
    const showBadge = button.key === "cart" && cartCount > 0;
    return (
      <TouchableOpacity
        key={button.key}
        style={styles.slot}
        onPress={() => router.push(button.route)}
        activeOpacity={0.7}
        accessibilityLabel={
          button.key === "cart"
            ? cartCount > 0
              ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`
              : "Cart"
            : button.label
        }
      >
        <View style={styles.iconBox}>
          <Feather name={button.icon} size={20} color={color} />
          {showBadge && (
            // Notification bubble over the cart icon; the count is announced
            // via the button's accessibilityLabel, so the badge stays out of
            // the accessibility tree.
            <View style={styles.cartBadge} accessible={false}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.slotLabel, active && styles.slotLabelActive]}
        >
          {button.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {popoutOpen && (
        <>
          {/* Dismisses the popout on any outside tap */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPopoutOpen(false)}
          />
          <View style={[styles.popout, { bottom: BOTTOM_NAV_HEIGHT + insets.bottom + 8 }]}>
            <View style={styles.popoutInner}>
              <Text style={styles.popoutTitle}>
                Signed in as {user?.username || "buyer"}
              </Text>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                disabled={signingOut}
                activeOpacity={0.7}
              >
                <Feather name="log-out" size={14} color="#E05326" />
                <Text style={styles.signOutText}>
                  {signingOut ? "Signing out…" : "Sign Out"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      <SafeAreaView edges={["bottom"]} style={styles.barContainer}>
        <View style={styles.row}>
          {NAV_BUTTONS.filter((b) => b.side === "left").map(renderNavButton)}
          {/* Center account slot */}
          <TouchableOpacity
            style={styles.slot}
            onPress={handleAccountPress}
            activeOpacity={0.7}
          >
            <View style={styles.accountChip}>
              <Feather
                name="user"
                size={18}
                color={isAuthenticated ? "#1A1A1A" : "#888C7F"}
              />
            </View>
            <Text style={styles.slotLabel}>Account</Text>
          </TouchableOpacity>
          {NAV_BUTTONS.filter((b) => b.side === "right").map(renderNavButton)}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FAF9F6",
    borderTopWidth: 1,
    borderTopColor: "#EAE7DF",
  },
  row: {
    height: BOTTOM_NAV_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 8,
    paddingBottom: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  // Red notification circle anchored to the top-right of the cart icon.
  // Grows horizontally for two-digit counts; the bar-colored border keeps it
  // legible when it overlaps the icon.
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    borderWidth: 1.5,
    borderColor: "#FAF9F6",
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  cartBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 12,
  },
  accountChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5DF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#181A15",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888C7F",
  },
  slotLabelActive: {
    color: "#E05326",
  },
  // Sign-out popout anchored above the bar, centered on the account slot.
  // The actual bottom offset is set inline (bar height + safe-area inset + gap).
  popout: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  popoutInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5DF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 180,
    shadowColor: "#181A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  popoutTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
    textAlign: "center",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2EE",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05326",
  },
});
