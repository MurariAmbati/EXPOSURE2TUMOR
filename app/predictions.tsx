// ============================================================
// Exposure2Tumor � Predictions & Risk Intelligence
// Apache Superset-style risk classification with dense data
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { useRiskStates, useExposureRibbon } from '../src/hooks';
import { Sparkline, RiskStateCard, MetricTile } from '../src/components';
import type { CancerSite, RiskStateCategory } from '../src/types';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

interface LocalPrediction {
  id: string;
  siteId: CancerSite;
  riskClassification: 'high' | 'moderate' | 'low';
  confidenceScore: number;
  topFactors: { measureId: string; name: string; contribution: number; direction: 'risk_increasing' | 'protective' }[];
  projectedTrend: 'improving' | 'stable' | 'worsening';
  timeHorizon: string;
  modelVersion: string;
  generatedAt: string;
}

const SCREENING_RECOMMENDATIONS: Record<string, { test: string; frequency: string; ages: string }[]> = {
  lung: [{ test: 'Low-dose CT', frequency: 'Annual', ages: '50�80 (20+ pack-year history)' }],
  breast: [
    { test: 'Mammogram', frequency: 'Every 1�2 years', ages: '40�74' },
    { test: 'Clinical breast exam', frequency: 'Every 1�3 years', ages: '25�39' },
  ],
  colorectal: [
    { test: 'Colonoscopy', frequency: 'Every 10 years', ages: '45�75' },
    { test: 'FIT/gFOBT', frequency: 'Annual', ages: '45�75' },
    { test: 'Cologuard', frequency: 'Every 3 years', ages: '45�75' },
  ],
  cervical: [
    { test: 'Pap smear', frequency: 'Every 3 years', ages: '21�65' },
    { test: 'HPV co-test', frequency: 'Every 5 years', ages: '30�65' },
  ],
  prostate: [{ test: 'PSA + DRE', frequency: 'Shared decision', ages: '50�70 (45 if high risk)' }],
  melanoma: [{ test: 'Full-body skin exam', frequency: 'Annual', ages: 'All adults (high risk)' }],
  liver: [{ test: 'Ultrasound + AFP', frequency: 'Every 6 months', ages: 'High-risk adults' }],
  oral: [{ test: 'Oral cavity exam', frequency: 'Opportunistic', ages: 'Adults using tobacco/alcohol' }],
  bladder: [{ test: 'Urine cytology', frequency: 'As indicated', ages: 'High-risk occupational exposure' }],
  kidney: [{ test: 'Imaging (CT/US)', frequency: 'As indicated', ages: 'High-risk groups' }],
  pancreatic: [{ test: 'EUS / MRI', frequency: 'Annual', ages: 'High-risk genetic predisposition' }],
};

const MODEL_OUTPUTS: { label: string; category: RiskStateCategory; description: string }[] = [
  { label: 'Environmental Burden Score', category: 'environmental_burden', description: 'Weighted composite of PM2.5, radon, air toxics, water contaminants' },
  { label: 'Behavioral Risk Index', category: 'behavioral_burden', description: 'Smoking prevalence, physical inactivity, obesity, binge drinking' },
  { label: 'Social Vulnerability Score', category: 'structural_vulnerability', description: 'Poverty rate, uninsured %, limited English, crowded housing' },
  { label: 'Screening Gap Index', category: 'preventive_access', description: 'Below recommended screening rates vs. national targets' },
  { label: 'Cumulative Cancer Pressure', category: 'cumulative_cancer_pressure', description: 'Combined cancer incidence and mortality burden' },
  { label: 'Prevention Opportunity', category: 'prevention_opportunity', description: 'Final weighted prevention opportunity score' },
];

export default function PredictionsScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const { riskStates } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<LocalPrediction | null>(null);
  const [predictions, setPredictions] = useState<LocalPrediction[]>([]);

  const screeningRecs = SCREENING_RECOMMENDATIONS[activeSite] ?? [];

  const generatePrediction = useCallback(() => {
    if (!currentGeo) return;
    setIsGenerating(true);

    // Simulate model inference
    setTimeout(() => {
      const compositeScore = riskStates.length > 0
        ? riskStates.reduce((sum, s) => sum + s.score, 0) / riskStates.length
        : 50;

      const prediction: LocalPrediction = {
        id: `pred-${Date.now()}`,
        siteId: activeSite,
        riskClassification: compositeScore >= 75 ? 'high' : compositeScore >= 50 ? 'moderate' : 'low',
        confidenceScore: 0.72 + Math.random() * 0.15,
        topFactors: riskStates
          .flatMap((s) => s.topDrivers)
          .sort((a, b) => b.contribution - a.contribution)
          .slice(0, 5)
          .map((d) => ({
            measureId: d.measureId,
            name: d.name,
            contribution: d.contribution,
            direction: d.percentile > 60 ? 'risk_increasing' as const : 'protective' as const,
          })),
        projectedTrend: compositeScore >= 60 ? 'worsening' : compositeScore >= 40 ? 'stable' : 'improving',
        timeHorizon: '5-year',
        modelVersion: 'exposure2tumor-v1.3',
        generatedAt: new Date().toISOString(),
      };

      setCurrentPrediction(prediction);
      setPredictions((prev) => [prediction, ...prev]);
      setIsGenerating(false);
    }, 1500);
  }, [currentGeo, riskStates, activeSite]);

  const compositeScore = useMemo(() => {
    if (!riskStates.length) return 0;
    return Math.round(riskStates.reduce((a, r) => a + r.score, 0) / riskStates.length);
  }, [riskStates]);

  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'high': return Colors.highAlert;
      case 'moderate': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* -- Header -------------------------------------- */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Predictions</Text>
          <Text style={s.headerSub}>Risk classification & screening � {siteConfig.shortLabel}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.modelPill}>
            <Text style={s.modelPillText}>MODEL v2.0</Text>
          </View>
        </View>
      </View>

      {/* -- KPI Strip ------------------------------------ */}
      <View style={s.kpiStrip}>
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>COMPOSITE</Text>
          <Text style={s.kpiVal}>{compositeScore}</Text>
        </View>
        <View style={s.kpiDiv} />
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>FACTORS</Text>
          <Text style={s.kpiVal}>{riskStates.length}</Text>
        </View>
        <View style={s.kpiDiv} />
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>SCREENINGS</Text>
          <Text style={s.kpiVal}>{screeningRecs.length}</Text>
        </View>
        <View style={s.kpiDiv} />
        <View style={s.kpiItem}>
          <Text style={s.kpiLabel}>HISTORY</Text>
          <Text style={s.kpiVal}>{predictions.length}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {/* Generate button */}
        <Pressable
          style={[s.genBtn, isGenerating && { opacity: 0.5 }]}
          onPress={generatePrediction}
          disabled={isGenerating || !currentGeo}
        >
          {isGenerating ? (
            <ActivityIndicator color={Colors.background} size="small" />
          ) : (
            <Text style={s.genBtnText}>
              {currentGeo ? '?  Generate Risk Prediction' : '?  Select Location First'}
            </Text>
          )}
        </Pressable>

        {/* Current prediction */}
        {currentPrediction && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Current Prediction</Text>
              <View style={[s.riskBadge, { borderColor: getRiskColor(currentPrediction.riskClassification) + '55', backgroundColor: getRiskColor(currentPrediction.riskClassification) + '12' }]}>
                <View style={[s.riskDot, { backgroundColor: getRiskColor(currentPrediction.riskClassification) }]} />
                <Text style={[s.riskBadgeText, { color: getRiskColor(currentPrediction.riskClassification) }]}>
                  {currentPrediction.riskClassification.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Confidence + Trend row */}
            <View style={s.predMetrics}>
              <View style={s.predMetric}>
                <Text style={s.predMetricLabel}>CONFIDENCE</Text>
                <Text style={s.predMetricVal}>{(currentPrediction.confidenceScore * 100).toFixed(0)}%</Text>
                <View style={s.predBar}>
                  <View style={[s.predBarFill, { width: `${currentPrediction.confidenceScore * 100}%` }]} />
                </View>
              </View>
              <View style={s.predMetricDiv} />
              <View style={s.predMetric}>
                <Text style={s.predMetricLabel}>{currentPrediction.timeHorizon.toUpperCase()} TREND</Text>
                <Text style={[s.predMetricVal, {
                  color: currentPrediction.projectedTrend === 'improving' ? Colors.success :
                    currentPrediction.projectedTrend === 'worsening' ? Colors.highAlert : Colors.warning,
                }]}>
                  {currentPrediction.projectedTrend === 'improving' ? '? Improving' :
                    currentPrediction.projectedTrend === 'worsening' ? '? Worsening' : '? Stable'}
                </Text>
              </View>
            </View>

            {/* Top factors */}
            <Text style={s.subLabel}>TOP CONTRIBUTING FACTORS</Text>
            {currentPrediction.topFactors.map((f, i) => (
              <View key={i} style={s.factorRow}>
                <View style={s.factorRank}>
                  <Text style={s.factorRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.factorName}>{f.name.replace(/_/g, ' ')}</Text>
                  <Text style={[s.factorDir, { color: f.direction === 'risk_increasing' ? Colors.highAlert : Colors.success }]}>
                    {f.direction === 'risk_increasing' ? '? Risk increasing' : '? Protective'}
                  </Text>
                </View>
                <View style={s.factorContribWrap}>
                  <Text style={s.factorContrib}>{(f.contribution * 100).toFixed(0)}%</Text>
                  <View style={s.factorContribBar}>
                    <View style={[s.factorContribFill, { width: `${Math.min(f.contribution * 100, 100)}%` }]} />
                  </View>
                </View>
              </View>
            ))}

            <View style={s.modelRow}>
              <Text style={s.modelText}>
                {currentPrediction.modelVersion} � {new Date(currentPrediction.generatedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Model Outputs */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Model Outputs</Text>
            <Text style={s.cardCount}>{MODEL_OUTPUTS.length} dimensions</Text>
          </View>
          {MODEL_OUTPUTS.map((output, i) => {
            const match = riskStates.find((r) => r.category === output.category);
            return (
              <View key={output.category} style={[s.outputRow, i === MODEL_OUTPUTS.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.outputLeft}>
                  <Text style={s.outputLabel}>{output.label}</Text>
                  <Text style={s.outputDesc}>{output.description}</Text>
                </View>
                <View style={s.outputRight}>
                  <Text style={[s.outputScore, match && {
                    color: match.score >= 75 ? Colors.highAlert : match.score >= 50 ? Colors.warning : Colors.success,
                  }]}>
                    {match ? match.score.toFixed(0) : '�'}
                  </Text>
                  {match && (
                    <View style={s.outputBar}>
                      <View style={[s.outputBarFill, {
                        width: `${match.score}%`,
                        backgroundColor: match.score >= 75 ? Colors.highAlert : match.score >= 50 ? Colors.warning : Colors.success,
                      }]} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Screening Recommendations */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Screening Recommendations</Text>
            <Text style={s.cardCount}>{siteConfig.shortLabel}</Text>
          </View>
          {screeningRecs.map((rec, i) => (
            <View key={i} style={s.screenCard}>
              <Text style={s.screenTest}>{rec.test}</Text>
              <View style={s.screenMeta}>
                <View style={s.screenMetaItem}>
                  <Text style={s.screenMetaLabel}>FREQUENCY</Text>
                  <Text style={s.screenMetaVal}>{rec.frequency}</Text>
                </View>
                <View style={s.screenMetaItem}>
                  <Text style={s.screenMetaLabel}>AGES</Text>
                  <Text style={s.screenMetaVal}>{rec.ages}</Text>
                </View>
              </View>
            </View>
          ))}
          {screeningRecs.length === 0 && (
            <Text style={s.emptyText}>No screening guidelines available for this site.</Text>
          )}
        </View>

        {/* Prediction History */}
        {predictions.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Prediction History</Text>
              <Text style={s.cardCount}>{predictions.length}</Text>
            </View>
            {predictions.slice(-10).reverse().map((pred) => (
              <View key={pred.id} style={s.histRow}>
                <View style={[s.histDot, { backgroundColor: getRiskColor(pred.riskClassification) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.histName}>
                    {CANCER_SITES[pred.siteId]?.shortLabel ?? pred.siteId} � {pred.riskClassification.toUpperCase()}
                  </Text>
                  <Text style={s.histMeta}>
                    {(pred.confidenceScore * 100).toFixed(0)}% conf � {pred.projectedTrend} � {new Date(pred.generatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!currentGeo && (
          <View style={s.emptyBox}>
            <Text style={s.emptyBoxText}>Select a location to generate risk predictions</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// -- STYLES (Superset-faithful) --------------------------
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header � Superset StyledHeader
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerRight: {},
  modelPill: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  modelPillText: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },

  // KPI strip � Superset metric row
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },
  kpiVal: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
  kpiDiv: { width: 1, height: 32, backgroundColor: Colors.borderSubtle, alignSelf: 'center' },

  scroll: { flex: 1 },
  pad: { padding: 16, paddingBottom: 64, gap: 12 },

  // Primary button � Superset Button primary (solid, colorPrimary bg)
  genBtn: {
    backgroundColor: Colors.accentTeal,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  genBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },

  // Cards � Superset Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  cardCount: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textMuted },

  // Risk badge � Superset Badge component
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskBadgeText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11 },

  // Prediction metrics � Superset stat card split
  predMetrics: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 12,
  },
  predMetric: { flex: 1, alignItems: 'center' },
  predMetricLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },
  predMetricVal: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginTop: 4 },
  predMetricDiv: { width: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 8 },
  predBar: { width: 60, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 4 },
  predBarFill: { height: 3, backgroundColor: Colors.accentTeal, borderRadius: 2 },

  subLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, marginBottom: 8, marginTop: 8 },

  // Factor rows � Superset data table pattern
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  factorRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorRankText: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  factorName: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary, textTransform: 'capitalize' },
  factorDir: { fontFamily: 'Roboto, sans-serif', fontSize: 11, marginTop: 2 },
  factorContribWrap: { alignItems: 'flex-end', width: 44 },
  factorContrib: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textPrimary },
  factorContribBar: { width: 36, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 3 },
  factorContribFill: { height: 3, backgroundColor: Colors.accentTeal + '50', borderRadius: 2 },
  modelRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  modelText: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },

  // Model outputs � Superset table
  outputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  outputLeft: { flex: 1 },
  outputLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary },
  outputDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  outputRight: { alignItems: 'flex-end', width: 50 },
  outputScore: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  outputBar: { width: 40, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 3, overflow: 'hidden' },
  outputBarFill: { height: 3, borderRadius: 2 },

  // Screening cards � Superset Card with left accent like FilterBar
  screenCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentTeal,
  },
  screenTest: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  screenMeta: { flexDirection: 'row', gap: 24, marginTop: 8 },
  screenMetaItem: {},
  screenMetaLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },
  screenMetaVal: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // History � Superset list items
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  histDot: { width: 8, height: 8, borderRadius: 4 },
  histName: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary },
  histMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Empty states
  emptyText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  emptyBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  emptyBoxText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
