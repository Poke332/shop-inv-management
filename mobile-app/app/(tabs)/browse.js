import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../../config";
import ProductCard from "../../components/ProductCard";
import { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";
import { TOP_BAR_HEIGHT } from "../../components/TopBar";

// Minimal catalog screen: category filter + full product grid.
// Reuses the home screen's data-fetch pattern and visual language.
export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  // Products load from the backend; `null` until the first successful
  // fetch, and any failure shows the screen's error state instead.
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categoriesFilter = [
    { slug: "all", label: "All picks" },
    { slug: "audio", label: "Audio" },
    { slug: "wearables", label: "Wearables" },
    { slug: "laptops", label: "Laptops & PC" },
    { slug: "gaming", label: "Gaming" },
    { slug: "smart-home", label: "Smart Home" },
    { slug: "accessories", label: "Accessories" },
  ];

  // Fetch the product catalog from the backend. Any failure — network
  // error, non-OK status, or an unexpected payload — surfaces as the
  // screen's error state; no default data is substituted.
  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${API_URL}/api/products`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Server returned status " + response.status);
      }
      const data = await response.json();
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("Unexpected response from the server");
      }
      setProducts(data.items);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // products may still be null before the first successful fetch
  const filteredProducts = (products || []).filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // Clear the pinned top bar and the pinned bottom nav bar
            paddingTop: TOP_BAR_HEIGHT + insets.top + 16,
            paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.headingBlock}>
          <View style={styles.eyebrowRow}>
            <View style={styles.orangeDot} />
            <Text style={styles.eyebrowText}>CATALOG</Text>
          </View>
          <Text style={styles.title}>Browse all products.</Text>
        </View>

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {categoriesFilter.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <TouchableOpacity
                key={cat.slug}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setSelectedCategory(cat.slug)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product grid content */}
        {error && !products ? (
          <View style={styles.stateCenter}>
            <Feather
              name="alert-circle"
              size={38}
              color="#DC2626"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.emptyTitle}>Failed to load products</Text>
            <Text style={styles.emptySubtitle}>
              Check your connection, then try again.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading && !products ? (
          <View style={styles.stateCenter}>
            <ActivityIndicator size="large" color="#E05326" />
            <Text style={styles.stateText}>Loading collection…</Text>
          </View>
        ) : products && filteredProducts.length === 0 ? (
          <View style={styles.stateCenter}>
            <Feather name="package" size={38} color="#888C7F" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No products in this category.</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting another category.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => setSelectedCategory("all")}
            >
              <Text style={styles.retryBtnText}>Browse all products</Text>
            </TouchableOpacity>
          </View>
        ) : products ? (
          <View style={styles.gridContainer}>
            {filteredProducts.map((item) => (
              <ProductCard key={String(item.id)} item={item} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headingBlock: {
    marginBottom: 14,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  orangeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E05326",
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6A6E61",
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181A15",
    letterSpacing: -0.5,
  },
  tabsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  tabPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  tabPillActive: {
    backgroundColor: "#181A15",
    borderColor: "#181A15",
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4D43",
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  stateCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  stateText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#181A15",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: "#E05326",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
