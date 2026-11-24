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

// Same email format rule the web register page validates against.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const { scrollRef, revealFocusedInput } = useFormKeyboard();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // UI & validation states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailErr, setEmailErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // Same enable-submit rule as the web register page.
  const nameValid = name.trim().length > 0;
  const emailValid = EMAIL_RE.test(email.trim());
  const pwValid = password.length >= 8;
  const confirmErr =
    confirm && confirm !== password ? "Passwords do not match." : null;
  const canSubmit =
    nameValid && emailValid && pwValid && confirm.length > 0 && !confirmErr;

  async function handleRegister() {
    if (loading || !canSubmit) return;
    setEmailErr(null);
    setLoading(true);
    try {
      // register() signs the session in on success; success = the redirect
      // to the buyer home, no confirmation screen (like the web page).
      await register(name.trim(), email.trim(), password);
      router.replace("/");
    } catch (err) {
      // 409 duplicate email and any other failure land under the email
      // field, like the web register page.
      setEmailErr(err.message || "Registration failed.");
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
            <Text style={styles.brandTitle}>Create account</Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel="Name"
                onFocus={revealFocusedInput}
                placeholder="Jordan Wijaya"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

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
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {emailErr}
                </Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  accessibilityLabel="Password"
                  onFocus={revealFocusedInput}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    confirmErr ? styles.inputInvalid : null,
                  ]}
                  accessibilityLabel="Confirm password"
                  onFocus={revealFocusedInput}
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                  value={confirm}
                  onChangeText={(text) => {
                    setConfirm(text);
                  }}
                  editable={!loading}
                />
                {/* Bordered show/hide toggle box, matching the web affordance */}
                <TouchableOpacity
                  style={styles.pwToggle}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onPress={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                >
                  <Text style={styles.pwToggleText}>
                    {showConfirm ? "hide" : "show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {confirmErr ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {confirmErr}
                </Text>
              ) : null}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canSubmit || loading) && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: !canSubmit || loading }}
              onPress={handleRegister}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.busyRow} accessibilityRole="alert">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryButtonText}>
                    Creating account…
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Create account →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link to Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <Text style={styles.footerLink}>Sign in</Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
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
