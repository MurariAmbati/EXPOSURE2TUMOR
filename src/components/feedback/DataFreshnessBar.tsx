// ============================================================
// Exposure2Tumor — DataFreshnessBar Component
// Visual data vintage / freshness indicator per source
// ============================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

interface SourceFreshness {
  id: string;
  name: string;
  abbreviation: string;
  vintage: string;
  lastChecked?: string;
  updateFrequency: string;
}

interface DataFreshnessBarProps {
  sources: SourceFreshness[];
  onSourcePress?: (sourceId: string) => void;
  compact?: boolean;
}

function getFreshnessStatus(vintage: string): {
  status: 'fresh' | 'aging' | 'stale';
  color: string;
  label: string;
} {
  const currentYear = new Date().getFullYear();
  // Try to parse the last year from vintage string like "2018-2022"
  const match = vintage.match(/(\d{4})/g);
  if (!match || match.length === 0) {
    return { status: 'stale', color: Colors.highAlert, label: 'Unknown' };
  }
  const latestYear = Math.max(...match.map(Number));
  const age = currentYear - latestYear;

  if (age <= 1) return { status: 'fresh', color: '#10B981', label: 'Current' };
  if (age <= 3) return { status: 'aging', color: '#F59E0B', label: `${age}yr lag` };
  return { status: 'stale', color: '#EF4444', label: `${age}yr old` };
}

export function DataFreshnessBar({ sources, onSourcePress, compact = false }: DataFreshnessBarProps) {
  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      const aStatus = getFreshnessStatus(a.vintage);
      const bStatus = getFreshnessStatus(b.vintage);
      const order = { fresh: 0, aging: 1, stale: 2 };
      return order[aStatus.status] - order[bStatus.status];
    });
  }, [sources]);

  const summary = useMemo(() => {
    let fresh = 0, aging = 0, stale = 0;
    sources.forEach((s) => {
      const f = getFreshnessStatus(s.vintage);
      if (f.status === 'fresh') fresh++;
      else if (f.status === 'aging') aging++;
      else stale++;
    });
    return { fresh, aging, stale, total: sources.length };
  }, [sources]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBar}>
          {summary.fresh > 0 && (
            <View style={[styles.compactSeg, { flex: summary.fresh, backgroundColor: '#10B981' }]} />
          )}
          {summary.aging > 0 && (
            <View style={[styles.compactSeg, { flex: summary.aging, backgroundColor: '#F59E0B' }]} />
          )}
          {summary.stale > 0 && (
            <View style={[styles.compactSeg, { flex: summary.stale, backgroundColor: '#EF4444' }]} />
          )}
        </View>
        <Text style={styles.compactLabel}>
          {summary.fresh} current · {summary.aging} aging · {summary.stale} stale
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Freshness</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Aging</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Stale</Text>
          </View>
        </View>
      </View>

      {/* Health bar */}
      <View style={styles.healthBar}>
        {summary.fresh > 0 && (
          <View style={[styles.healthSeg, { flex: summary.fresh, backgroundColor: '#10B981' }]}>
            <Text style={styles.healthSegText}>{summary.fresh}</Text>
          </View>
        )}
        {summary.aging > 0 && (
          <View style={[styles.healthSeg, { flex: summary.aging, backgroundColor: '#F59E0B' }]}>
            <Text style={styles.healthSegText}>{summary.aging}</Text>
          </View>
        )}
        {summary.stale > 0 && (
          <View style={[styles.healthSeg, { flex: summary.stale, backgroundColor: '#EF4444' }]}>
            <Text style={styles.healthSegText}>{summary.stale}</Text>
          </View>
        )}
      </View>

      {/* Source list */}
      {sortedSources.map((src) => {
        const freshness = getFreshnessStatus(src.vintage);
        return (
          <Pressable
            key={src.id}
            style={styles.sourceRow}
            onPress={() => onSourcePress?.(src.id)}
          >
            <View style={[styles.sourceDot, { backgroundColor: freshness.color }]} />
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>{src.abbreviation}</Text>
              <Text style={styles.sourceVintage}>{src.vintage}</Text>
            </View>
            <Text style={[styles.sourceStatus, { color: freshness.color }]}>
              {freshness.label}
            </Text>
            <Text style={styles.sourceFreq}>{src.updateFrequency}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Inline chip for single source freshness
interface FreshnessChipProps {
  vintage: string;
  label?: string;
}

export function FreshnessChip({ vintage, label }: FreshnessChipProps) {
  const freshness = getFreshnessStatus(vintage);
  return (
    <View style={[styles.chip, { borderColor: freshness.color + '40' }]}>
      <View style={[styles.chipDot, { backgroundColor: freshness.color }]} />
      <Text style={[styles.chipText, { color: freshness.color }]}>
        {label || freshness.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.heading3, color: Colors.textPrimary },
  legend: { flexDirection: 'row', gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, color: Colors.textMuted },

  // Health bar
  healthBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    gap: 2,
  },
  healthSeg: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
  },
  healthSegText: { ...Typography.caption, color: '#fff', fontWeight: '700', fontSize: 10 },

  // Source rows
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  sourceDot: { width: 8, height: 8, borderRadius: 4 },
  sourceInfo: { flex: 1 },
  sourceName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500', fontSize: 13 },
  sourceVintage: { ...Typography.caption, color: Colors.textMuted },
  sourceStatus: { ...Typography.bodySmall, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  sourceFreq: { ...Typography.caption, color: Colors.textMuted, minWidth: 50, textAlign: 'right' },

  // Compact
  compactContainer: { gap: 4 },
  compactBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 1,
  },
  compactSeg: { borderRadius: 3 },
  compactLabel: { ...Typography.caption, color: Colors.textMuted },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { ...Typography.caption, fontWeight: '500' },
});
