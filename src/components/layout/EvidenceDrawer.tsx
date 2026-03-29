// ============================================================
// Exposure2Tumor — Evidence Drawer (Right Panel)
// Selected place risk-state summary, top drivers, provenance
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import { useAppStore } from '../../store';
import { useRiskStates, useExposureRibbon } from '../../hooks';
import { ExposureRibbon } from '../charts/ExposureRibbon';
import { RiskStateCard } from '../cards/RiskStateCard';
import { DATA_SOURCES } from '../../config/dataSources';

export function EvidenceDrawer() {
  const { currentGeo, activeSite, evidencePanelOpen, setEvidencePanelOpen } = useAppStore();
  const { riskStates, loading, exposureValues } = useRiskStates(currentGeo, activeSite);
  const { ribbon } = useExposureRibbon(currentGeo, activeSite);

  if (!evidencePanelOpen) return null;

  return (
    <View style={styles.container}>
      {/* Handle */}
      <Pressable style={styles.handle} onPress={() => setEvidencePanelOpen(false)}>
        <View style={styles.handleBar} />
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Place Header */}
        {currentGeo ? (
          <View style={styles.placeHeader}>
            <Text style={styles.placeName}>{currentGeo.name}</Text>
            <Text style={styles.placeDetail}>
              {currentGeo.county && `${currentGeo.county}, `}{currentGeo.state}
            </Text>
            <Text style={styles.placeDetail}>
              FIPS: {currentGeo.fips} · {currentGeo.level}
            </Text>
          </View>
        ) : (
          <View style={styles.placeHeader}>
            <Text style={styles.placeholderText}>Select a location on the map</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading exposure data...</Text>
          </View>
        )}

        {/* Exposure Ribbon */}
        {ribbon && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPOSURE RIBBON</Text>
            <ExposureRibbon data={ribbon} />
          </View>
        )}

        {/* Risk States */}
        {riskStates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RISK STATES</Text>
            {riskStates.map((state) => (
              <RiskStateCard key={state.category} riskState={state} />
            ))}
          </View>
        )}

        {/* Data Provenance */}
        {exposureValues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA PROVENANCE</Text>
            <Text style={styles.provenanceSubtitle}>
              {exposureValues.length} measures loaded from {new Set(exposureValues.map(v => v.measureId.split('_')[0])).size} data families
            </Text>

            {Object.values(DATA_SOURCES).slice(0, 5).map((source) => (
              <View key={source.id} style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <Text style={styles.sourceName}>{source.abbreviation}</Text>
                  <Text style={styles.sourceVintage}>{source.vintage}</Text>
                </View>
                <Text style={styles.sourceDesc} numberOfLines={2}>
                  {source.description}
                </Text>
                <Text style={styles.sourcePublisher}>{source.publisher}</Text>
                {source.limitations.length > 0 && (
                  <Text style={styles.sourceLimitation} numberOfLines={1}>
                    <View style={{ marginRight: 4 }}><SvgIcon name="warning" size={12} color={Colors.warning} /></View> {source.limitations[0]}
                  </Text>
                )}
                <Pressable
                  onPress={() => Linking.openURL(source.url)}
                  style={styles.sourceLink}
                >
                  <Text style={styles.sourceLinkText}>View source →</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  placeHeader: {
    marginBottom: Spacing.lg,
  },
  placeName: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  placeDetail: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  provenanceSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sourceCard: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sourceName: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  sourceVintage: {
    ...Typography.monoSmall,
    color: Colors.textMuted,
  },
  sourceDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sourcePublisher: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  sourceLimitation: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  sourceLink: {
    marginTop: Spacing.sm,
  },
  sourceLinkText: {
    ...Typography.bodySmall,
    color: Colors.info,
  },
});
