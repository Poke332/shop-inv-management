import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../../config";
import ProductCard from "../../components/ProductCard";
import PleaseLoginModal from "../../components/PleaseLoginModal";
import { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";
import { TOP_BAR_HEIGHT } from "../../components/TopBar";

// Category slugs + labels mirror the web filter set (frontend
// CATEGORY_LABEL): the panel's single-select chips apply the same
// filter the web rail/panel does.
const CATEGORIES = [
  { slug: "audio", label: "Audio" },
  { slug: "smart-home", label: "Smart Home" },
  { slug: "gaming", label: "Gaming" },
  { slug: "laptops", label: "Laptops & PC" },
  { slug: "accessories", label: "Accessories" },
  { slug: "wearables", label: "Wearables" },
];

// Sort options mirror the web results-header select (labels included):
// "featured" keeps the catalog order the server returned.
const SORT_OPTIONS = [
  { value: "featured", label: "Sort: Featured" },
  { value: "price-asc", label: "Sort: Price ↑" },
  { value: "price-desc", label: "Sort: Price ↓" },
];

// Browse screen: page-level full-span search input + a "Filters"
// disclosure panel (category / brand / sort — the web's filter set) in
// place of the side-scroll category pills; the product grid below is
// unchanged. Filters apply live, like the web's immediate filters.
export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  // Products load from the backend; `null` until the first successful
  // fetch, and any failure shows the screen's error state instead.
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state (page-local; the web keeps the same set in URL params)
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sort, setSort] = useState("featured");
  // Signed-out users tapping a card CTA get the "Please login" popup
  const [loginPrompt, setLoginPrompt] = useState(false);

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

  // Brand options reflect the catalog (the web fetches the unfiltered
  // catalog for its rail the same way — not hard-coded).
  const catalogBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  }, [products]);

  // products may still be null before the first successful fetch.
  // Query/category/brand filter the catalog; "featured" keeps the
  // server's catalog order (the sort the API applies by default).
  const filteredProducts = useMemo(() => {
    let list = products || [];
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(needle) ||
          p.brand?.toLowerCase().includes(needle)
      );
    }
    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }
    if (sort === "price-asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [products, query, selectedCategory, selectedBrands, sort]);

  // "Clear all" resets the whole filter set (web: drops every param).
  function clearAll() {
    setQuery("");
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSort("featured");
  }

  function toggleBrand(brand) {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  }

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedCategory !== null ||
    selectedBrands.length > 0 ||
    sort !== "featured";

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
        {/* Page-level search: full-span input at the top of the content
            (the browse top bar is title-only) */}
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color="#767B6C" />
          <TextInput
            style={styles.searchInput}
            accessibilityLabel="Search products"
            placeholder="Find your next favorite"
            placeholderTextColor="#7C8071"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <TouchableOpacity
              style={styles.searchClearBtn}
              onPress={() => setQuery("")}
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={14} color="#4A4D43" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Page heading (preserved) */}
        <View style={styles.headingBlock}>
          <View style={styles.eyebrowRow}>
            <View style={styles.orangeDot} />
            <Text style={styles.eyebrowText}>CATALOG</Text>
          </View>
          <Text style={styles.title}>Browse all products.</Text>
        </View>

        {/* Filters disclosure: replaces the side-scroll category pills;
            the panel carries the web filter set (category / brand /
            sort). Chevron mirrors state: down = collapsed, up = open. */}
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setFiltersOpen((open) => !open)}
          activeOpacity={0.8}
          accessibilityLabel="Filters"
          accessibilityState={{ expanded: filtersOpen }}
          accessibilityExpanded={filtersOpen}
        >
          <Feather name="sliders" size={16} color="#4A4D43" />
          <Text style={styles.filtersButtonText}>Filters</Text>
          <Feather
            name={filtersOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#4A4D43"
            style={styles.filtersChevron}
          />
        </TouchableOpacity>

        {filtersOpen ? (
          <View style={styles.filterPanel}>
            {/* Category — single-select chip row (web mobile panel: tap
                the selected chip again to clear it) */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              accessibilityLabel="Filter by category"
            >
              {CATEGORIES.map((cat) => {
                const selected = selectedCategory === cat.slug;
                return (
                  <TouchableOpacity
                    key={cat.slug}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() =>
                      setSelectedCategory(selected ? null : cat.slug)
                    }
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Brand — multi-select, two columns of 44px tap rows */}
            <Text style={[styles.filterSectionTitle, styles.brandHeading]}>
              Brand
            </Text>
            <View style={styles.brandGrid}>
              {catalogBrands.map((brand) => {
                const checked = selectedBrands.includes(brand);
                return (
                  <TouchableOpacity
                    key={brand}
                    style={styles.brandRow}
                    onPress={() => toggleBrand(brand)}
                    accessibilityState={{ selected: checked }}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? (
                        <Feather name="check" size={10} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <Text style={styles.brandText} numberOfLines={1}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort — radio rows with the web select's labels */}
            <Text style={[styles.filterSectionTitle, styles.brandHeading]}>
              Sort
            </Text>
            <View style={styles.sortList}>
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sortRow}
                    onPress={() => setSort(option.value)}
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.sortText,
                        selected && styles.sortTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Panel actions: apply is live (taps filter immediately),
                so the row offers clear-all + close */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={clearAll}
                disabled={!hasActiveFilters}
              >
                <Text
                  style={[
                    styles.clearAllText,
                    !hasActiveFilters && styles.clearAllTextDisabled,
                  ]}
                >
                  Clear all
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setFiltersOpen(false)}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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
            <Text style={styles.emptyTitle}>No matches for these filters.</Text>
            <Text style={styles.emptySubtitle}>
              Try removing a filter, or start from the full catalog.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={clearAll}>
              <Text style={styles.retryBtnText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        ) : products ? (
          <View style={styles.gridContainer}>
            {filteredProducts.map((item) => (
              <ProductCard
                key={String(item.id)}
                item={item}
                onPurchaseBlocked={() => setLoginPrompt(true)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <PleaseLoginModal
        visible={loginPrompt}
        onDismiss={() => setLoginPrompt(false)}
      />
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
  // Full-span left-to-right search input at the top of the page content
  searchBox: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E1D8",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1A1A1A",
  },
  searchClearBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
  // Filters disclosure button: 44px tap row, chevron mirrors state
  filtersButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E1D8",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  filtersButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
  },
  filtersChevron: {
    // Right-aligned chevron (the web disclosure rotates the same one)
  },
  filterPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 16,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
    marginBottom: 8,
  },
  brandHeading: {
    marginTop: 16,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2EB",
    borderWidth: 1,
    borderColor: "#E3E1D8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: "#FEF2EE",
    borderColor: "#E05326",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4D43",
  },
  chipTextSelected: {
    color: "#E05326",
    fontWeight: "700",
  },
  brandGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  // Two-column checkbox rows; each row is a 44px tap target
  brandRow: {
    width: "50%",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#9A9E91",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#E05326",
    borderColor: "#E05326",
  },
  brandText: {
    fontSize: 13,
    color: "#1A1A1A",
    flexShrink: 1,
  },
  sortList: {
    gap: 2,
  },
  sortRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#9A9E91",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#E05326",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E05326",
  },
  sortText: {
    fontSize: 13,
    color: "#4A4D43",
  },
  sortTextSelected: {
    color: "#181A15",
    fontWeight: "700",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2F2EB",
  },
  clearAllBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05326",
  },
  clearAllTextDisabled: {
    opacity: 0.4,
  },
  doneBtn: {
    backgroundColor: "#E05326",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 13,
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
