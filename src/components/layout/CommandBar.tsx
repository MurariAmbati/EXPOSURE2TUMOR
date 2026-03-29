// ============================================================
// Exposure2Tumor — Command Bar
// Top navigation: search, site selector, year, geography mode
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import { useAppStore } from '../../store';
import { CANCER_SITES, PRIMARY_SITES } from '../../config/cancerSites';
import type { CancerSite, GeographyLevel } from '../../types';

const GEO_MODES: { value: GeographyLevel; label: string }[] = [
  { value: 'county', label: 'County' },
  { value: 'tract', label: 'Tract' },
  { value: 'blockgroup', label: 'Block Group' },
  { value: 'state', label: 'State' },
];

export function CommandBar() {
  const { commandBar, setCommandBar, setActiveSite } = useAppStore();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={[styles.searchContainer, searchFocused && styles.searchFocused]}>
        <SvgIcon name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search county, ZIP, address..."
          placeholderTextColor={Colors.textMuted}
          value={commandBar.searchQuery}
          onChangeText={(text) => setCommandBar({ searchQuery: text })}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </View>

      {/* Site selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.siteSelectorScroll}
        contentContainerStyle={styles.siteSelector}
      >
        {PRIMARY_SITES.map((siteId) => {
          const site = CANCER_SITES[siteId];
          const isActive = commandBar.selectedSite === siteId;
          return (
            <Pressable
              key={siteId}
              style={[styles.siteChip, isActive && { backgroundColor: site.color + '30', borderColor: site.color }]}
              onPress={() => {
                setCommandBar({ selectedSite: siteId });
                setActiveSite(siteId);
              }}
            >
              <Text style={[styles.siteChipText, isActive && { color: site.color }]}>
                {site.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Metadata row */}
      <View style={styles.metaRow}>
        {/* Year range */}
        <Pressable style={styles.metaChip}>
          <Text style={styles.metaLabel}>YEARS</Text>
          <Text style={styles.metaValue}>
            {commandBar.yearRange[0]}–{commandBar.yearRange[1]}
          </Text>
        </Pressable>

        {/* Geography mode */}
        <Pressable style={styles.metaChip}>
          <Text style={styles.metaLabel}>GEO</Text>
          <Text style={styles.metaValue}>
            {GEO_MODES.find((g) => g.value === commandBar.geographyMode)?.label ?? 'County'}
          </Text>
        </Pressable>

        {/* Model version */}
        <View style={styles.metaChip}>
          <Text style={styles.metaLabel}>MODEL</Text>
          <Text style={styles.metaValue}>{commandBar.modelVersion}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchFocused: {
    borderColor: Colors.borderFocus,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
  },
  siteSelectorScroll: {
    marginTop: Spacing.sm,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  siteSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  siteChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
  },
  siteChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  metaLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: 9,
  },
  metaValue: {
    ...Typography.monoSmall,
    color: Colors.textSecondary,
  },
});
