// ============================================================
// Exposure2Tumor — Site Selector Bar (horizontal pills)
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { CANCER_SITES, ALL_SITES } from '../../config/cancerSites';
import { useAppStore } from '../../store';
import type { CancerSite } from '../../types';

interface Props {
  onSitePress?: (site: CancerSite) => void;
  compact?: boolean;
}

export function SiteSelectorBar({ onSitePress, compact }: Props) {
  const { activeSite, setActiveSite, siteFavorites } = useAppStore();

  const sortedSites = [
    ...siteFavorites,
    ...ALL_SITES.filter((s) => !siteFavorites.includes(s)),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {sortedSites.map((siteId) => {
        const site = CANCER_SITES[siteId];
        const isActive = activeSite === siteId;
        const isFavorite = siteFavorites.includes(siteId);

        return (
          <Pressable
            key={siteId}
            style={[
              styles.pill,
              isActive && { backgroundColor: site.color + '25', borderColor: site.color },
              !isActive && !isFavorite && styles.pillDimmed,
            ]}
            onPress={() => {
              setActiveSite(siteId);
              onSitePress?.(siteId);
            }}
          >
            <View style={[styles.dot, { backgroundColor: isActive ? site.color : Colors.textMuted }]} />
            <Text
              style={[
                compact ? styles.pillTextCompact : styles.pillText,
                isActive && { color: site.color },
              ]}
              numberOfLines={1}
            >
              {site.shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
  },
  pillDimmed: {
    opacity: 0.6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  pillText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pillTextCompact: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
