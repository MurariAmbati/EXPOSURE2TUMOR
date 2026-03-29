// ============================================================
// Exposure2Tumor — Metric Tile (compact data display)
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { Sparkline } from '../charts/Sparkline';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  percentile?: number;
  trend?: number[];
  trendColor?: string;
  onPress?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricTile({
  label,
  value,
  unit,
  percentile,
  trend,
  trendColor,
  onPress,
  color = Colors.textPrimary,
  size = 'md',
}: Props) {
  const sizeStyles = {
    sm: { padding: Spacing.sm, minWidth: 80 },
    md: { padding: Spacing.md, minWidth: 100 },
    lg: { padding: Spacing.lg, minWidth: 140 },
  };

  return (
    <Pressable style={[styles.container, sizeStyles[size]]} onPress={onPress}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {percentile !== undefined && (
        <Text style={styles.percentile}>P{percentile}</Text>
      )}
      {trend && trend.length > 1 && (
        <View style={styles.sparklineContainer}>
          <Sparkline data={trend} width={60} height={18} color={trendColor ?? color} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  label: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontSize: 9,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    ...Typography.monoLarge,
  },
  unit: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
    marginLeft: Spacing.xxs,
  },
  percentile: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sparklineContainer: {
    marginTop: Spacing.xs,
  },
});
