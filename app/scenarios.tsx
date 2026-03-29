// ============================================================
// Exposure2Tumor — Scenarios Screen
// Slider-based what-if engine for exposure scenario modeling
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { applyScenario } from '../src/services/riskEngine';
import { useRiskStates, useExposureRibbon } from '../src/hooks';
import { ExposureRibbon, RiskStateCard } from '../src/components';
import type { ScenarioOutput, ExposureFamily } from '../src/types';

type SimpleParam = { measureId: string; direction: 'increase' | 'decrease'; magnitude: number };

const PRESET_SCENARIOS: { label: string; description: string; params: SimpleParam[] }[] = [
  {
    label: 'Smoking Cessation',
    description: 'Tobacco down 100%, radon awareness up 30%',
    params: [
      { measureId: 'current_smoking', direction: 'decrease', magnitude: 100 },
      { measureId: 'radon_zone', direction: 'decrease', magnitude: 30 },
    ],
  },
  {
    label: 'Screening Expansion',
    description: 'All screenings up 25-40%',
    params: [
      { measureId: 'mammography', direction: 'increase', magnitude: 40 },
      { measureId: 'colorectal_screening', direction: 'increase', magnitude: 25 },
      { measureId: 'cervical_screening', direction: 'increase', magnitude: 30 },
    ],
  },
  {
    label: 'Food Desert Intervention',
    description: 'Food access up 50%, physical activity up 20%',
    params: [
      { measureId: 'food_access', direction: 'increase', magnitude: 50 },
      { measureId: 'physical_inactivity', direction: 'decrease', magnitude: 20 },
    ],
  },
  {
    label: 'Environmental Cleanup',
    description: 'PM2.5 down 40%, UV awareness up 30%',
    params: [
      { measureId: 'pm25', direction: 'decrease', magnitude: 40 },
      { measureId: 'uv_index', direction: 'decrease', magnitude: 30 },
    ],
  },
  {
    label: 'Social Support Program',
    description: 'Poverty down 20%, uninsured down 30%',
    params: [
      { measureId: 'poverty_rate', direction: 'decrease', magnitude: 20 },
      { measureId: 'uninsured', direction: 'decrease', magnitude: 30 },
    ],
  },
];

type SliderValue = { measureId: string; magnitude: number; direction: 'increase' | 'decrease' };

export default function ScenariosScreen() {
  const { activeSite, currentGeo, scenarios, addScenario } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];

  const [scenarioName, setScenarioName] = useState('');
  const [activeSliders, setActiveSliders] = useState<SliderValue[]>([]);
  const [scenarioResult, setScenarioResult] = useState<ScenarioOutput | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const applyPreset = useCallback((idx: number) => {
    const preset = PRESET_SCENARIOS[idx];
    setActivePreset(idx);
    setScenarioName(preset.label);
    setActiveSliders(
      preset.params.map((p) => ({
        measureId: p.measureId,
        magnitude: p.magnitude,
        direction: p.direction,
      }))
    );
    // Compute scenario results
    const result = applyScenario(riskStates, preset.params);
    setScenarioResult(result);
  }, [riskStates]);

  const adjustSlider = useCallback(
    (idx: number, newMagnitude: number) => {
      const updated = [...activeSliders];
      updated[idx] = { ...updated[idx], magnitude: Math.max(0, Math.min(100, newMagnitude)) };
      setActiveSliders(updated);
      // Re-compute scenario
      const params: SimpleParam[] = updated.map((s) => ({
        measureId: s.measureId,
        direction: s.direction,
        magnitude: s.magnitude,
      }));
      const result = applyScenario(riskStates, params);
      setScenarioResult(result);
    },
    [activeSliders, riskStates]
  );

  const handleSave = useCallback(() => {
    if (!scenarioResult || !scenarioName.trim()) {
      Alert.alert('Missing Info', 'Please name the scenario and apply parameters.');
      return;
    }
    addScenario({
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      parameters: activeSliders.map((s) => ({
        measureId: s.measureId,
        direction: s.direction,
        magnitude: s.magnitude,
      })),
      baselineGeo: currentGeo ?? { level: 'county', fips: '00000', name: 'Unknown' },
      result: scenarioResult,
      createdAt: new Date().toISOString(),
    });
    Alert.alert('Saved', `Scenario "${scenarioName}" saved to investigations.`);
  }, [scenarioResult, scenarioName, activeSliders, currentGeo, addScenario]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Scenarios</Text>
        <Text style={styles.screenSubtitle}>
          What-if exposure modeling · {siteConfig.shortLabel}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRESET SCENARIOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {PRESET_SCENARIOS.map((preset, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.presetCard,
                  activePreset === idx && styles.presetCardActive,
                ]}
                onPress={() => applyPreset(idx)}
              >
                <Text style={[styles.presetLabel, activePreset === idx && styles.presetLabelActive]}>
                  {preset.label}
                </Text>
                <Text style={styles.presetDesc}>{preset.description}</Text>
                <View style={styles.presetParams}>
                  {preset.params.map((p, pi) => (
                    <View key={pi} style={styles.presetParamChip}>
                      <Text style={styles.presetParamText}>
                        {p.direction === 'decrease' ? '?' : '?'} {p.magnitude}%
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Scenario Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCENARIO NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={scenarioName}
            onChangeText={setScenarioName}
            placeholder="Name this scenario..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Active Sliders */}
        {activeSliders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARAMETERS</Text>
            {activeSliders.map((slider, idx) => (
              <View key={idx} style={styles.sliderRow}>
                <View style={styles.sliderInfo}>
                  <Text style={styles.sliderLabel}>
                    {slider.measureId.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.sliderDirection,
                    { color: slider.direction === 'decrease' ? Colors.success : Colors.warning },
                  ]}>
                    {slider.direction === 'decrease' ? '? Decrease' : '? Increase'}
                  </Text>
                </View>
                <View style={styles.sliderControls}>
                  <Pressable
                    style={styles.sliderButton}
                    onPress={() => adjustSlider(idx, slider.magnitude - 5)}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.magnitudeBox}>
                    <Text style={styles.magnitudeText}>{slider.magnitude}%</Text>
                  </View>
                  <Pressable
                    style={styles.sliderButton}
                    onPress={() => adjustSlider(idx, slider.magnitude + 5)}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </Pressable>
                </View>
                {/* Visual bar */}
                <View style={styles.sliderBarBg}>
                  <View
                    style={[
                      styles.sliderBarFill,
                      {
                        width: `${slider.magnitude}%`,
                        backgroundColor:
                          slider.direction === 'decrease' ? Colors.success : Colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Scenario result */}
        {scenarioResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTED IMPACT</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Overall Score Change</Text>
                <Text style={[
                  styles.resultValue,
                  { color: scenarioResult.overallScoreChange < 0 ? Colors.success : Colors.highAlert },
                ]}>
                  {scenarioResult.overallScoreChange > 0 ? '+' : ''}
                  {scenarioResult.overallScoreChange.toFixed(1)}
                </Text>
              </View>

              {/* Projected Risk States */}
              <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>PROJECTED RISK STATES</Text>
              {scenarioResult.projectedRiskStates.map((state) => (
                <RiskStateCard key={state.category} riskState={state} />
              ))}

              <View style={styles.resultMetaRow}>
                <View style={styles.resultMetaItem}>
                  <Text style={styles.resultMetaLabel}>Families Affected</Text>
                  <Text style={styles.resultMetaValue}>
                    {scenarioResult.affectedFamilies
                      .map((f) => (EXPOSURE_FAMILY_LABELS[f] ?? f).split(' ')[0])
                      .join(', ')}
                  </Text>
                </View>
                <View style={styles.resultMetaItem}>
                  <Text style={styles.resultMetaLabel}>Confidence</Text>
                  <Text style={styles.resultMetaValue}>
                    {(scenarioResult.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Save button */}
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Scenario</Text>
            </Pressable>
          </View>
        )}

        {/* Saved scenarios */}
        {scenarios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SAVED SCENARIOS ({scenarios.length})</Text>
            {scenarios.map((s) => (
              <View key={s.id} style={styles.savedCard}>
                <Text style={styles.savedName}>{s.name}</Text>
                <Text style={styles.savedMeta}>
                  {s.parameters.length} params · ?{s.result.overallScoreChange > 0 ? '+' : ''}
                  {s.result.overallScoreChange.toFixed(1)} ·{' '}
                  {new Date(s.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* No geo hint */}
        {!currentGeo && (
          <View style={styles.noGeoBox}>
            <Text style={styles.noGeoText}>
              ?? Select a location in the Command Map to compute scenario baselines
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// -- STYLES (Superset-faithful) --------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
  },
  screenTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  screenSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 64 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  presetsRow: { marginHorizontal: -16, paddingHorizontal: 16 },
  presetCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetCardActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: Colors.accentTealBg,
  },
  presetLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  presetLabelActive: { color: Colors.accentTeal },
  presetDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  presetParams: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  presetParamChip: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  presetParamText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textSecondary },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sliderRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  sliderDirection: { fontFamily: 'Roboto Mono, monospace', fontSize: 11 },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderButtonText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  magnitudeBox: {
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  magnitudeText: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18, color: Colors.accentTeal },
  sliderBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderBarFill: {
    height: 4,
    borderRadius: 2,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary },
  resultValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 28, color: Colors.textPrimary },
  resultMetaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  resultMetaItem: { flex: 1 },
  resultMetaLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },
  resultMetaValue: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary, marginTop: 2 },
  saveButton: {
    backgroundColor: Colors.accentTeal,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    height: 40,
    justifyContent: 'center',
  },
  saveButtonText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  savedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary },
  savedMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  noGeoBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: 16,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  noGeoText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
