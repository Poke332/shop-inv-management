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
import { FALLBACK_PRODUCTS } from "../../data/fallbackProducts";

// Modular Components
import AnnouncementBar from "../../components/AnnouncementBar";
import HomeHeader from "../../components/HomeHeader";
import HeroSection from "../../components/HeroSection";
import BrandTicker from "../../components/BrandTicker";
import CategoryGrid from "../../components/CategoryGrid";
import ProductCard from "../../components/ProductCard";
import PromoBanner from "../../components/PromoBanner";

export default function HomeScreen() {
  const scrollRef = useRef(null);
  const productSectionY = useRef(0);

  // Initialize with fallback catalog data so products render immediately without lag
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesFilter = [
    { slug: "all", label: "All picks" },
    { slug: "audio", label: "Audio" },
    { slug: "wearables", label: "Wearables" },
    { slug: "laptops", label: "Laptops & PC" },
    { slug: "gaming", label: "Gaming" },
    { slug: "smart-home", label: "Smart Home" },
    { slug: "accessories", label: "Accessories" },
  ];

  // Fetch product catalog from backend with automatic fallback
  async function loadProducts() {
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
      if (Array.isArray(data.items) && data.items.length > 0) {
        setProducts(data.items);
      }
    } catch {
      // Graceful fallback: maintain catalog items so user never sees empty/broken screen
      setProducts((prev) => (prev && prev.length > 0 ? prev : FALLBACK_PRODUCTS));
    }
  }

  useEffect(() => {
    let cancelled = false;

    loadProducts().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  // Scroll smoothly to the product section
  function scrollToProducts() {
    if (scrollRef.current && productSectionY.current > 0) {
      scrollRef.current.scrollTo({
        y: productSectionY.current - 10,
        animated: true,
      });
    }
  }

  function handleSelectCategory(slug) {
    setSelectedCategory(slug);
    scrollToProducts();
  }

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
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
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EB" />

      {/* Explicitly guarantee native navigation header is hidden */}
      <Stack.Screen options={{ headerShown: false, title: "" }} />

      {/* 1. TOP ANNOUNCEMENT BAR (dengan safe-area inset top rapat) */}
      <AnnouncementBar />

      {/* 2. APP HEADER & NAVIGATION (Wordmark, Profile, Bag, Tabs, Search) */}
      <HomeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={handleSelectCategory}
        onShopNowPress={scrollToProducts}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* 3. HERO BANNER SECTION (Card Cream #F6F4EE, Heading italic, Dual Buttons, Featured Product) */}
        <HeroSection
          onExploreAudio={() => handleSelectCategory("audio")}
          onFindUpgrade={scrollToProducts}
        />

        {/* 4. BRAND LOGO TICKER (SONY, Anker, logitech, SAMSUNG, JBL, ASUS) */}
        <BrandTicker />

        {/* 5. CATEGORY GRID SECTION (FIND YOUR THING - 6 Kategori dengan Feather Vector Icons) */}
        <CategoryGrid
          onSelectCategory={handleSelectCategory}
          selectedCategory={selectedCategory}
        />

        {/* 6. PRODUCT SHOWCASE / FILTER SECTION (THE GOOD STUFF) */}
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
                setSearchQuery("");
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
          {loading && products.length === 0 ? (
            <View style={styles.stateCenter}>
              <ActivityIndicator size="large" color="#E05326" />
              <Text style={styles.stateText}>Loading collection…</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
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
                  setSearchQuery("");
                }}
              >
                <Text style={styles.retryBtnText}>Browse all products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredProducts.map((item) => (
                <ProductCard key={String(item.id)} item={item} />
              ))}
            </View>
          )}
        </View>

        {/* 7. PROMOTIONAL BANNER BOTTOM SECTION (MAKE ROOM FOR BETTER) */}
        <PromoBanner onUpgradePress={scrollToProducts} />
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
    paddingBottom: 24,
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
