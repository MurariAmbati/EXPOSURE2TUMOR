// ============================================================
// Exposure2Tumor — Evidence Vault Screen
// Full provenance browser, data source explorer, citations
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { DATA_SOURCES } from '../src/config/dataSources';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { ProvenanceCard } from '../src/components';
import type { ExposureFamily } from '../src/types';

const ALL_SOURCE_IDS = Object.keys(DATA_SOURCES);

const FAMILY_FILTERS: { label: string; value: ExposureFamily | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Environmental', value: 'environmental' },
  { label: 'Behavioral', value: 'behavioral' },
  { label: 'Social', value: 'social_structural' },
  { label: 'Screening', value: 'screening_access' },
  { label: 'Occupational', value: 'occupational' },
  { label: 'Food', value: 'food_environment' },
  { label: 'Climate', value: 'climate_uv' },
];

export default function EvidenceScreen() {
  const { activeSite, currentGeo, investigations } = useAppStore();
  const [filter, setFilter] = useState<ExposureFamily | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const siteConfig = CANCER_SITES[activeSite];

  const filteredSources = ALL_SOURCE_IDS.filter((id) => {
    const source = DATA_SOURCES[id];
    const measures = source.measures ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        source.name.toLowerCase().includes(q) ||
        source.publisher.toLowerCase().includes(q) ||
        source.description.toLowerCase().includes(q) ||
        measures.some((m) => m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filter !== 'all') {
      const hasFamilyMeasure = measures.some((m) =>
        m.id.toLowerCase().includes(filter.split('_')[0])
      );
      // If no measures defined, include based on description match
      if (measures.length > 0 && !hasFamilyMeasure) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Evidence Vault</Text>
        <Text style={styles.screenSubtitle}>
          {ALL_SOURCE_IDS.length} data sources · Full provenance chain
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search sources, measures, publishers..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Family filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {FAMILY_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            style={[
              styles.filterChip,
              filter === f.value && styles.filterChipActive,
              filter === f.value && f.value !== 'all' && {
                borderColor: EXPOSURE_FAMILY_COLORS[f.value as ExposureFamily] ?? Colors.accentTeal,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            {f.value !== 'all' && (
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: EXPOSURE_FAMILY_COLORS[f.value as ExposureFamily] },
                ]}
              />
            )}
            <Text style={[
              styles.filterChipText,
              filter === f.value && styles.filterChipTextActive,
            ]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredSources.length}</Text>
            <Text style={styles.statLabel}>Sources</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredSources.reduce((sum, id) => sum + (DATA_SOURCES[id].measures?.length ?? 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Measures</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Set(filteredSources.flatMap((id) => DATA_SOURCES[id].geographyLevels)).size}
            </Text>
            <Text style={styles.statLabel}>Geo Levels</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{investigations.length}</Text>
            <Text style={styles.statLabel}>Investigations</Text>
          </View>
        </View>

        {/* Source Cards */}
        {filteredSources.map((sourceId) => {
          const source = DATA_SOURCES[sourceId];
          const isExpanded = expandedSource === sourceId;
          return (
            <View key={sourceId} style={styles.sourceCard}>
              <Pressable
                style={styles.sourceCardHeader}
                onPress={() => setExpandedSource(isExpanded ? null : sourceId)}
              >
                <View style={styles.sourceCardLeft}>
                  <Text style={styles.sourceName}>{source.name}</Text>
                  <Text style={styles.sourcePublisher}>{source.publisher}</Text>
                </View>
                <View style={styles.sourceCardRight}>
                  <Text style={styles.sourceVintage}>{source.vintage}</Text>
                  <Text style={styles.expandIcon}>{isExpanded ? '?' : '?'}</Text>
                </View>
              </Pressable>

              <Text style={styles.sourceDesc}>{source.description}</Text>

              {/* Geo level badges */}
              <View style={styles.geoRow}>
                {source.geographyLevels.map((level) => (
                  <View key={level} style={styles.geoBadge}>
                    <Text style={styles.geoBadgeText}>{level}</Text>
                  </View>
                ))}
              </View>

              {/* Expanded details */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  {/* Measures */}
                  {(source.measures?.length ?? 0) > 0 && (
                    <>
                      <Text style={styles.expandedTitle}>
                        MEASURES ({source.measures!.length})
                      </Text>
                      {source.measures!.map((measure) => (
                        <View key={measure.id} style={styles.measureRow}>
                          <View style={styles.measureDot} />
                          <View style={styles.measureInfo}>
                            <Text style={styles.measureLabel}>{measure.label}</Text>
                            <Text style={styles.measureId}>{measure.id}</Text>
                          </View>
                          <Text style={styles.measureUnit}>{measure.unit}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Limitations */}
                  <Text style={[styles.expandedTitle, { marginTop: Spacing.md }]}>
                    LIMITATIONS
                  </Text>
                  {source.limitations.map((lim, i) => (
                    <View key={i} style={styles.limitationRow}>
                      <Text style={styles.limitationBullet}>?</Text>
                      <Text style={styles.limitationText}>{lim}</Text>
                    </View>
                  ))}

                  {/* Citation */}
                  <Text style={[styles.expandedTitle, { marginTop: Spacing.md }]}>
                    CITATION
                  </Text>
                  <Text style={styles.citationText}>{source.citation}</Text>

                  {/* Link */}
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => {
                      if (source.url) {
                        Linking.openURL(source.url);
                      }
                    }}
                  >
                    <Text style={styles.linkButtonText}>Open Data Source ?</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {filteredSources.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No data sources match your filters
            </Text>
          </View>
        )}

        {/* Site-specific evidence model */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            EVIDENCE MODEL — {siteConfig.shortLabel.toUpperCase()}
          </Text>
          <View style={styles.modelCard}>
            <Text style={styles.modelType}>{siteConfig.evidenceModel}</Text>
            <Text style={styles.modelDesc}>
              This cancer site uses exposure families:{' '}
              {siteConfig.exposureFamilies
                .map((f) => EXPOSURE_FAMILY_LABELS[f] ?? f)
                .join(', ')}
            </Text>
            <View style={styles.modelFamilies}>
              {siteConfig.exposureFamilies.map((family) => (
                <View
                  key={family}
                  style={[styles.modelFamilyChip, { borderColor: EXPOSURE_FAMILY_COLORS[family] }]}
                >
                  <View style={[styles.modelFamilyDot, { backgroundColor: EXPOSURE_FAMILY_COLORS[family] }]} />
                  <Text style={styles.modelFamilyText}>
                    {EXPOSURE_FAMILY_LABELS[family] ?? family}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -- STYLES (Superset-faithful) --------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header — Superset StyledHeader
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  screenTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  screenSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Search — Superset Ant Design Input
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: 8,
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Filter chips — Superset SubMenu pills
  filterRow: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 4,
    gap: 4,
  },
  filterChipActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: Colors.accentTealBg,
  },
  filterDot: { width: 5, height: 5, borderRadius: 3 },
  filterChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  filterChipTextActive: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, color: Colors.accentTeal },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 64, gap: 12 },

  // Stats row — Superset metric strip
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.borderSubtle },
  statValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary },
  statLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Source cards — Superset ListViewCard
  sourceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sourceCardLeft: { flex: 1 },
  sourceName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  sourcePublisher: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sourceCardRight: { alignItems: 'flex-end', gap: 4 },
  sourceVintage: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textSecondary },
  expandIcon: { fontFamily: 'Roboto, sans-serif', fontSize: 9, color: Colors.textMuted },
  sourceDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },

  // Geo badges
  geoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  geoBadge: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  geoBadgeText: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },

  // Expanded section
  expandedSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 12,
  },
  expandedTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  measureDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.accentTeal + '60' },
  measureInfo: { flex: 1 },
  measureLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary },
  measureId: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  measureUnit: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  limitationRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  limitationBullet: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.warning },
  limitationText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  citationText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  // Link button — Superset Button secondary
  linkButton: {
    marginTop: 12,
    backgroundColor: Colors.accentTealBg,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  linkButtonText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.accentTeal },

  emptyBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  emptyText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },

  section: { marginTop: 16 },
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },

  // Model card — Superset Card
  modelCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelType: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 8 },
  modelDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  modelFamilies: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  modelFamilyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  modelFamilyDot: { width: 5, height: 5, borderRadius: 3 },
  modelFamilyText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },
});
