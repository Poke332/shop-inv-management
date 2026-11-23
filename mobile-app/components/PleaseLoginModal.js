import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// The "Please login" popup shown when a signed-out user taps an
// Add-to-cart / Buy-now CTA (which renders in its visually disabled
// state). Rendered as a true full-screen modal: one dimmed backdrop
// spanning the whole viewport, with the card centered horizontally and
// vertically. The CTA opens the sign-in page; tapping the backdrop or
// the close button dismisses it.
export default function PleaseLoginModal({ visible, onDismiss }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // The popup only matters while anonymous; if the user signs in
  // mid-flow the card closes itself.
  if (!visible || isAuthenticated) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Dismiss"
          onPress={onDismiss}
        />
        <View style={styles.card} accessibilityViewIsModal>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            accessibilityLabel="Close"
          >
            <Feather name="x" size={15} color="#888C7F" />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Feather name="lock" size={20} color="#E05326" />
          </View>
          <Text style={styles.title}>Please log in</Text>
          <Text style={styles.subtitle}>
            Sign in to add items to your cart and check out.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismiss}
            accessibilityLabel="Maybe later"
          >
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // A single full-screen dim layer; the modal root is transparent so
  // this backdrop reaches the very edges (no side overlays).
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(24, 26, 21, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5DF",
    padding: 20,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    shadowColor: "#181A15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2EB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#181A15",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
  },
  signInBtn: {
    alignSelf: "stretch",
    backgroundColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dismissBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#888C7F",
  },
});
