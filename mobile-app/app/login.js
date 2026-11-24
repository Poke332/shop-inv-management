import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useFormKeyboard } from "../hooks/useFormKeyboard";

// Same email format rule the web login page validates against.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { scrollRef, revealFocusedInput } = useFormKeyboard();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailErr, setEmailErr] = useState(null);
  const [pwErr, setPwErr] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The web login page enables submit only when both fields hold.
  const emailValid = EMAIL_RE.test(email.trim());
  const pwValid = password.length >= 8;
  const canSubmit = emailValid && pwValid;

  async function handleLogin() {
    if (loading || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      // The mobile storefront is buyer-only: a staff/manager/admin sign-in
      // is rejected right here on the sign-in page — undo the session that
      // was just minted and say why, instead of dropping the user into a
      // storefront the orders API would refuse to sell to (403).
      if (data.role !== "buyer") {
        await logout();
        setPassword("");
        setError(
          "The mobile storefront is for buyer accounts. " +
          "Staff, manager, and admin accounts use the web ops console."
        );
        return;
      }
      // Success = the redirect (no toast, like the web): back to where the
      // sign-in was started (the bottom-nav account button), else the
      // buyer home.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand / Header — the store wordmark in the web storefront's
              treatment (DM Sans 700 lowercase "sunset." + ELECTRONICS
              subline), centered for the auth screens. */}
          <View style={styles.brandContainer}>
            <View
              style={styles.brandBlock}
              accessibilityRole="text"
              accessibilityLabel="Sunset Electronics"
            >
              <Text style={styles.brandWordmark}>
                sunset<Text style={styles.brandWordmarkDot}>.</Text>
              </Text>
              <Text style={styles.brandSub} accessibilityElementsHidden>
                ELECTRONICS
              </Text>
            </View>
            <Text style={styles.brandTitle}>Welcome back.</Text>
            <Text style={styles.brandSubtitle}>
              Sign in to pick up where you left off.
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailErr ? styles.inputInvalid : null]}
                accessibilityLabel="Email"
                onFocus={revealFocusedInput}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                  if (emailErr) setEmailErr(null);
                }}
                onBlur={() => {
                  setEmailErr(
                    email && !EMAIL_RE.test(email.trim())
                      ? "Enter a valid email address."
                      : null
                  );
                }}
                editable={!loading}
              />
              {emailErr ? (
                <Text style={styles.fieldErrorText}>{emailErr}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    pwErr ? styles.inputInvalid : null,
                  ]}
                  accessibilityLabel="Password"
                  onFocus={revealFocusedInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                    if (pwErr) setPwErr(null);
                  }}
                  onBlur={() => {
                    setPwErr(
                      password && password.length < 8
                        ? "At least 8 characters."
                        : null
                    );
                  }}
                  editable={!loading}
                />
                {/* Bordered show/hide toggle box, matching the web affordance */}
                <TouchableOpacity
                  style={styles.pwToggle}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.pwToggleText}>
                    {showPassword ? "hide" : "show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {pwErr ? (
                <Text style={styles.fieldErrorText}>{pwErr}</Text>
              ) : null}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canSubmit || loading) && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: !canSubmit || loading }}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.busyRow} accessibilityRole="alert">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryButtonText}>Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Sign in →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link to Register */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New here? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/register")}
              accessibilityRole="link"
              accessibilityLabel="Register"
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // Center the brand + form block in the available viewport height;
    // when the content outgrows the viewport the container is exactly
    // content-sized, so centering is a no-op and it scrolls top-first
    // as before (no clipped top edge).
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandBlock: {
    alignItems: "center",
  },
  brandWordmark: {
    // Web wordmark metrics at the mobile size: 28px / 700 / -0.054em.
    fontSize: 28,
    lineHeight: 28,
    fontFamily: "DMSans",
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#252821",
  },
  brandWordmarkDot: {
    color: "#C64A22",
  },
  brandSub: {
    fontSize: 7,
    lineHeight: 7,
    fontFamily: "DMSans",
    fontWeight: "500",
    letterSpacing: 1.5,
    color: "#252821",
    marginTop: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorBannerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  inputInvalid: {
    borderColor: "#EF4444",
  },
  fieldErrorText: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 5,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    marginRight: 6,
  },
  // Bordered toggle box, vertically centered in the input row, >=44pt tall.
  pwToggle: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  pwToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  primaryButton: {
    backgroundColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#E05326",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E05326",
  },
});
