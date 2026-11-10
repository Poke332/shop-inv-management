import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config";

function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const { cart, subtotal, total, clearCart } = useCart();

  // Contact Form States
  const [buyerName, setBuyerName] = useState(user?.username || "");
  const [buyerEmail, setBuyerEmail] = useState(user?.email || "");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  // Shipping Address Form States (Backend requires min. 20 chars for address)
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Payment Method: 'bank_transfer' or 'card'
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Keep contact details in sync with authenticated user
  useEffect(() => {
    if (user?.username && !buyerName) setBuyerName(user.username);
    if (user?.email && !buyerEmail) setBuyerEmail(user.email);
  }, [user]);

  // Client-side validation
  function validate() {
    if (!isAuthenticated || !token) {
      return "Please log in first to complete your purchase.";
    }

    if (!cart || cart.length === 0) {
      return "Your cart is empty. Please add items before checking out.";
    }

    if (!buyerName.trim()) {
      return "Recipient name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail.trim())) {
      return "Please enter a valid email address.";
    }

    // Phone validation (min 8 numeric digits)
    const phoneDigits = buyerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      return "Please enter a valid phone number (at least 8 digits).";
    }

    // Backend requires shippingAddress.address to be between 20 and 500 characters
    if (address.trim().length < 20) {
      return "Street address must be at least 20 characters long (include street, number, and RT/RW).";
    }

    if (!district.trim()) {
      return "District (Kecamatan) is required.";
    }
    if (!city.trim()) {
      return "City / Regency is required.";
    }
    if (!province.trim()) {
      return "Province is required.";
    }
    if (!postalCode.trim()) {
      return "Postal code is required.";
    }

    return null;
  }

  // Handle Order Submission
  async function handlePlaceOrder() {
    setErrorMessage("");

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      Alert.alert("Incomplete Details", validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        // Unique client request ID for backend idempotency
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        buyerContact: {
          name: buyerName.trim(),
          email: buyerEmail.trim().toLowerCase(),
          phone: buyerPhone.trim(),
          note: buyerNote.trim(),
        },
        shippingAddress: {
          address: address.trim(),
          district: district.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
        },
        paymentMethod: paymentMethod === "card" ? "card" : "bank_transfer",
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
          throw new Error(
            data.message || "Stock conflict: some items are no longer available in the requested quantity."
          );
        }
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(data.message || `Order failed (${response.status})`);
      }

      // Success: clear cart and inform user
      clearCart();

      const orderRef = data.reference || data.id || "Success";

      Alert.alert(
        "Order Placed Successfully! 🎉",
        `Thank you for your purchase!\nYour order reference: ${orderRef}`,
        [
          {
            text: "View My Orders",
            onPress: () => {
              // Redirect to (tabs)/orders screen
              router.replace("/(tabs)/orders");
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      const msg = err.message || "Something went wrong while placing your order.";
      setErrorMessage(msg);
      Alert.alert("Checkout Failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  // If cart is empty, show empty state
  if (!cart || cart.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Add items to your cart before proceeding to checkout.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.browseButtonText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Auth Guard Banner if not logged in */}
        {!isAuthenticated && (
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
        )}

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. ORDER SUMMARY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Order Summary ({cart.length} items)</Text>

          {cart.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.imagePlaceholder]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemBrand}>{item.brand}</Text>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.itemPriceQty}>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  <Text style={styles.itemQty}>× {item.qty}</Text>
                </View>
              </View>
              <Text style={styles.itemLineTotal}>
                {formatPrice(item.price * item.qty)}
              </Text>
            </View>
          ))}

          {/* Pricing Totals */}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.freeShippingBadge}>FREE</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* 2. SHIPPING & CONTACT INFO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Recipient & Contact</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Recipient Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              value={buyerName}
              onChangeText={setBuyerName}
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone / WhatsApp Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 08123456789 (min. 8 digits)"
              keyboardType="phone-pad"
              value={buyerPhone}
              onChangeText={setBuyerPhone}
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={buyerEmail}
              onChangeText={setBuyerEmail}
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Street Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Street name, house/building number, RT/RW (min. 20 characters)"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
              editable={!submitting}
            />
            <Text style={styles.helperText}>
              {address.trim().length}/20 characters minimum
            </Text>
          </View>

          <View style={styles.twoColumnRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>District (Kecamatan)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kebayoran Baru"
                value={district}
                onChangeText={setDistrict}
                editable={!submitting}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>City / Regency</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jakarta Selatan"
                value={city}
                onChangeText={setCity}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.twoColumnRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Province</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. DKI Jakarta"
                value={province}
                onChangeText={setProvince}
                editable={!submitting}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12140"
                keyboardType="numeric"
                value={postalCode}
                onChangeText={setPostalCode}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Order Note (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Special delivery instructions"
              value={buyerNote}
              onChangeText={setBuyerNote}
              editable={!submitting}
            />
          </View>
        </View>

        {/* 3. PAYMENT METHOD */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Payment Method</Text>

          {/* Option: Bank Transfer */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "bank_transfer" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("bank_transfer")}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "bank_transfer" && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Bank Transfer / Virtual Account</Text>
              <Text style={styles.paymentDesc}>
                Automatic verification via BCA, Mandiri, BNI, or BRI
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option: Card */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "card" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("card")}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "card" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Credit / Debit Card</Text>
              <Text style={styles.paymentDesc}>
                Instant checkout via Visa, MasterCard, or JCB
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.placeOrderButton, submitting && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Place Order • {formatPrice(total)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  imagePlaceholder: {
    backgroundColor: "#E5E7EB",
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  itemBrand: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 1,
  },
  itemPriceQty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: "#4B5563",
  },
  itemQty: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E05326",
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  freeShippingBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E05326",
  },
  fieldGroup: {
    marginBottom: 12,
  },
  twoColumnRow: {
    flexDirection: "row",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  multilineInput: {
    height: 72,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
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
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    color: "#111827",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  placeOrderButton: {
    backgroundColor: "#E05326",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#E05326",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeOrderButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

