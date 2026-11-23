import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { TOP_BAR_HEIGHT } from "../components/TopBar";

function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

// The pinned purchase-detail bar: 44px row + 6px vertical pads + 1px
// top border. Scroll content pads below by this so the last item
// never hides behind the bar.
const BAR_HEIGHT = 57;

// Cart page: the cart items and nothing else (the checkout form moved
// to the /checkout-wizard route). The pinned bar below the content
// carries the totals + the single "Checkout" button + an expand
// chevron that opens the purchase-detail panel anchored above the bar.
export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, subtotal, total } = useCart();
  // Which item rows have their per-product details open
  const [expandedItems, setExpandedItems] = useState([]);
  // The purchase-detail panel above the bar (the bar's chevron toggles it)
  const [detailsOpen, setDetailsOpen] = useState(false);

  function toggleItem(productId) {
    setExpandedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  // Empty cart: the pre-polish empty state, unchanged
  if (!cart || cart.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
        <Feather name="shopping-bag" size={48} color="#888C7F" style={styles.emptyIcon} />
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: TOP_BAR_HEIGHT + insets.top + 16,
            // Clear the pinned purchase-detail bar + the bottom nav
            paddingBottom: 12 + BAR_HEIGHT + BOTTOM_NAV_HEIGHT + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Heading (web cart parity: "Cart" + the item count) */}
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Cart</Text>
          <Text style={styles.headingMeta}>
            ({cart.length} item{cart.length === 1 ? "" : "s"})
          </Text>
        </View>

        {/* Cart items only: each card's primary row stays compact; the
            expand chevron reveals that line's details below it */}
        {cart.map((item) => {
          const expanded = expandedItems.includes(item.productId);
          return (
            <View key={item.productId} style={styles.itemCard}>
              <View style={styles.itemRow}>
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
                </View>
                <Text style={styles.itemLineTotal}>
                  {formatPrice(item.price * item.qty)}
                </Text>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => toggleItem(item.productId)}
                  accessibilityLabel={expanded ? "Collapse details" : "Expand details"}
                  accessibilityState={{ expanded }}
                  accessibilityExpanded={expanded}
                >
                  <Feather
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#4A4D43"
                  />
                </TouchableOpacity>
              </View>

              {expanded ? (
                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Unit price</Text>
                    <Text style={styles.detailValue}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{item.qty}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>Line total</Text>
                    <Text style={styles.detailValue}>
                      {formatPrice(item.price * item.qty)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Purchase-detail panel: anchored above the bar while open */}
      {detailsOpen ? (
        <View
          style={[
            styles.detailsPanel,
            { bottom: BAR_HEIGHT + BOTTOM_NAV_HEIGHT + insets.bottom },
          ]}
        >
          <Text style={styles.panelTitle}>Purchase details</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.freeShippingBadge}>FREE</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      ) : null}

      {/* Sticky purchase-detail bar: pinned just above the bottom nav,
          never scrolls away. Totals + the single "Checkout" button +
          the expand chevron (down = collapsed, up = expanded) */}
      <View
        style={[
          styles.bar,
          { bottom: BOTTOM_NAV_HEIGHT + insets.bottom },
        ]}
      >
        <View style={styles.barTotals}>
          <Text style={styles.barTotalLabel}>Total</Text>
          <Text style={styles.barTotalValue}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push("/checkout-wizard")}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setDetailsOpen((open) => !open)}
          accessibilityLabel={
            detailsOpen ? "Collapse details" : "Expand details"
          }
          accessibilityState={{ expanded: detailsOpen }}
          accessibilityExpanded={detailsOpen}
        >
          <Feather
            name={detailsOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#4A4D43"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  headingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#181A15",
    letterSpacing: -0.5,
  },
  headingMeta: {
    fontSize: 13,
    color: "#888C7F",
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    marginBottom: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#F2F2EB",
  },
  imagePlaceholder: {
    backgroundColor: "#EAE7DF",
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  itemBrand: {
    fontSize: 10,
    color: "#888C7F",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 2,
    lineHeight: 17,
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
  },
  // 44px tap target for the expand chevrons (item rows + the bar)
  expandBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  itemDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2EB",
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  detailRowLast: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F2F2EB",
  },
  detailLabel: {
    fontSize: 12.5,
    color: "#888C7F",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  // The pinned bar just above the bottom nav
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAE7DF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  barTotals: {
    flex: 1,
  },
  barTotalLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888C7F",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  barTotalValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E05326",
  },
  checkoutBtn: {
    backgroundColor: "#E05326",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  checkoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // The expanded purchase-detail panel, anchored above the bar
  detailsPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5DF",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#181A15",
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: "#888C7F",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  freeShippingBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  grandTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EAE7DF",
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#181A15",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E05326",
  },
});
