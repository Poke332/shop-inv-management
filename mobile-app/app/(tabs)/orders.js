import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config";

function formatPrice(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "pending":
      return { bg: "#FEF3C7", text: "#92400E", label: "Pending" };
    case "processing":
      return { bg: "#DBEAFE", text: "#1E40AF", label: "Processing" };
    case "shipped":
      return { bg: "#EDE9FE", text: "#5B21B6", label: "Shipped" };
    case "delivered":
      return { bg: "#D1FAE5", text: "#065F46", label: "Delivered" };
    default:
      return { bg: "#F3F4F6", text: "#4B5563", label: status || "Unknown" };
  }
}

export default function MyOrdersScreen() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function fetchOrders() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load orders (status " + response.status + ")");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [token]);

  function handleRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  // Not signed in state
  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
        <Text style={styles.emptySubtitle}>
          Please sign in to track and view your order history.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E05326" />
        <Text style={styles.statusText}>Loading your orders…</Text>
      </View>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={fetchOrders}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
        <Text style={styles.emptySubtitle}>
          Explore our store and place your first order today!
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.primaryButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderOrderItem({ item }) {
    const statusCfg = getStatusStyle(item.status);
    const lines = item.lines || [];

    return (
      <View style={styles.orderCard}>
        {/* Card Header: Reference & Status */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderRef}>{item.reference || `#${item.id}`}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Order Lines */}
        <View style={styles.linesContainer}>
          {lines.map((line, idx) => (
            <View key={idx} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={1}>
                {line.productName || line.name || `Item ${idx + 1}`}
              </Text>
              <Text style={styles.lineQty}>× {line.qty}</Text>
              <Text style={styles.lineAmount}>
                {formatPrice(line.amount || line.unitPrice * line.qty)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Card Footer: Total */}
        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id || item.reference)}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#E05326"]}
            tintColor="#E05326"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 52,
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
    marginBottom: 20,
  },
  statusText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#E05326",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderRef: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  linesContainer: {
    gap: 8,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lineName: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    marginRight: 8,
  },
  lineQty: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 12,
  },
  lineAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E05326",
  },
});

