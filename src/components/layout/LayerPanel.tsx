// ============================================================
// Exposure2Tumor — Layer Panel (Left Rail on tablet/drawer on mobile)
// Toggle map layers, filters, saved views, scenario toggles
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { useAppStore } from '../../store';
import { EXPOSURE_FAMILY_COLORS, EXPOSURE_FAMILY_LABELS } from '../../config/cancerSites';
import type { ExposureFamily } from '../../types';

const FAMILIES: ExposureFamily[] = [
  'environmental',
  'behavioral',
  'screening_access',
  'social_structural',
  'occupational',
  'climate_uv',
  'food_environment',
];

export function LayerPanel() {
  const {
    mapLayers,
    toggleMapLayer,
    activeExposureFamilies,
    toggleExposureFamily,
    investigations,
    setActiveInvestigation,
    savedScenarios,
    setActiveScenario,
  } = useAppStore();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Map Layers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MAP LAYERS</Text>
        {mapLayers.map((layer) => (
          <Pressable
            key={layer.id}
            style={styles.layerRow}
            onPress={() => toggleMapLayer(layer.id)}
          >
            <View
              style={[
                styles.layerDot,
                {
                  backgroundColor: layer.visible
                    ? EXPOSURE_FAMILY_COLORS[layer.family] ?? Colors.info
                    : Colors.textMuted,
                },
              ]}
            />
            <Text
              style={[
                styles.layerName,
                !layer.visible && styles.layerNameInactive,
              ]}
            >
              {layer.name}
            </Text>
            <Switch
              value={layer.visible}
              onValueChange={() => toggleMapLayer(layer.id)}
              trackColor={{ false: Colors.surfaceHighlight, true: Colors.info + '50' }}
              thumbColor={layer.visible ? Colors.info : Colors.textMuted}
              style={styles.switch}
            />
          </Pressable>
        ))}
      </View>

      {/* Exposure Families */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EXPOSURE FAMILIES</Text>
        {FAMILIES.map((family) => {
          const active = activeExposureFamilies.includes(family);
          const color = EXPOSURE_FAMILY_COLORS[family] ?? Colors.textMuted;
          return (
            <Pressable
              key={family}
              style={[styles.familyRow, active && { borderLeftColor: color, borderLeftWidth: 3 }]}
              onPress={() => toggleExposureFamily(family)}
            >
              <View style={[styles.familyDot, { backgroundColor: active ? color : Colors.textMuted }]} />
              <Text style={[styles.familyName, active && { color: Colors.textPrimary }]}>
                {EXPOSURE_FAMILY_LABELS[family] ?? family}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Saved Investigations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SAVED VIEWS</Text>
        {investigations.length === 0 ? (
          <Text style={styles.emptyText}>No saved investigations</Text>
        ) : (
          investigations.slice(0, 5).map((inv) => (
            <Pressable
              key={inv.id}
              style={styles.savedItem}
              onPress={() => setActiveInvestigation(inv)}
            >
              <Text style={styles.savedName}>{inv.name}</Text>
              <Text style={styles.savedMeta}>
                {inv.geoIds.length} location{inv.geoIds.length !== 1 ? 's' : ''} ·{' '}
                {inv.cancerSites.length} site{inv.cancerSites.length !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Scenario Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SCENARIOS</Text>
        {savedScenarios.length === 0 ? (
          <Text style={styles.emptyText}>No saved scenarios</Text>
        ) : (
          savedScenarios.slice(0, 5).map((scenario) => (
            <Pressable
              key={scenario.id}
              style={styles.savedItem}
              onPress={() => setActiveScenario(scenario)}
            >
              <Text style={styles.savedName}>{scenario.name}</Text>
              <Text style={styles.savedMeta}>
                {scenario.parameters.length} parameter{scenario.parameters.length !== 1 ? 's' : ''} adjusted
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  layerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  layerName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  layerNameInactive: {
    color: Colors.textMuted,
  },
  switch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xxs,
  },
  familyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  familyName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  savedItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceHighlight,
  },
  savedName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  savedMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
