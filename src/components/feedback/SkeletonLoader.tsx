// ============================================================
// SkeletonLoader — Shimmer loading placeholder
// Replaces blank loading states with animated skeleton UI
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBone({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.surfaceHighlight,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Skeleton card — mimics a RiskStateCard */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.card, style]}>
      <View style={sk.cardHeader}>
        <SkeletonBone width={100} height={12} />
        <SkeletonBone width={50} height={20} borderRadius={BorderRadius.md} />
      </View>
      <SkeletonBone width="80%" height={10} style={{ marginTop: Spacing.sm }} />
      <SkeletonBone width="60%" height={10} style={{ marginTop: Spacing.xs }} />
      <View style={sk.cardFooter}>
        <SkeletonBone width={60} height={8} />
        <SkeletonBone width={40} height={8} />
        <SkeletonBone width={55} height={8} />
      </View>
    </View>
  );
}

/** Skeleton row — mimics a list item */
export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.row, style]}>
      <SkeletonBone width={36} height={36} borderRadius={18} />
      <View style={sk.rowTextBlock}>
        <SkeletonBone width="70%" height={12} />
        <SkeletonBone width="45%" height={10} style={{ marginTop: Spacing.xs }} />
      </View>
      <SkeletonBone width={40} height={16} borderRadius={BorderRadius.sm} />
    </View>
  );
}

/** Skeleton chart — mimics a chart block */
export function SkeletonChart({ height = 180, style }: { height?: number; style?: ViewStyle }) {
  return (
    <View style={[sk.chart, { height }, style]}>
      <SkeletonBone width={120} height={14} style={{ marginBottom: Spacing.sm }} />
      <View style={sk.chartBars}>
        {[0.6, 0.8, 0.45, 0.9, 0.55, 0.7].map((h, i) => (
          <SkeletonBone key={i} width={24} height={h * (height - 50)} borderRadius={BorderRadius.xs} />
        ))}
      </View>
    </View>
  );
}

/** Multiple skeleton cards */
export function SkeletonList({ count = 3, variant = 'card' }: { count?: number; variant?: 'card' | 'row' | 'chart' }) {
  const Component = variant === 'row' ? SkeletonRow : variant === 'chart' ? SkeletonChart : SkeletonCard;
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} style={{ marginBottom: Spacing.sm }} />
      ))}
    </View>
  );
}

export { SkeletonBone };

const sk = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  rowTextBlock: {
    flex: 1,
  },
  chart: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
});
