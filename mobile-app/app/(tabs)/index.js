import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { API_URL } from "../../config";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";

// Modular Components
import { TOP_BAR_HEIGHT } from "../../components/TopBar";
import { useSearch } from "../../context/SearchContext";
import HeroSection from "../../components/HeroSection";
import BrandTicker from "../../components/BrandTicker";
import CategoryGrid from "../../components/CategoryGrid";
import ProductCard from "../../components/ProductCard";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const productSectionY = useRef(0);
  const { query, setQuery, homeScrollRef } = useSearch();

  // Products load from the backend; `null` until the first successful
  // fetch, and any failure shows the screen's error state instead.
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states — the search query lives in the shared
  // context so the pinned top bar (rendered from the root layout) can
  // drive it on every screen; home applies it to the product grid.
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchQuery = query;

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

  // Expose the products-scroll action to the shared top bar (search
  // submit on home); runs after every render so the closure stays
  // current.
  useEffect(() => {
    homeScrollRef.current = scrollToProducts;
  });

  // Arriving on home from another screen with a pending search: jump
  // straight to the filtered results.
  useEffect(() => {
    if (query.trim()) {
      setTimeout(scrollToProducts, 350);
    }
    // Mount-only behavior; the pending query is read once.
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  // Scroll smoothly to the product section (offset accounts for the
  // pinned top bar overlapping the top of the viewport)
  function scrollToProducts() {
    if (scrollRef.current && productSectionY.current > 0) {
      scrollRef.current.scrollTo({
        y: productSectionY.current - TOP_BAR_HEIGHT - insets.top - 10,
        animated: true,
      });
    }
  }

  function handleSelectCategory(slug) {
    setSelectedCategory(slug);
    scrollToProducts();
  }

  // Filtered Products List (products may still be null before the first
  // successful fetch)
  const filteredProducts = (products || []).filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Explicitly guarantee native navigation header is hidden */}
      <Stack.Screen options={{ headerShown: false, title: "" }} />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          // Keep scroll content clear of the pinned top bar and the
          // pinned bottom nav bar
          {
            paddingTop: TOP_BAR_HEIGHT + insets.top,
            paddingBottom: 24 + BOTTOM_NAV_HEIGHT + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#E05326"]}
            tintColor="#E05326"
          />
        }
      >
        {/* Hero banner section (cream card, featured product) */}
        <HeroSection
          onExploreAudio={() => handleSelectCategory("audio")}
          onFindUpgrade={scrollToProducts}
        />

        {/* Brand logo ticker */}
        <BrandTicker />

        {/* Category grid section */}
        <CategoryGrid
          onSelectCategory={handleSelectCategory}
          selectedCategory={selectedCategory}
        />

        {/* Product showcase / filter section */}
        <View
          style={styles.productsSection}
          onLayout={(event) => {
            productSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          {/* Section Heading */}
          <View style={styles.sectionHeadingRow}>
            <View>
              <View style={styles.eyebrowRow}>
                <View style={styles.orangeDot} />
                <Text style={styles.eyebrowText}>THE GOOD STUFF</Text>
              </View>
              <Text style={styles.sectionTitle}>Meet your next favorites.</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setSelectedCategory("all");
                setQuery("");
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.shopEverythingBtn}
            >
              <Text style={styles.shopEverythingLink}>Shop everything</Text>
              <Feather name="arrow-up-right" size={13} color="#181A15" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills Tabs */}
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

          {/* Product Grid Content */}
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
              <Text style={styles.emptyTitle}>More favorites are on the way.</Text>
              <Text style={styles.emptySubtitle}>
                Try selecting another category or clear your search query.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setSelectedCategory("all");
                  setQuery("");
                }}
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
        </View>
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
  productsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181A15",
    letterSpacing: -0.5,
  },
  shopEverythingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 2,
  },
  shopEverythingLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#181A15",
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
