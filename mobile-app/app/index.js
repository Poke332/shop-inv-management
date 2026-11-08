import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../config";

// ---------- helpers ----------

// Format a number like 1290000 into "Rp 1.290.000"
function formatPrice(value) {
  return "Rp " + Number(value).toLocaleString("id-ID");
}

// ---------- component ----------

export default function ProductListScreen() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null | { kind: "transient" | "not_found", message }
  const [refreshing, setRefreshing] = useState(false); // true while pull-to-refresh is active
  const [retrying, setRetrying] = useState(false); // true while "Try Again" is re-fetching
  const [btnFocused, setBtnFocused] = useState(false); // keyboard focus on the error action button

  // Reusable fetch — called on first mount, on pull-to-refresh, and on "Try Again".
  // A 404 means the API is not reachable at the configured base URL; any other
  // failure (network error, 5xx, unexpected status) is treated as transient.
  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (response.status === 404) {
        setError({ kind: "not_found", message: "" });
        return;
      }
      if (!response.ok) throw new Error("Server responded with " + response.status);
      const data = await response.json(); // { items, total, hasMore }
      setProducts(data.items);
      setError(null); // clear any previous error on success
    } catch (err) {
      setError({ kind: "transient", message: err.message });
    }
  }

  // Fetch the product list once when the screen mounts.
  useEffect(() => {
    let cancelled = false; // prevents state updates after unmount

    loadProducts().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Called when the user pulls down to refresh the list.
  async function handleRefresh() {
    setRefreshing(true);           // show the refresh spinner
    await loadProducts();          // re-fetch from the API
    setRefreshing(false);          // hide the refresh spinner
  }

  // Re-fetches the list after a transient failure (the "Try Again" button).
  async function handleRetry() {
    setRetrying(true);
    await loadProducts();
    setRetrying(false);
  }

  // Navigates back to the product list (the "Back to Products" button).
  function handleBackToProducts() {
    router.replace("/");
  }

  // --- loading state ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.statusText}>Loading products…</Text>
      </View>
    );
  }

  // --- error state (transient → "Try Again", 404 → "Back to Products") ---
  if (error) {
    const isNotFound = error.kind === "not_found";
    const heading = isNotFound ? "Products not found." : "Couldn't load products.";
    const detail = isNotFound ? null : "Please check your connection and try again.";
    const label = isNotFound ? "Back to Products" : retrying ? "Refreshing…" : "Try Again";

    return (
      <View
        style={styles.center}
        role="alert"
        aria-live="assertive"
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{heading}</Text>
        {detail ? <Text style={styles.errorDetail}>{detail}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isNotFound ? "Back to products" : "Try again"}
          onAccessibilityStateChange={({ focused }) => setBtnFocused(focused)}
          disabled={retrying}
          onPress={isNotFound ? handleBackToProducts : handleRetry}
          style={({ pressed }) => [
            styles.actionButton,
            btnFocused && styles.actionButtonFocused,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionButtonLabel}>{label}</Text>
        </Pressable>
      </View>
    );
  }

  // --- empty state ---
  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>No products found.</Text>
      </View>
    );
  }

  // --- card for each product ---
  function renderItem({ item }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.thumbnail} />

        <View style={styles.cardBody}>
          <Text style={styles.brand}>{item.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {item.onSale && item.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.originalPrice)}
              </Text>
            )}
          </View>

          {item.onSale && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>SALE</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        // Pull-to-refresh: the spinner shows while `refreshing` is true, and
        // releasing the pull calls handleRefresh, which re-fetches the list.
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B42318",
    textAlign: "center",
  },
  errorDetail: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  actionButton: {
    minHeight: 44,
    minWidth: 140,
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    borderRadius: 10,
  },
  actionButtonPressed: {
    backgroundColor: "#4338ca",
  },
  actionButtonFocused: {
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  list: {
    padding: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    // shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // shadow (Android)
    elevation: 2,
  },
  thumbnail: {
    width: 110,
    height: 110,
    backgroundColor: "#f3f4f6",
  },
  cardBody: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  brand: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  saleBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

