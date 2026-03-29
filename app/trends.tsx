// ============================================================
// Exposure2Tumor — Trends & Analytics Screen
// Time-series analysis, anomaly detection, forecasting, correlations
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { useRiskStates } from '../src/hooks';
import { analyzeTrend, computeCorrelationMatrix, assessDataQuality } from '../src/services/analyticsEngine';
import { TrendChart, CorrelationHeatmap, RadarChart, DataQualityBadge } from '../src/components';
import type { TrendAnalysis, CorrelationMatrix, ExposureFamily, TrendDataPoint, DataQualityReport } from '../src/types';

const ANALYSIS_MEASURES = [
  { id: 'current_smoking', name: 'Current Smoking', family: 'behavioral' as ExposureFamily },
  { id: 'obesity', name: 'Adult Obesity', family: 'behavioral' as ExposureFamily },
  { id: 'physical_inactivity', name: 'Physical Inactivity', family: 'behavioral' as ExposureFamily },
  { id: 'pm25', name: 'PM2.5 Air Quality', family: 'environmental' as ExposureFamily },
  { id: 'mammography', name: 'Mammography Screening', family: 'screening_access' as ExposureFamily },
  { id: 'colorectal_screening', name: 'Colorectal Screening', family: 'screening_access' as ExposureFamily },
  { id: 'poverty_rate', name: 'Poverty Rate', family: 'social_structural' as ExposureFamily },
  { id: 'uninsured', name: 'Uninsured Rate', family: 'social_structural' as ExposureFamily },
  { id: 'food_access', name: 'Food Access', family: 'food_environment' as ExposureFamily },
  { id: 'uv_index', name: 'UV Index', family: 'climate_uv' as ExposureFamily },
];

type AnalysisTab = 'trends' | 'correlations' | 'quality' | 'radar';

export default function TrendsScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];

  const [activeTab, setActiveTab] = useState<AnalysisTab>('trends');
  const [selectedMeasure, setSelectedMeasure] = useState(ANALYSIS_MEASURES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendResult, setTrendResult] = useState<TrendAnalysis | null>(null);
  const [correlationResult, setCorrelationResult] = useState<CorrelationMatrix | null>(null);
  const [dqReport, setDqReport] = useState<DataQualityReport | null>(null);

  // Generate simulated historical data for trend analysis
  const generateHistoricalData = useCallback((measureId: string): TrendDataPoint[] => {
    const baseValue = exposureValues.find(v => v.measureId === measureId)?.value ?? 50;
    const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
    const trend = measureId.includes('screening') ? 0.3 : -0.5; // screening improving, risk increasing
    return years.map((year, i) => ({
      year,
      value: Math.max(0, baseValue + trend * (i - 5) + (Math.random() - 0.5) * 8),
      percentile: Math.max(0, Math.min(100, 50 + trend * (i - 5) * 2 + (Math.random() - 0.5) * 15)),
    }));
  }, [exposureValues]);

  const runTrendAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const dataPoints = generateHistoricalData(selectedMeasure.id);
      const result = analyzeTrend(
        dataPoints,
        currentGeo?.fips ?? '00000',
        currentGeo?.name ?? 'Unknown',
        activeSite,
        selectedMeasure.id,
        selectedMeasure.name,
        selectedMeasure.family,
      );
      setTrendResult(result);
      setIsAnalyzing(false);
    }, 800);
  }, [selectedMeasure, currentGeo, activeSite, generateHistoricalData]);

  const runCorrelationAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const measureIds = ANALYSIS_MEASURES.map(m => m.id);
      const data: Record<string, number[]> = {};
      for (const m of ANALYSIS_MEASURES) {
        // Simulated cross-geo values
        data[m.id] = Array.from({ length: 50 }, () =>
          (exposureValues.find(v => v.measureId === m.id)?.value ?? 50) + (Math.random() - 0.5) * 30
        );
      }
      const result = computeCorrelationMatrix(measureIds, data, 'pearson');
      setCorrelationResult(result);
      setIsAnalyzing(false);
    }, 1200);
  }, [exposureValues]);

  const runQualityAssessment = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const report = assessDataQuality(currentGeo?.fips ?? '00000', exposureValues);
      setDqReport(report);
      setIsAnalyzing(false);
    }, 600);
  }, [currentGeo, exposureValues]);

  // Radar chart data from risk states
  const radarAxes = useMemo(() => {
    const families: ExposureFamily[] = ['environmental', 'behavioral', 'screening_access', 'social_structural', 'food_environment', 'climate_uv'];
    return families.map(f => {
      const relevantDrivers = riskStates.flatMap(rs => rs.topDrivers.filter(d => d.family === f));
      const avgPercentile = relevantDrivers.length > 0
        ? relevantDrivers.reduce((s, d) => s + d.percentile, 0) / relevantDrivers.length
        : 30;
      return {
        label: EXPOSURE_FAMILY_LABELS[f],
        value: Math.round(avgPercentile),
        color: EXPOSURE_FAMILY_COLORS[f],
      };
    });
  }, [riskStates]);

  const tabs: { key: AnalysisTab; label: string }[] = [
    { key: 'trends', label: 'Trends' },
    { key: 'correlations', label: 'Correlations' },
    { key: 'radar', label: 'Risk Radar' },
    { key: 'quality', label: 'Data Quality' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Analytics</Text>
        <Text style={styles.screenSubtitle}>
          Advanced trend analysis · {siteConfig.shortLabel} · {currentGeo?.name ?? 'No location'}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* ---- TRENDS TAB ---- */}
        {activeTab === 'trends' && (
          <>
            {/* Measure selector */}
            <Text style={styles.sectionTitle}>Select Measure</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.measureScroll}>
              {ANALYSIS_MEASURES.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.measureChip,
                    selectedMeasure.id === m.id && styles.measureChipActive,
                  ]}
                  onPress={() => setSelectedMeasure(m)}
                >
                  <View style={[styles.measureDot, { backgroundColor: EXPOSURE_FAMILY_COLORS[m.family] }]} />
                  <Text style={[styles.measureChipText, selectedMeasure.id === m.id && styles.measureChipTextActive]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.analyzeBtn} onPress={runTrendAnalysis}>
              <Text style={styles.analyzeBtnText}>
                {isAnalyzing ? 'Analyzing…' : 'Run Trend Analysis'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}

            {trendResult && !isAnalyzing && (
              <View style={styles.resultSection}>
                <TrendChart
                  dataPoints={trendResult.dataPoints}
                  regression={trendResult.regression}
                  anomalies={trendResult.anomalies}
                  forecast={trendResult.forecast}
                  title={`${trendResult.measureName} — ${trendResult.geoName}`}
                  width={340}
                  height={220}
                />

                {/* Regression stats card */}
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardTitle}>Regression Summary</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>{trendResult.regression.annualChangePercent.toFixed(1)}%</Text>
                      <Text style={styles.statsLabel}>Annual Change</Text>
                    </View>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>{trendResult.regression.rSquared.toFixed(3)}</Text>
                      <Text style={styles.statsLabel}>R-squared</Text>
                    </View>
                    <View style={styles.statsItem}>
                      <Text style={[styles.statsValue, {
                        color: trendResult.regression.direction === 'worsening' ? Colors.highAlert
                          : trendResult.regression.direction === 'improving' ? Colors.success
                          : Colors.textMuted,
                      }]}>{trendResult.regression.direction}</Text>
                      <Text style={styles.statsLabel}>Direction</Text>
                    </View>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>
                        {trendResult.regression.significanceLevel === 'not_significant' ? 'NS' : trendResult.regression.significanceLevel}
                      </Text>
                      <Text style={styles.statsLabel}>Significance</Text>
                    </View>
                  </View>
                </View>

                {/* Anomalies */}
                {trendResult.anomalies.length > 0 && (
                  <View style={styles.anomaliesCard}>
                    <Text style={styles.anomaliesTitle}>
                      ? {trendResult.anomalies.length} Anomal{trendResult.anomalies.length === 1 ? 'y' : 'ies'} Detected
                    </Text>
                    {trendResult.anomalies.map((a, i) => (
                      <View key={i} style={styles.anomalyRow}>
                        <Text style={styles.anomalyYear}>{a.year}</Text>
                        <View style={[styles.anomalyBadge, {
                          backgroundColor: a.type === 'structural_break' ? Colors.highAlert + '20' : Colors.warning + '20',
                        }]}>
                          <Text style={[styles.anomalyType, {
                            color: a.type === 'structural_break' ? Colors.highAlert : Colors.warning,
                          }]}>{a.type.replace(/_/g, ' ')}</Text>
                        </View>
                        <Text style={styles.anomalyZ}>z={a.zScore.toFixed(1)}</Text>
                      </View>
                    ))}
                    {trendResult.anomalies[0]?.possibleCauses.length > 0 && (
                      <View style={styles.causesList}>
                        <Text style={styles.causesTitle}>Possible Causes:</Text>
                        {trendResult.anomalies[0].possibleCauses.map((c, i) => (
                          <Text key={i} style={styles.causeText}>• {c}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Forecast */}
                {trendResult.forecast.length > 0 && (
                  <View style={styles.forecastCard}>
                    <Text style={styles.forecastTitle}>Forecast (Linear Projection)</Text>
                    {trendResult.forecast.map((f, i) => (
                      <View key={i} style={styles.forecastRow}>
                        <Text style={styles.forecastYear}>{f.year}</Text>
                        <Text style={styles.forecastValue}>{f.predicted.toFixed(1)}</Text>
                        <Text style={styles.forecastCI}>
                          [{f.ci_lower.toFixed(1)}, {f.ci_upper.toFixed(1)}]
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ---- CORRELATIONS TAB ---- */}
        {activeTab === 'correlations' && (
          <>
            <Text style={styles.sectionTitle}>Exposure Measure Correlations</Text>
            <Text style={styles.sectionDesc}>
              Discover how exposure measures relate to each other across geographies. Pearson correlation coefficients with significance testing.
            </Text>

            <TouchableOpacity style={styles.analyzeBtn} onPress={runCorrelationAnalysis}>
              <Text style={styles.analyzeBtnText}>
                {isAnalyzing ? 'Computing…' : 'Compute Correlation Matrix'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}

            {correlationResult && !isAnalyzing && (
              <CorrelationHeatmap
                matrix={correlationResult}
                labels={ANALYSIS_MEASURES.map(m => m.name)}
                cellSize={32}
              />
            )}
          </>
        )}

        {/* ---- RADAR TAB ---- */}
        {activeTab === 'radar' && (
          <>
            <Text style={styles.sectionTitle}>Exposure Risk Radar</Text>
            <Text style={styles.sectionDesc}>
              Multi-axis view of exposure family burden percentiles. Higher values indicate greater exposure concern.
            </Text>

            <RadarChart
              axes={radarAxes}
              size={280}
              title={`${siteConfig.label} — ${currentGeo?.name ?? 'No location'}`}
            />

            {/* Family breakdown */}
            <View style={styles.familyBreakdown}>
              {radarAxes.map((axis, i) => (
                <View key={i} style={styles.familyRow}>
                  <View style={[styles.familyDot, { backgroundColor: axis.color }]} />
                  <Text style={styles.familyLabel}>{axis.label}</Text>
                  <View style={styles.familyBarTrack}>
                    <View
                      style={[
                        styles.familyBarFill,
                        {
                          width: `${axis.value}%`,
                          backgroundColor: axis.value >= 75 ? Colors.highAlert
                            : axis.value >= 50 ? Colors.warning
                            : axis.color ?? Colors.accentTeal,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.familyValue}>{axis.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ---- DATA QUALITY TAB ---- */}
        {activeTab === 'quality' && (
          <>
            <Text style={styles.sectionTitle}>Data Quality Assessment</Text>
            <Text style={styles.sectionDesc}>
              Evaluate completeness, recency, and reliability of exposure data for this geography.
            </Text>

            <TouchableOpacity style={styles.analyzeBtn} onPress={runQualityAssessment}>
              <Text style={styles.analyzeBtnText}>
                {isAnalyzing ? 'Assessing…' : 'Run Quality Assessment'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}

            {dqReport && !isAnalyzing && (
              <>
                <DataQualityBadge report={dqReport} />

                {/* Per-measure breakdown */}
                <View style={styles.dqBreakdown}>
                  <Text style={styles.dqBreakdownTitle}>Per-Measure Quality</Text>
                  {dqReport.measures.map((m, i) => {
                    const confColor = m.confidence === 'high' ? Colors.success
                      : m.confidence === 'moderate' ? Colors.warning
                      : Colors.highAlert;
                    return (
                      <View key={i} style={styles.dqRow}>
                        <View style={[styles.dqConfDot, { backgroundColor: confColor }]} />
                        <Text style={styles.dqMeasureName}>
                          {m.measureName.replace(/_/g, ' ')}
                        </Text>
                        <View style={styles.dqBars}>
                          <View style={styles.dqBarLabel}>
                            <Text style={styles.dqBarLabelText}>C</Text>
                          </View>
                          <View style={styles.dqBarTrack}>
                            <View style={[styles.dqBarFill, { width: `${m.completeness}%`, backgroundColor: Colors.accentTeal }]} />
                          </View>
                          <View style={styles.dqBarLabel}>
                            <Text style={styles.dqBarLabelText}>R</Text>
                          </View>
                          <View style={styles.dqBarTrack}>
                            <View style={[styles.dqBarFill, { width: `${m.recency}%`, backgroundColor: Colors.info }]} />
                          </View>
                        </View>
                        {m.suppressed && <Text style={styles.dqSuppressed}>SUPPR</Text>}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
  },
  screenTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  screenSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Tabs — Superset SubMenu horizontal pills
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tab: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.accentTealBg },
  tabText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textMuted },
  tabTextActive: { color: Colors.accentTeal },

  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 100, gap: 12 },

  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, marginBottom: 12 },

  // Measure chips — Superset filter pills
  measureScroll: { marginBottom: 8 },
  measureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    marginRight: 4, borderWidth: 1, borderColor: Colors.border,
  },
  measureChipActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  measureDot: { width: 6, height: 6, borderRadius: 3 },
  measureChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },
  measureChipTextActive: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, color: Colors.accentTeal },

  // Primary button — Superset Button primary
  analyzeBtn: {
    backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm,
    paddingVertical: 10, alignItems: 'center', marginBottom: 8,
    height: 40, justifyContent: 'center',
  },
  analyzeBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },

  resultSection: { gap: 12 },

  // Stats card — Superset Card
  statsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  statsCardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statsItem: { width: '50%', paddingVertical: 8 },
  statsValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary },
  statsLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Anomalies card
  anomaliesCard: {
    backgroundColor: Colors.highAlert + '06', borderRadius: BorderRadius.sm,
    padding: 16, borderWidth: 1, borderColor: Colors.highAlert + '20',
  },
  anomaliesTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.highAlert, marginBottom: 8 },
  anomalyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  anomalyYear: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary, width: 40 },
  anomalyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.xs },
  anomalyType: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, textTransform: 'capitalize' },
  anomalyZ: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },

  causesList: {
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.highAlert + '15',
  },
  causesTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  causeText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Forecast card — Superset Card
  forecastCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  forecastTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  forecastRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  forecastYear: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary, width: 50 },
  forecastValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 13, color: Colors.textPrimary, width: 60, textAlign: 'right' },
  forecastCI: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'right' },

  // Family breakdown — Superset data table
  familyBreakdown: { marginTop: 12 },
  familyRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8,
    paddingVertical: 4,
  },
  familyDot: { width: 8, height: 8, borderRadius: 4 },
  familyLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, width: 100 },
  familyBarTrack: { flex: 1, height: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  familyBarFill: { height: 4, borderRadius: 2 },
  familyValue: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary, width: 30, textAlign: 'right' },

  // Data quality
  dqBreakdown: { marginTop: 12 },
  dqBreakdownTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  dqRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4,
    paddingVertical: 3,
  },
  dqConfDot: { width: 6, height: 6, borderRadius: 3 },
  dqMeasureName: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, width: 90 },
  dqBars: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dqBarLabel: { width: 14 },
  dqBarLabelText: { fontFamily: 'Roboto Mono, monospace', fontSize: 9, color: Colors.textMuted },
  dqBarTrack: { flex: 1, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  dqBarFill: { height: 3, borderRadius: 2 },
  dqSuppressed: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 9, color: Colors.warning },
});
