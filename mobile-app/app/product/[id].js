import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_URL } from "../../config";

// Format a number like 1290000 into "Rp 1.290.000"
function formatPrice(value) {
  return "Rp " + Number(value).toLocaleString("id-ID");
}

export default function ProductDetailScreen() {
  // expo-router puts route params into this hook — /product/P-231 → { id: "P-231" }
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the single product when the screen mounts or when the id changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      try {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Server responded with " + response.status);
        const data = await response.json(); // single product object
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  // --- loading state ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.statusText}>Loading…</Text>
      </View>
    );
  }

  // --- error state ---
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </View>
    );
  }

  // --- empty / not-found state ---
  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>Product not found.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Hero image */}
        <Image source={{ uri: product.image }} style={styles.heroImage} />

        <View style={styles.body}>
          {/* Brand + sale badge */}
          <View style={styles.topRow}>
            <Text style={styles.brand}>{product.brand}</Text>
            {product.onSale && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>SALE</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.onSale && product.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          {/* Stock info */}
          <Text style={styles.stock}>
            {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
          </Text>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Specs table */}
          {product.specs && product.specs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Specifications</Text>
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
            </>
          )}

          {/* Bottom spacer so content isn't flush against the edge */}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heroImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f3f4f6",
  },
  body: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brand: {
    fontSize: 13,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  saleBadge: {
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
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  originalPrice: {
    fontSize: 15,
    color: "#999",
    textDecorationLine: "line-through",
  },
  stock: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
  },
  specRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  specRowEven: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  specKey: {
    width: 120,
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    color: "#1a1a1a",
  },
});

