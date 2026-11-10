import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

export default function ProductCard({ item }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const isLowStock =
    item.stock > 0 && item.stock <= (item.lowStockThreshold || 5);
  const isOutOfStock = item.stock <= 0;

  function handleAddToCart() {
    if (isOutOfStock) {
      Alert.alert("Out of Stock", "Sorry, this product is currently unavailable.");
      return;
    }
    addToCart(item, 1);
    Alert.alert("Added to Cart 🛒", `${item.name} has been added to your cart.`, [
      { text: "Continue", style: "cancel" },
      { text: "Checkout", onPress: () => router.push("/checkout") },
    ]);
  }

  function handleBuyNow() {
    if (isOutOfStock) {
      Alert.alert("Out of Stock", "Sorry, this product is currently unavailable.");
      return;
    }
    addToCart(item, 1);
    router.push("/checkout");
  }

  return (
    <View style={styles.card}>
      {/* Clickable Image & Badges */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}`)}
        style={styles.imageWrap}
      >
        {item.image && !imageError ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderBrand}>{item.brand}</Text>
          </View>
        )}

        {/* Top Badges */}
        <View style={styles.badgeContainer}>
          {item.onSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>On sale</Text>
            </View>
          )}

          {isLowStock && !isOutOfStock && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>Only {item.stock} left</Text>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outBadge}>
              <Text style={styles.outBadgeText}>Sold out</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Product Information */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/product/${item.id}`)}
        style={styles.contentWrap}
      >
        <Text style={styles.metaLabel} numberOfLines={1}>
          {item.category?.toUpperCase()} · {item.brand}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Pricing */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>{formatPrice(item.price)}</Text>
          {item.onSale && item.originalPrice && (
            <Text style={styles.originalPrice}>
              {formatPrice(item.originalPrice)}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Stacked Action Buttons */}
      <View style={styles.actionStack}>
        <TouchableOpacity
          style={[styles.buyNowBtn, isOutOfStock && styles.btnDisabled]}
          onPress={handleBuyNow}
          disabled={isOutOfStock}
          activeOpacity={0.85}
        >
          <Text style={styles.buyNowText}>
            {isOutOfStock ? "Unavailable" : "Buy now"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addToCartBtn, isOutOfStock && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={12} color="#181A15" style={{ marginRight: 3 }} />
          <Text style={styles.addToCartText}>Add to cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 10,
    marginBottom: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F6F5F0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#EEF0E7",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBrand: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777E67",
    textTransform: "uppercase",
  },
  badgeContainer: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  saleBadge: {
    backgroundColor: "#E05326",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  stockBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    color: "#92400E",
    fontSize: 9,
    fontWeight: "700",
  },
  outBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outBadgeText: {
    color: "#6B7280",
    fontSize: 9,
    fontWeight: "700",
  },
  contentWrap: {
    marginTop: 8,
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: 9.5,
    color: "#888C7F",
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  title: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#181A15",
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    marginTop: 6,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#181A15",
  },
  originalPrice: {
    fontSize: 10.5,
    color: "#9A9E91",
    textDecorationLine: "line-through",
    marginTop: 1,
  },
  actionStack: {
    gap: 6,
    marginTop: 4,
  },
  buyNowBtn: {
    backgroundColor: "#E05326",
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  addToCartBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#181A15",
    fontSize: 11,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
