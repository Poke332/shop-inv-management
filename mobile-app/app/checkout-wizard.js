import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { TOP_BAR_HEIGHT } from "../components/TopBar";
import { useFormKeyboard } from "../hooks/useFormKeyboard";

function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

// The step-3 sticky CTA bar: 45px button row + 10px vertical pads +
// 1px top border. Scroll content pads below by this on step 3 so the
// last form element never hides behind the bar.
const CTA_BAR_HEIGHT = 66;

// Loose phone rule (web checkout: digits + the "+" marker, >= 8 digits)
function isValidPhone(value) {
  const v = (value || "").trim();
  return /^[+\d\s()-]+$/.test(v) && v.replace(/\D/g, "").length >= 8;
}

// Loose email rule (web checkout personal-info field)
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

// Card number display: 4-digit groups ("4444 2222 1111 9999")
function formatCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/(\d{4})/g, "$1 ").trim();
}

// Receipt delivery window (web: now + 2 days, "24 Sep 2026, 10:00–14:00")
function estimatedArrival() {
  const d = new Date(Date.now() + 2 * 86400000);
  const day = d
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .slice(3);
  return `${day}, 10:00–14:00`;
}

// The one-line receipt payment summary (web paymentSummaryLine copy)
function paymentSummaryLine(method, payment) {
  if (method === "card") {
    const last = String(payment.cardNumber || "").replace(/\D/g, "").slice(-4);
    return `Card ending in •••• ${last || "••••"} — charged on delivery`;
  }
  return "Bank transfer — VA number generated after the order is placed";
}

// 3-step checkout wizard mirroring the web flow:
// 1 Personal information -> 2 Shipping address -> 3 Payment
// (order summary + Place order on the final step) -> the receipt view.
// Each step's "Continue" is enabled only when its required fields are
// valid. The step-3 sticky bar (web mobile idiom) carries the Place
// order CTA; the focused input is kept visible by useFormKeyboard.
export default function CheckoutWizardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, isAuthenticated } = useAuth();
  const { cart, total, clearCart } = useCart();
  const { scrollRef, revealFocusedInput } = useFormKeyboard();

  // Step index: 1-3 are the forms, 4 is the post-success receipt
  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [shipping, setShipping] = useState({
    address: "",
    district: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    vaNumber: "",
  });

  // Under-field blur errors (the web shows them on blur too)
  const [personalErrors, setPersonalErrors] = useState({});
  const [shippingErrors, setShippingErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  // Page-level failure banner (web 3a/5a): { kind, text }
  const [failBanner, setFailBanner] = useState(null);
  // The receipt snapshot captured at place time (the cart clears after)
  const [receipt, setReceipt] = useState(null);
  // The client order id is stable per attempt: a retry resubmits the
  // same id (the web's idempotent-retry contract)
  const orderNumberRef = useRef(null);

  // Keep contact details in sync with the authenticated user
  useEffect(() => {
    if (user?.username && !personal.name) {
      setPersonal((p) => ({ ...p, name: user.username }));
    }
    if (user?.email && !personal.email) {
      setPersonal((p) => ({ ...p, email: user.email }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Per-step required-field validity gates the step's "Continue"
  const personalValid =
    personal.name.trim() !== "" &&
    isValidPhone(personal.phone) &&
    isValidEmail(personal.email);
  const shippingValid =
    shipping.address.trim().length >= 20 &&
    shipping.district.trim() !== "" &&
    shipping.city.trim() !== "" &&
    shipping.province.trim() !== "" &&
    shipping.postalCode.trim() !== "";
  // The Place order CTA needs items + a signed-in session
  const placeEnabled = cart.length > 0 && isAuthenticated;

  function setPersonalField(patch) {
    setPersonal((p) => ({ ...p, ...patch }));
  }
  function blurPersonalField(key, value) {
    let message = null;
    if (key === "name" && !value.trim()) message = "Enter your name.";
    if (key === "phone" && !isValidPhone(value))
      message = "Enter a valid phone number (at least 8 digits).";
    if (key === "email" && !isValidEmail(value))
      message = "Enter a valid email address.";
    setPersonalErrors((errors) => ({
      ...errors,
      [key]: message,
    }));
  }
  function setShippingField(patch) {
    setShipping((s) => ({ ...s, ...patch }));
  }
  function blurShippingField(key, value) {
    let message = null;
    if (key === "address" && value.trim().length < 20)
      message = "Address must be at least 20 characters.";
    if (key !== "address" && value.trim() === "") message = "Required.";
    setShippingErrors((errors) => ({ ...errors, [key]: message }));
  }

  function goStep1() {
    setStep(1);
  }
  function goStep2() {
    if (personalValid) setStep(2);
    else {
      setPersonalErrors({
        name: personal.name.trim() ? null : "Enter your name.",
        phone: isValidPhone(personal.phone)
          ? null
          : "Enter a valid phone number (at least 8 digits).",
        email: isValidEmail(personal.email)
          ? null
          : "Enter a valid email address.",
      });
    }
  }
  function goStep3() {
    if (shippingValid) {
      setStep(3);
      return;
    }
    setShippingErrors({
      address:
        shipping.address.trim().length < 20
          ? "Address must be at least 20 characters."
          : null,
      district: shipping.district.trim() ? null : "Required.",
      city: shipping.city.trim() ? null : "Required.",
      province: shipping.province.trim() ? null : "Required.",
      postalCode: shipping.postalCode.trim() ? null : "Required.",
    });
  }

  // Submit the order at the current form state
  async function placeOrder() {
    if (!placeEnabled || submitting) return;
    if (!orderNumberRef.current) {
      orderNumberRef.current = `req-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    }

    // Snapshot the lines before the successful clear empties the cart
    const snapshot = {
      lines: cart.map((item) => ({
        name: item.name,
        qty: item.qty,
        amount: item.price * item.qty,
      })),
      total,
      method: payment.method,
      payment: { ...payment },
    };

    setSubmitting(true);
    setFailBanner(null);
    try {
      const payload = {
        id: orderNumberRef.current,
        buyerContact: {
          name: personal.name.trim(),
          email: personal.email.trim().toLowerCase(),
          phone: personal.phone.trim(),
          note: personal.note.trim(),
        },
        shippingAddress: {
          address: shipping.address.trim(),
          district: shipping.district.trim(),
          city: shipping.city.trim(),
          province: shipping.province.trim(),
          postalCode: shipping.postalCode.trim(),
        },
        paymentMethod: payment.method === "card" ? "card" : "bank_transfer",
        lines: cart.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          throw {
            kind: "stock",
            text: "Stock conflict — some quantities could not be placed.",
          };
        }
        if (response.status === 401) {
          throw {
            kind: "expired",
            text: "Your session has expired. Please log in again.",
          };
        }
        throw {
          kind: "generic",
          text: data.message || "Something went wrong — your order was not placed.",
        };
      }

      // Success: capture the receipt, clear the cart, show step 4
      clearCart();
      orderNumberRef.current = null;
      setReceipt({
        reference: data.reference || data.id || "Success",
        ...snapshot,
        estimate: estimatedArrival(),
      });
      setStep(4);
    } catch (err) {
      // 409 / 5xx keep the same client order id so the banner's
      // retry resubmits idempotently (the web's 3a/5a behavior)
      setFailBanner(err && err.kind ? err : { kind: "generic", text: "Something went wrong — your order was not placed." });
    } finally {
      setSubmitting(false);
    }
  }

  function bannerAction() {
    if (!failBanner) return;
    if (failBanner.kind === "stock") {
      setFailBanner(null);
    } else if (failBanner.kind === "expired") {
      router.push("/login");
    } else {
      placeOrder();
    }
  }

  // ---------- Empty-cart arrival (the cart screen is the entry point)
  if (!receipt && (!cart || cart.length === 0)) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
        <Feather name="shopping-bag" size={48} color="#888C7F" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Your cart is empty.</Text>
        <Text style={styles.emptySubtitle}>
          Add items to your cart before checking out.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.replace("/browse")}
        >
          <Text style={styles.browseButtonText}>Browse products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Step 4: the receipt (the web's post-success view)
  if (step === 4 && receipt) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: TOP_BAR_HEIGHT + insets.top + 16,
              paddingBottom: 24 + BOTTOM_NAV_HEIGHT + insets.bottom,
            },
          ]}
        >
          <View style={styles.receiptCard}>
            <Feather
              name="check-circle"
              size={48}
              color="#059669"
              style={styles.receiptCheck}
            />
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Order placed</Text>
              <View style={styles.pendingChip}>
                <Text style={styles.pendingChipText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.receiptReference}>
              Order {receipt.reference}
            </Text>

            {receipt.lines.map((line, index) => (
              <View
                key={index}
                style={[
                  styles.receiptLine,
                  index < receipt.lines.length - 1 && styles.receiptLineBorder,
                ]}
              >
                <Text style={styles.receiptLineName} numberOfLines={1}>
                  {line.name} ×{line.qty}
                </Text>
                <Text style={styles.receiptLineAmount}>
                  {formatPrice(line.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total (to be settled)</Text>
              <Text style={styles.receiptTotalValue}>
                {formatPrice(receipt.total)}
              </Text>
            </View>

            <Text style={styles.receiptPayment}>
              {paymentSummaryLine(receipt.method, receipt.payment)}
            </Text>
            <Text style={styles.receiptEstimate}>
              Ships from Sunset Electronics — estimated delivery{" "}
              {receipt.estimate}. Payment settles after the order is confirmed.
            </Text>

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace("/checkout")}
              >
                <Text style={styles.secondaryButtonText}>Edit cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace("/orders")}
              >
                <Text style={styles.primaryButtonText}>View my orders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------- Steps 1-3: the wizard forms
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: TOP_BAR_HEIGHT + insets.top + 16,
            paddingBottom:
              step === 3
                ? 12 + CTA_BAR_HEIGHT + BOTTOM_NAV_HEIGHT + insets.bottom
                : 24 + BOTTOM_NAV_HEIGHT + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Failure banner (web 3a/5a), above the wizard on every step */}
        {failBanner ? (
          <View style={styles.errorBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorBannerText}>{failBanner.text}</Text>
            </View>
            <TouchableOpacity
              style={styles.errorBannerAction}
              onPress={bannerAction}
            >
              <Text style={styles.errorBannerActionText}>
                {failBanner.kind === "stock"
                  ? "Dismiss"
                  : failBanner.kind === "expired"
                    ? "Sign in"
                    : "Retry"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* The auth guard banner for signed-out sessions */}
        {!isAuthenticated ? (
          <View style={styles.authWarningCard}>
            <Text style={styles.authWarningTitle}>Sign In Required</Text>
            <Text style={styles.authWarningText}>
              You need to be logged in to place an order.
            </Text>
            <TouchableOpacity
              style={styles.authWarningButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.authWarningButtonText}>Sign In Now</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Progress: 3 numbered circles + labels (web ProgressBar) */}
        <View style={styles.progressCard} accessibilityLabel="Checkout progress">
          {["Personal info", "Shipping address", "Payment"].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <View key={label} style={styles.progressItem}>
                <View style={styles.progressCircleRow}>
                  <View
                    style={[
                      styles.progressCircle,
                      (active || done) && styles.progressCircleDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressNumber,
                        (active || done) && styles.progressNumberDone,
                      ]}
                    >
                      {n}
                    </Text>
                  </View>
                  {i < 2 ? (
                    <View
                      style={[
                        styles.progressConnector,
                        step > n && styles.progressConnectorDone,
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    active && styles.progressLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Step 1: Personal information */}
        {step === 1 ? (
          <View style={styles.sectionCard} accessibilityLabel="Personal information">
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <Text style={styles.sectionHeading}>Personal information</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={[styles.input, personalErrors.name && styles.inputError]}
                placeholder="Your full name"
                value={personal.name}
                onChangeText={(value) => {
                  setPersonalField({ name: value });
                  if (personalErrors.name)
                    setPersonalErrors((e) => ({ ...e, name: null }));
                }}
                onBlur={() => blurPersonalField("name", personal.name)}
                onFocus={revealFocusedInput}
                editable={!submitting}
              />
              {personalErrors.name ? (
                <Text style={styles.fieldError}>
                  {personalErrors.name}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  personalErrors.phone && styles.inputError,
                ]}
                placeholder="+62 812-3456-7890"
                keyboardType="phone-pad"
                value={personal.phone}
                onChangeText={(value) => {
                  setPersonalField({ phone: value });
                  if (personalErrors.phone)
                    setPersonalErrors((e) => ({ ...e, phone: null }));
                }}
                onBlur={() => blurPersonalField("phone", personal.phone)}
                onFocus={revealFocusedInput}
                editable={!submitting}
              />
              {personalErrors.phone ? (
                <Text style={styles.fieldError}>
                  {personalErrors.phone}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  personalErrors.email && styles.inputError,
                ]}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={personal.email}
                onChangeText={(value) => {
                  setPersonalField({ email: value });
                  if (personalErrors.email)
                    setPersonalErrors((e) => ({ ...e, email: null }));
                }}
                onBlur={() => blurPersonalField("email", personal.email)}
                onFocus={revealFocusedInput}
                editable={!submitting}
              />
              {personalErrors.email ? (
                <Text style={styles.fieldError}>
                  {personalErrors.email}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Delivery or packaging notes, e.g. fragile item, extra packaging"
                multiline
                numberOfLines={2}
                value={personal.note}
                onChangeText={(value) => setPersonalField({ note: value })}
                onFocus={revealFocusedInput}
                editable={!submitting}
              />
            </View>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.ctaGrow, !personalValid && styles.buttonDisabled]}
                onPress={goStep2}
                disabled={!personalValid || submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Step 2: Shipping address */}
        {step === 2 ? (
          <View style={styles.sectionCard} accessibilityLabel="Shipping address">
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={styles.sectionHeading}>Shipping address</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  shippingErrors.address && styles.inputError,
                ]}
                placeholder="Street, number, RT / RW, city"
                multiline
                numberOfLines={3}
                value={shipping.address}
                onChangeText={(value) => {
                  setShippingField({ address: value });
                  if (shippingErrors.address)
                    setShippingErrors((e) => ({ ...e, address: null }));
                }}
                onBlur={() => blurShippingField("address", shipping.address)}
                onFocus={revealFocusedInput}
                editable={!submitting}
              />
              <Text style={styles.helperText}>
                {shipping.address.trim().length}/20 characters minimum
              </Text>
              {shippingErrors.address ? (
                <Text style={styles.fieldError}>
                  {shippingErrors.address}
                </Text>
              ) : null}
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, styles.column]}>
                <Text style={styles.fieldLabel}>District</Text>
                <TextInput
                  style={[
                    styles.input,
                    shippingErrors.district && styles.inputError,
                  ]}
                  placeholder="Kemang"
                  value={shipping.district}
                  onChangeText={(value) => {
                    setShippingField({ district: value });
                    if (shippingErrors.district)
                      setShippingErrors((e) => ({ ...e, district: null }));
                  }}
                  onBlur={() => blurShippingField("district", shipping.district)}
                  onFocus={revealFocusedInput}
                  editable={!submitting}
                />
                {shippingErrors.district ? (
                  <Text style={styles.fieldError}>
                    {shippingErrors.district}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.fieldGroup, styles.column]}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={[
                    styles.input,
                    shippingErrors.city && styles.inputError,
                  ]}
                  placeholder="Jakarta Selatan"
                  value={shipping.city}
                  onChangeText={(value) => {
                    setShippingField({ city: value });
                    if (shippingErrors.city)
                      setShippingErrors((e) => ({ ...e, city: null }));
                  }}
                  onBlur={() => blurShippingField("city", shipping.city)}
                  onFocus={revealFocusedInput}
                  editable={!submitting}
                />
                {shippingErrors.city ? (
                  <Text style={styles.fieldError}>
                    {shippingErrors.city}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, styles.column]}>
                <Text style={styles.fieldLabel}>Province</Text>
                <TextInput
                  style={[
                    styles.input,
                    shippingErrors.province && styles.inputError,
                  ]}
                  placeholder="DKI Jakarta"
                  value={shipping.province}
                  onChangeText={(value) => {
                    setShippingField({ province: value });
                    if (shippingErrors.province)
                      setShippingErrors((e) => ({ ...e, province: null }));
                  }}
                  onBlur={() => blurShippingField("province", shipping.province)}
                  onFocus={revealFocusedInput}
                  editable={!submitting}
                />
                {shippingErrors.province ? (
                  <Text style={styles.fieldError}>
                    {shippingErrors.province}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.fieldGroup, styles.column]}>
                <Text style={styles.fieldLabel}>Postal code</Text>
                <TextInput
                  style={[
                    styles.input,
                    shippingErrors.postalCode && styles.inputError,
                  ]}
                  placeholder="12730"
                  keyboardType="numeric"
                  value={shipping.postalCode}
                  onChangeText={(value) => {
                    setShippingField({ postalCode: value });
                    if (shippingErrors.postalCode)
                      setShippingErrors((e) => ({ ...e, postalCode: null }));
                  }}
                  onBlur={() =>
                    blurShippingField("postalCode", shipping.postalCode)
                  }
                  onFocus={revealFocusedInput}
                  editable={!submitting}
                />
                {shippingErrors.postalCode ? (
                  <Text style={styles.fieldError}>
                    {shippingErrors.postalCode}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={goStep1}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.ctaGrow, !shippingValid && styles.buttonDisabled]}
                onPress={goStep3}
                disabled={!shippingValid || submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Step 3: Payment + order summary (web's final step) */}
        {step === 3 ? (
          <View style={styles.sectionCard} accessibilityLabel="Payment">
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={styles.sectionHeading}>Payment</Text>
            </View>

            <Text style={styles.subHeading}>Payment method</Text>
            {Object.entries(PAYMENT_METHODS).map(([key, meta]) => {
              const selected = payment.method === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
                  onPress={() => setPayment({ ...payment, method: key })}
                  activeOpacity={0.8}
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>{meta.label}</Text>
                    <Text style={styles.paymentDesc}>{meta.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* The per-method inputs (web's dashed block) */}
            {payment.method === "card" ? (
              <View style={styles.paymentFieldsBlock}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Card number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="4444 2222 1111 9999"
                    keyboardType="numeric"
                    value={formatCardNumber(payment.cardNumber)}
                    onChangeText={(value) =>
                      setPayment((p) => ({
                        ...p,
                        cardNumber: value.replace(/\D/g, ""),
                      }))
                    }
                    onFocus={revealFocusedInput}
                    editable={!submitting}
                  />
                </View>
                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldGroup, styles.column]}>
                    <Text style={styles.fieldLabel}>Expiry</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      value={payment.expiry}
                      onChangeText={(value) =>
                        setPayment((p) => ({ ...p, expiry: value }))
                      }
                      onFocus={revealFocusedInput}
                      editable={!submitting}
                    />
                  </View>
                  <View style={[styles.fieldGroup, styles.column]}>
                    <Text style={styles.fieldLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="•••"
                      keyboardType="numeric"
                      value={payment.cvv}
                      onChangeText={(value) =>
                        setPayment((p) => ({
                          ...p,
                          cvv: value.replace(/\D/g, ""),
                        }))
                      }
                      onFocus={revealFocusedInput}
                      editable={!submitting}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {payment.method === "bank_transfer" ? (
              <View style={styles.paymentFieldsBlock}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Bank VA number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VA number (generated after the order is placed)"
                    value={payment.vaNumber}
                    onChangeText={(value) =>
                      setPayment((p) => ({ ...p, vaNumber: value }))
                    }
                    onFocus={revealFocusedInput}
                    editable={!submitting}
                  />
                  <Text style={styles.helperText}>
                    The VA number is issued once the order is placed — this
                    field is optional.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Order summary on the final step (web OrderReview rows) */}
            <Text style={styles.subHeading}>Order review</Text>
            <View style={styles.summaryList}>
              {cart.map((item) => (
                <View key={item.productId} style={styles.summaryRow}>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {item.name} ×{item.qty}
                  </Text>
                  <Text style={styles.summaryAmount}>
                    {formatPrice(item.price * item.qty)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.summaryTotals}>
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Subtotal</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(total)}
                </Text>
              </View>
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>
                  Total (to be settled)
                </Text>
                <Text style={styles.summaryTotalValue}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={goStep2}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Step 3 sticky CTA bar (web mobile idiom): the total + the
          Place order button, pinned above the bottom nav */}
      {step === 3 ? (
        <View
          style={[styles.ctaBar, { bottom: BOTTOM_NAV_HEIGHT + insets.bottom }]}
        >
          <View style={styles.ctaBarTotals}>
            <Text style={styles.ctaBarLabel}>Total (to be settled)</Text>
            <Text style={styles.ctaBarValue}>{formatPrice(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, !placeEnabled && styles.buttonDisabled]}
            onPress={placeOrder}
            disabled={!placeEnabled || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Place order</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

// Payment method meta (web PAYMENT_METHODS labels + subtitles)
const PAYMENT_METHODS = {
  card: { label: "Card", sub: "Visa · Mastercard · JCB — charge on delivery" },
  bank_transfer: {
    label: "Bank transfer",
    sub: "VA number generated after the order is placed",
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181A15",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888C7F",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#E05326",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  authWarningCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  authWarningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  authWarningText: {
    fontSize: 13,
    color: "#B45309",
    marginBottom: 12,
  },
  authWarningButton: {
    backgroundColor: "#E05326",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  authWarningButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
  },
  errorBannerAction: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  errorBannerActionText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  // Circle row: the fixed circle + a connector that stretches to the
  // item's right edge (the next item's circle continues the line)
  progressCircleRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D6D9CE",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircleDone: {
    backgroundColor: "#E05326",
    borderColor: "#E05326",
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888C7F",
  },
  progressNumberDone: {
    color: "#FFFFFF",
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#D6D9CE",
    marginLeft: 6,
    marginRight: 6,
  },
  progressConnectorDone: {
    backgroundColor: "#E05326",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888C7F",
    marginTop: 6,
    textAlign: "center",
  },
  progressLabelActive: {
    color: "#181A15",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAE7DF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E05326",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#181A15",
  },
  subHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
    marginBottom: 8,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 8,
  },
  column: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A4D43",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E1D8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#181A15",
    minHeight: 44,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  multilineInput: {
    height: 72,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 11,
    color: "#888C7F",
    marginTop: 4,
  },
  fieldError: {
    fontSize: 11,
    color: "#DC2626",
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  ctaGrow: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E05326",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E1D8",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#181A15",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#EAE7DF",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    minHeight: 44,
  },
  paymentOptionSelected: {
    borderColor: "#E05326",
    backgroundColor: "#FEF2EE",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9A9E91",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: "#E05326",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E05326",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#181A15",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#888C7F",
    marginTop: 2,
  },
  paymentFieldsBlock: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E3E1D8",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAF9F6",
    marginBottom: 16,
  },
  summaryList: {
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2EB",
  },
  summaryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05326",
  },
  summaryTotals: {
    paddingTop: 10,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryTotalLabel: {
    fontSize: 13,
    color: "#888C7F",
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#181A15",
  },
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAE7DF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  ctaBarTotals: {
    flex: 1,
  },
  ctaBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888C7F",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  ctaBarValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E05326",
  },
  // Receipt view (step 4)
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 20,
  },
  receiptCheck: {
    marginBottom: 14,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#181A15",
  },
  pendingChip: {
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pendingChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },
  receiptReference: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 14,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  receiptLineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2EB",
  },
  receiptLineName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  receiptLineAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05326",
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EAE7DF",
    marginTop: 4,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#181A15",
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E05326",
  },
  receiptPayment: {
    fontSize: 13,
    fontWeight: "600",
    color: "#181A15",
    marginTop: 14,
  },
  receiptEstimate: {
    fontSize: 12,
    color: "#888C7F",
    marginTop: 8,
    lineHeight: 17,
  },
  receiptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
});
