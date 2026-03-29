// ============================================================
// Exposure2Tumor — Disparity Bar Chart
// Side-by-side comparison of demographic group disparities
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { DisparityMetric } from '../../types';

interface Props {
  disparities: DisparityMetric[];
  maxWidth?: number;
}

export function DisparityBars({ disparities, maxWidth = 300 }: Props) {
  if (disparities.length === 0) return null;

  const maxVal = Math.max(
    ...disparities.flatMap(d => [d.groupA.value, d.groupB.value])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Disparities</Text>
      {disparities.map((d, i) => {
        const widthA = maxVal > 0 ? (d.groupA.value / maxVal) * maxWidth : 0;
        const widthB = maxVal > 0 ? (d.groupB.value / maxVal) * maxWidth : 0;
        const isDisparate = d.ratio > 1.2;

        return (
          <View key={i} style={styles.disparityItem}>
            <View style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>{formatDimension(d.dimension)}</Text>
              <View style={[styles.ratioBadge, isDisparate ? styles.ratioBadgeAlert : styles.ratioBadgeNormal]}>
                <Text style={[styles.ratioText, isDisparate ? styles.ratioTextAlert : styles.ratioTextNormal]}>
                  {d.ratio.toFixed(1)}x
                </Text>
              </View>
            </View>

            <Text style={styles.measureLabel}>{d.measureName}</Text>

            {/* Group A */}
            <View style={styles.barRow}>
              <Text style={styles.groupLabel} numberOfLines={1}>{d.groupA.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: widthA, backgroundColor: Colors.highAlert + 'CC' }]} />
              </View>
              <Text style={styles.barValue}>{d.groupA.value.toFixed(1)}</Text>
            </View>

            {/* Group B */}
            <View style={styles.barRow}>
              <Text style={styles.groupLabel} numberOfLines={1}>{d.groupB.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: widthB, backgroundColor: Colors.accentTeal + 'CC' }]} />
              </View>
              <Text style={styles.barValue}>{d.groupB.value.toFixed(1)}</Text>
            </View>

            {d.trend !== 'stable' && (
              <Text style={[styles.trendLabel, { color: d.trend === 'worsening' ? Colors.highAlert : Colors.success }]}>
                {d.trend === 'worsening' ? '↑ Disparity widening' : '↓ Disparity narrowing'}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function formatDimension(dim: string): string {
  return dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.md },
  title: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md },
  disparityItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentTeal,
  },
  dimensionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  dimensionLabel: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  ratioBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  ratioBadgeAlert: { backgroundColor: Colors.highAlert + '20' },
  ratioBadgeNormal: { backgroundColor: Colors.accentTeal + '20' },
  ratioText: { ...Typography.monoSmall, fontWeight: '700' },
  ratioTextAlert: { color: Colors.highAlert },
  ratioTextNormal: { color: Colors.accentTeal },
  measureLabel: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  groupLabel: { ...Typography.monoSmall, color: Colors.textSecondary, width: 80 },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, marginHorizontal: Spacing.sm, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barValue: { ...Typography.monoSmall, color: Colors.textMuted, width: 40, textAlign: 'right' },
  trendLabel: { ...Typography.monoSmall, marginTop: Spacing.xs, textAlign: 'right' },
});
