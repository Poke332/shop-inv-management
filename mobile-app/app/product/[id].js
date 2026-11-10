import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useCart } from "../../context/CartContext";
import { API_URL } from "../../config";

// Format a number like 1290000 into "Rp 1.290.000"
function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart, cartCount } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);

  // Fetch product detail on mount or when ID changes
  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      try {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) {
          throw new Error("Server responded with status " + response.status);
        }
        const data = await response.json();
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Handle Add to Cart action
  function handleAddToCart() {
    if (!product) return;
    if (product.stock <= 0) {
      Alert.alert("Out of Stock", "Sorry, this item is currently unavailable.");
      return;
    }

    addToCart(product, selectedQty);

    Alert.alert(
      "Added to Cart! 🛒",
      `${selectedQty}× ${product.name} added to your cart.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Checkout", onPress: () => router.push("/checkout") },
      ]
    );
  }

  // Handle Buy Now action: add to cart and immediately go to checkout
  function handleBuyNow() {
    if (!product) return;
    if (product.stock <= 0) {
      Alert.alert("Out of Stock", "Sorry, this item is currently unavailable.");
      return;
    }

    addToCart(product, selectedQty);
    router.push("/checkout");
  }

  // --- Loading State ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E05326" />
        <Text style={styles.statusText}>Loading product details…</Text>
      </View>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.retryButtonText}>Back to Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Not Found State ---
  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>Product not found.</Text>
      </View>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  return (
    <>
      {/* Header with Cart Button */}
      <Stack.Screen
        options={{
          title: "Product Detail",
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerCartButton}
              onPress={() => router.push("/checkout")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerCartIcon}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.headerCartBadge}>
                  <Text style={styles.headerCartBadgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.screenWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Image */}
          <Image
            source={{ uri: product.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <View style={styles.body}>
            {/* Brand + Sale Badge */}
            <View style={styles.topRow}>
              <Text style={styles.brand}>{product.brand}</Text>
              {product.onSale && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>SALE</Text>
                </View>
              )}
            </View>

            {/* Product Name */}
            <Text style={styles.name}>{product.name}</Text>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.onSale && product.originalPrice && (
                <Text style={styles.originalPrice}>
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
            </View>

            {/* Stock Indicator */}
            <View style={styles.stockRow}>
              {isOutOfStock ? (
                <Text style={styles.outOfStockBadge}>Out of Stock</Text>
              ) : isLowStock ? (
                <Text style={styles.lowStockBadge}>
                  ⚡ Only {product.stock} left in stock!
                </Text>
              ) : (
                <Text style={styles.inStockBadge}>✓ In Stock ({product.stock} available)</Text>
              )}
            </View>

            {/* Quantity Selector (Only if in stock) */}
            {!isOutOfStock && (
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      selectedQty <= 1 && styles.stepperButtonDisabled,
                    ]}
                    onPress={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    disabled={selectedQty <= 1}
                  >
                    <Text style={styles.stepperButtonText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.stepperValue}>{selectedQty}</Text>

                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      selectedQty >= product.stock && styles.stepperButtonDisabled,
                    ]}
                    onPress={() =>
                      setSelectedQty((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={selectedQty >= product.stock}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>

            {/* Specifications Table */}
            {product.specs && product.specs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Specifications</Text>
                <View style={styles.specsContainer}>
                  {product.specs.map((spec, index) => (
                    <View
                      key={index}
                      style={[
                        styles.specRow,
                        index % 2 === 0 && styles.specRowEven,
                      ]}
                    >
                      <Text style={styles.specKey}>{spec.key}</Text>
                      <Text style={styles.specValue}>{spec.value}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 90 }} />
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isOutOfStock && styles.buttonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buyNowButton, isOutOfStock && styles.buttonDisabled]}
            onPress={handleBuyNow}
            disabled={isOutOfStock}
            activeOpacity={0.85}
          >
            <Text style={styles.buyNowText}>
              {isOutOfStock ? "Sold Out" : "Buy Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  statusText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#E05326",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  headerCartButton: {
    position: "relative",
    padding: 6,
    marginRight: 6,
  },
  headerCartIcon: {
    fontSize: 22,
  },
  headerCartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#E05326",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  heroImage: {
    width: "100%",
    height: 320,
    backgroundColor: "#F3F4F6",
  },
  body: {
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brand: {
    fontSize: 13,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  saleBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
    gap: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E05326",
  },
  originalPrice: {
    fontSize: 15,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  stockRow: {
    marginTop: 8,
  },
  inStockBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  lowStockBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },
  outOfStockBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepperButton: {
    width: 38,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  stepperValue: {
    width: 44,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
  },
  specsContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    marginTop: 4,
  },
  specRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  specRowEven: {
    backgroundColor: "#F9FAFB",
  },
  specKey: {
    width: 120,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    color: "#1F2937",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: "#FEF2EE",
    borderWidth: 1.5,
    borderColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#E05326",
    fontSize: 15,
    fontWeight: "700",
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
