// ============================================================
// Exposure2Tumor — Environmental Event Card
// Environmental event alert with cancer relevance
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { SvgIcon, IconName } from '../SvgIcon';
import type { EnvironmentalEvent } from '../../types';
import { EXPOSURE_FAMILY_LABELS } from '../../config/cancerSites';

interface Props {
  event: EnvironmentalEvent;
  onPress?: () => void;
}

export function EnvironmentalEventCard({ event, onPress }: Props) {
  const severityColor = event.severity === 'critical' ? Colors.highAlert
    : event.severity === 'high' ? Colors.warning
    : event.severity === 'moderate' ? Colors.info
    : Colors.textMuted;

  const typeIcon = {
    industrial_release: 'factory',
    wildfire: 'fire',
    chemical_spill: 'flask',
    air_quality_alert: 'air',
    water_contamination: 'water',
    superfund_update: 'radiation',
  }[event.type] ?? 'warning';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <SvgIcon name={typeIcon as IconName} size={18} color={severityColor} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>{event.severity.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>{event.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}> {event.affectedRadius}km radius</Text>
        <Text style={styles.metaText}> {new Date(event.startDate).toLocaleDateString()}</Text>
        <Text style={styles.metaText}> {event.source}</Text>
      </View>

      {/* Exposure families affected */}
      <View style={styles.familiesRow}>
        {event.relatedExposures.map((family, i) => (
          <View key={i} style={styles.familyChip}>
            <Text style={styles.familyChipText}>{EXPOSURE_FAMILY_LABELS[family]}</Text>
          </View>
        ))}
      </View>

      {/* Cancer relevance */}
      {event.cancerRelevance.length > 0 && (
        <View style={styles.relevanceSection}>
          <Text style={styles.relevanceTitle}>Cancer Relevance</Text>
          {event.cancerRelevance.map((rel, i) => (
            <View key={i} style={styles.relevanceRow}>
              <Text style={styles.relevanceSite}>{rel.site}</Text>
              <Text style={styles.relevanceMech} numberOfLines={2}>{rel.mechanism}</Text>
              <Text style={styles.relevanceLatency}>{rel.latencyYears[0]}-{rel.latencyYears[1]}yr</Text>
            </View>
          ))}
        </View>
      )}

      {event.url && (
        <TouchableOpacity onPress={() => Linking.openURL(event.url!)} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>View Source →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  icon: { fontSize: 20, marginTop: 2 },
  headerText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  severityBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginLeft: Spacing.sm },
  severityText: { ...Typography.monoSmall, fontWeight: '700', letterSpacing: 0.5 },
  description: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.sm },
  metaText: { ...Typography.monoSmall, color: Colors.textMuted },
  familiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  familyChip: { backgroundColor: Colors.accentTeal + '15', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.round },
  familyChipText: { ...Typography.monoSmall, color: Colors.accentTeal },
  relevanceSection: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
  },
  relevanceTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  relevanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  relevanceSite: { ...Typography.monoSmall, color: Colors.accentTeal, fontWeight: '600', width: 60, textTransform: 'capitalize' },
  relevanceMech: { ...Typography.bodySmall, color: Colors.textMuted, flex: 1 },
  relevanceLatency: { ...Typography.monoSmall, color: Colors.textMuted, width: 50, textAlign: 'right' },
  linkBtn: { marginTop: Spacing.sm, alignSelf: 'flex-end' },
  linkBtnText: { ...Typography.bodySmall, color: Colors.accentTeal, fontWeight: '600' },
});
