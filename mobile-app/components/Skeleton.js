import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

// Shared skeleton loaders: app-gray pulsing blocks shown in place of a
// surface's content while its data is still fetching. Each block runs a
// looping opacity pulse (JS driver so it animates on web too). The
// composites below mirror the card shapes they stand in for.

// A single pulsing gray block. `height`/`width` are optional; a `style`
// can supply aspectRatio (image blocks) or layout (grid placement). The
// gray background is set inline (not via a StyleSheet object) so it
// survives the Animated.View style merge on the web runtime.
export function SkeletonBlock({ height, width, style, testID }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { backgroundColor: "#E3E1D8", borderRadius: 6 },
        { height, width, opacity: pulse },
        style,
      ]}
      testID={testID}
    />
  );
}

// Product-card placeholder matching ProductCard: a square image block,
// a couple of text lines, and two stacked button blocks. Sized to sit
// in the two-up product grid.
export function SkeletonProductCard() {
  return (
    <View style={card.card}>
      <SkeletonBlock style={card.image} />
      <View style={card.body}>
        <SkeletonBlock height={9} width="55%" />
        <SkeletonBlock height={13} width="90%" style={{ marginTop: 7 }} />
        <SkeletonBlock height={13} width="45%" style={{ marginTop: 8 }} />
        <SkeletonBlock height={26} width="100%" style={{ marginTop: 10 }} />
        <SkeletonBlock height={22} width="100%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// A two-up grid of product-card skeletons, laid out exactly like the
// live product grid (48.2% card width, wrapped, spaced).
export function SkeletonProductGrid({ count = 4 }) {
  return (
    <View style={card.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </View>
  );
}

// Order-card placeholder matching the orders list item: a header
// (reference/date + a status badge), a divider, item lines, a divider,
// and a total footer.
export function SkeletonOrderCard() {
  return (
    <View style={order.card}>
      <View style={order.header}>
        <View style={order.headerLeft}>
          <SkeletonBlock height={14} width="45%" />
          <SkeletonBlock height={10} width="35%" style={{ marginTop: 5 }} />
        </View>
        <SkeletonBlock height={20} width={64} style={order.badge} />
      </View>
      <View style={order.divider} />
      <SkeletonBlock height={12} width="80%" />
      <SkeletonBlock height={12} width="70%" style={{ marginTop: 8 }} />
      <View style={order.divider} />
      <View style={order.footer}>
        <SkeletonBlock height={13} width={70} />
        <SkeletonBlock height={16} width={64} />
      </View>
    </View>
  );
}

// Product-detail placeholder matching the detail screen: a hero image
// block, then name/price/stock/description lines.
export function SkeletonDetail() {
  return (
    <View>
      <SkeletonBlock style={detail.hero} />
      <View style={detail.body}>
        <SkeletonBlock height={11} width={80} />
        <SkeletonBlock height={22} width="80%" style={{ marginTop: 12 }} />
        <SkeletonBlock height={22} width={120} style={{ marginTop: 10 }} />
        <SkeletonBlock height={14} width="60%" style={{ marginTop: 8 }} />
        <SkeletonBlock height={14} width="90%" style={{ marginTop: 20 }} />
        <SkeletonBlock height={14} width="85%" style={{ marginTop: 8 }} />
        <SkeletonBlock height={14} width="50%" style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// Cart-item row placeholder matching the cart screen's item card: a
// square thumbnail, a brand/name column, and a line-total block.
export function SkeletonCartRow() {
  return (
    <View style={cartRow.card}>
      <View style={cartRow.row}>
        <SkeletonBlock height={52} width={52} style={cartRow.thumb} />
        <View style={cartRow.info}>
          <SkeletonBlock height={9} width={60} />
          <SkeletonBlock height={13} width="80%" style={{ marginTop: 6 }} />
        </View>
        <SkeletonBlock height={14} width={56} />
      </View>
    </View>
  );
}

const card = {
  card: {
    width: "48.2%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 10,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#F2F2EB",
  },
  body: {
    marginTop: 8,
  },
};

const order = {
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  badge: {
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F2EB",
    marginVertical: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

const detail = {
  hero: {
    width: "100%",
    height: 320,
    borderRadius: 0,
    backgroundColor: "#F2F2EB",
  },
  body: {
    padding: 18,
  },
};

const cartRow = {
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE7DF",
    marginBottom: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  thumb: {
    borderRadius: 8,
    backgroundColor: "#F2F2EB",
  },
  info: {
    flex: 1,
    marginHorizontal: 10,
  },
};
