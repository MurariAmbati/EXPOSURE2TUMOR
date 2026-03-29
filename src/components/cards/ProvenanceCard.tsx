// ============================================================
// Exposure2Tumor — Provenance Card
// Trace every metric back to source, year, geography, limitations
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import type { DataSource } from '../../types';

interface Props {
  source: DataSource;
  measureCount?: number;
  onPress?: () => void;
}

export function ProvenanceCard({ source, measureCount, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{source.abbreviation}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{source.name}</Text>
          <Text style={styles.publisher}>{source.publisher}</Text>
        </View>
        {measureCount !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{measureCount}</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {source.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Vintage</Text>
          <Text style={styles.metaValue}>{source.vintage}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Geography</Text>
          <Text style={styles.metaValue}>{source.geographyLevels.join(', ')}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Updates</Text>
          <Text style={styles.metaValue}>{source.updateFrequency}</Text>
        </View>
      </View>

      {source.limitations.length > 0 && (
        <View style={styles.limitations}>
          {source.limitations.map((lim, i) => (
            <Text key={i} style={styles.limitation}><SvgIcon name="warning" size={12} color={Colors.warning} /> {lim}</Text>
          ))}
        </View>
      )}

      <Pressable
        style={styles.linkRow}
        onPress={() => Linking.openURL(source.url)}
      >
        <Text style={styles.linkText}>View source documentation →</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.info + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  badgeText: {
    ...Typography.monoSmall,
    color: Colors.info,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  publisher: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  countBadge: {
    backgroundColor: Colors.surfaceHighlight,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    ...Typography.monoSmall,
    color: Colors.textSecondary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {},
  metaLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 8,
  },
  metaValue: {
    ...Typography.monoSmall,
    color: Colors.textSecondary,
  },
  limitations: {
    marginBottom: Spacing.sm,
  },
  limitation: {
    ...Typography.caption,
    color: Colors.warning,
    marginBottom: 2,
  },
  linkRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  linkText: {
    ...Typography.bodySmall,
    color: Colors.info,
  },
});
