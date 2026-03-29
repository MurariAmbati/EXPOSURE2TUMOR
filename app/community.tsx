// ============================================================
// Exposure2Tumor — Community Intelligence Screen
// Overview, resources, actions, equity analysis
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { useRiskStates } from '../src/hooks';
import { generateCommunityReport } from '../src/services/reportService';
import { BenchmarkGauge, DisparityBars } from '../src/components';
import type { CommunityReport } from '../src/types';

type CommunityTab = 'overview' | 'resources' | 'actions' | 'equity';

export default function CommunityScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];

  const [activeTab, setActiveTab] = useState<CommunityTab>('overview');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CommunityReport | null>(null);

  const loadReport = useCallback(() => {
    if (!currentGeo) return;
    setLoading(true);
    setTimeout(() => {
      const result = generateCommunityReport(currentGeo, riskStates, exposureValues);
      setReport(result);
      setLoading(false);
    }, 1200);
  }, [currentGeo, riskStates, exposureValues]);

  const tabs: { key: CommunityTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'resources', label: 'Resources' },
    { key: 'actions', label: 'Actions' },
    { key: 'equity', label: 'Equity' },
  ];

  const tierColor = (tier: string) =>
    tier === 'very_high' || tier === 'high' ? Colors.highAlert
      : tier === 'moderate' ? Colors.warning
      : Colors.success;

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.header}>
        <Text style={st.screenTitle}>Community</Text>
        <Text style={st.screenSubtitle}>
          Intelligence · {siteConfig.shortLabel} · {currentGeo?.name ?? 'No location'}
        </Text>
      </View>
      <View style={st.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[st.tab, activeTab === t.key && st.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[st.tabText, activeTab === t.key && st.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={st.content} contentContainerStyle={st.contentInner}>
        {/* Generate prompt when no report */}
        {!report && !loading && (
          <TouchableOpacity style={[st.genBtn, !currentGeo && st.genBtnDisabled]} onPress={loadReport} disabled={!currentGeo}>
            <Text style={st.genBtnText}>Generate Community Intelligence</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="large" color={Colors.accentTeal} style={{ marginTop: Spacing.xl }} />}

        {/* OVERVIEW */}
        {activeTab === 'overview' && report && !loading && (
          <>
            <View style={st.summaryCard}>
              <Text style={st.summaryTitle}>{report.geoName}</Text>
              <Text style={st.summaryPop}>Population: {report.population.toLocaleString()}</Text>
              <Text style={st.summaryText}>{report.executiveSummary}</Text>
            </View>
            <View style={st.scoreCard}>
              <View style={st.scoreRow}>
                <View style={st.scoreBlock}>
                  <Text style={[st.scoreNum, { color: tierColor(report.riskProfile.tier) }]}>
                    {report.riskProfile.overallScore.toFixed(0)}
                  </Text>
                  <Text style={st.scoreLabel}>Risk Score</Text>
                </View>
                <View style={st.scoreBlock}>
                  <Text style={[st.tierBadgeText, { color: tierColor(report.riskProfile.tier) }]}>
                    {report.riskProfile.tier.replace(/_/g, ' ')}
                  </Text>
                  <Text style={st.scoreLabel}>Risk Tier</Text>
                </View>
              </View>
            </View>
            <Text style={st.sectionTitle}>Top Exposure Concerns</Text>
            {report.riskProfile.topExposures.map((exp, i) => (
              <View key={i} style={st.expCard}>
                <View style={st.expHeader}>
                  <View style={[st.famDot, { backgroundColor: EXPOSURE_FAMILY_COLORS[exp.family] ?? Colors.textMuted }]} />
                  <Text style={st.expName}>{EXPOSURE_FAMILY_LABELS[exp.family]}</Text>
                  <Text style={[st.expTrend, {
                    color: exp.trend === 'worsening' ? Colors.highAlert : exp.trend === 'improving' ? Colors.success : Colors.textMuted,
                  }]}>{exp.trend}</Text>
                </View>
                <View style={st.expBarOuter}>
                  <View style={[st.expBarInner, {
                    width: `${exp.nationalPercentile}%`,
                    backgroundColor: exp.nationalPercentile >= 75 ? Colors.highAlert : exp.nationalPercentile >= 50 ? Colors.warning : Colors.accentTeal,
                  }]} />
                </View>
                <Text style={st.expPerc}>{exp.nationalPercentile.toFixed(0)}th percentile national · Score: {exp.score.toFixed(1)}</Text>
              </View>
            ))}
            <Text style={st.sectionTitle}>Cancer Burden</Text>
            {report.riskProfile.cancerBurdens.map((cb, i) => (
              <View key={i} style={st.burdenRow}>
                <Text style={st.burdenSite}>{CANCER_SITES[cb.site]?.shortLabel ?? cb.site}</Text>
                <Text style={st.burdenPerc}>Inc: {cb.incidencePercentile}th</Text>
                <Text style={st.burdenPerc}>Mort: {cb.mortalityPercentile}th</Text>
                <Text style={[st.burdenTrend, {
                  color: cb.trend === 'worsening' ? Colors.highAlert : cb.trend === 'improving' ? Colors.success : Colors.textMuted,
                }]}>{cb.trend}</Text>
              </View>
            ))}
            <Text style={st.sectionTitle}>Benchmarks</Text>
            <View style={st.bmGrid}>{report.benchmarks.map((bm, i) => <BenchmarkGauge key={i} benchmark={bm} size={140} />)}</View>
          </>
        )}

        {/* RESOURCES */}
        {activeTab === 'resources' && report && !loading && (
          <>
            <Text style={st.sectionTitle}>Community Resources</Text>
            {report.resources.length === 0 ? (
              <View style={st.noData}><Text style={st.noDataT}>No resources found</Text></View>
            ) : (
              report.resources.map(res => (
                <View key={res.id} style={st.resCard}>
                  <View style={st.resHeader}>
                    <Text style={st.resName}>{res.name}</Text>
                    <View style={st.resTypeBadge}>
                      <Text style={st.resTypeText}>{res.type.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={st.resAddr}>{res.address}</Text>
                  {res.distance != null && <Text style={st.resDist}>{res.distance.toFixed(1)} mi away</Text>}
                  <View style={st.resServicesRow}>
                    {res.services.map((svc, i) => (
                      <View key={i} style={st.svcChip}><Text style={st.svcText}>{svc}</Text></View>
                    ))}
                  </View>
                  {res.cancerSites.length > 0 && (
                    <Text style={st.resSites}>Covers: {res.cancerSites.map(s => CANCER_SITES[s]?.shortLabel ?? s).join(', ')}</Text>
                  )}
                  {res.phone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${res.phone}`)}>
                      <Text style={st.resPhone}>{res.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ACTIONS */}
        {activeTab === 'actions' && report && !loading && (
          <>
            <Text style={st.sectionTitle}>Recommended Actions ({report.actionItems.length})</Text>
            {report.actionItems.map(action => (
              <View key={action.id} style={st.actionCard}>
                <View style={st.actionHeader}>
                  <View style={[st.priBadge, {
                    backgroundColor: action.priority === 'critical' ? Colors.highAlert + '20' : action.priority === 'high' ? Colors.warning + '20' : Colors.accentTeal + '15',
                  }]}>
                    <Text style={[st.priText, {
                      color: action.priority === 'critical' ? Colors.highAlert : action.priority === 'high' ? Colors.warning : Colors.accentTeal,
                    }]}>{action.priority}</Text>
                  </View>
                  <View style={st.catBadge}>
                    <Text style={st.catText}>{action.category}</Text>
                  </View>
                </View>
                <Text style={st.actionTitle}>{action.title}</Text>
                <Text style={st.actionDesc}>{action.description}</Text>
                <View style={st.actionMetaRow}>
                  <Text style={st.actionMeta}>Impact: {action.expectedImpact}</Text>
                  <Text style={st.actionMeta}>Timeframe: {action.timeframe.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={st.actionEvidence}>Evidence: {action.evidenceLevel}</Text>
                {action.relatedMeasures.length > 0 && (
                  <Text style={st.actionMeasures}>Measures: {action.relatedMeasures.join(', ')}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* EQUITY */}
        {activeTab === 'equity' && report && !loading && (
          <>
            <Text style={st.sectionTitle}>Health Equity Analysis</Text>
            <DisparityBars disparities={report.disparities} maxWidth={320} />
            {report.disparities.map((d, i) => (
              <View key={i} style={st.eqCard}>
                <Text style={st.eqDim}>{d.dimension.replace(/_/g, ' ')}</Text>
                <Text style={st.eqMeasure}>{d.measureName}</Text>
                <View style={st.eqGroupsRow}>
                  <View style={st.eqGroup}>
                    <Text style={st.eqGroupLabel}>{d.groupA.label}</Text>
                    <Text style={st.eqGroupVal}>{d.groupA.value.toFixed(1)}</Text>
                  </View>
                  <Text style={st.eqVs}>vs</Text>
                  <View style={st.eqGroup}>
                    <Text style={st.eqGroupLabel}>{d.groupB.label}</Text>
                    <Text style={st.eqGroupVal}>{d.groupB.value.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={st.eqStatsRow}>
                  <View style={[st.eqRatioBadge, {
                    backgroundColor: d.ratio >= 1.5 ? Colors.highAlert + '20' : d.ratio >= 1.2 ? Colors.warning + '20' : Colors.success + '20',
                  }]}>
                    <Text style={[st.eqRatioText, {
                      color: d.ratio >= 1.5 ? Colors.highAlert : d.ratio >= 1.2 ? Colors.warning : Colors.success,
                    }]}>{d.ratio.toFixed(2)}x disparity</Text>
                  </View>
                  <Text style={st.eqAbsDiff}>? {d.absoluteDifference.toFixed(1)}</Text>
                  <Text style={[st.eqTrend, {
                    color: d.trend === 'worsening' ? Colors.highAlert : d.trend === 'improving' ? Colors.success : Colors.textMuted,
                  }]}>{d.trend}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  screenSubtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 4, borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.accentTealBg, borderWidth: 1, borderColor: Colors.accentTealBorder },
  tabText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  tabTextActive: { color: Colors.accentTeal, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 100 },
  genBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingVertical: 12, alignItems: 'center', height: 40, justifyContent: 'center' },
  genBtnDisabled: { opacity: 0.5 },
  genBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginTop: 12, marginBottom: 8 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.accentTeal, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  summaryPop: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  summaryText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  scoreCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreBlock: { alignItems: 'center' },
  scoreNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18 },
  scoreLabel: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  tierBadgeText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, textTransform: 'uppercase' },
  expCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  expHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  famDot: { width: 10, height: 10, borderRadius: 5 },
  expName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  expTrend: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'capitalize' },
  expBarOuter: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  expBarInner: { height: 6, borderRadius: 3 },
  expPerc: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  burdenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  burdenSite: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  burdenPerc: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  burdenTrend: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'capitalize', width: 55 },
  bmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  noData: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  noDataT: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },
  resCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  resHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  resTypeBadge: { backgroundColor: Colors.accentTealBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  resTypeText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.accentTeal, textTransform: 'capitalize' },
  resAddr: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  resDist: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resServicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  svcChip: { backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  svcText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textSecondary },
  resSites: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  resPhone: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.accentTeal, marginTop: 4 },
  actionCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  actionHeader: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  priBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  priText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'uppercase' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, backgroundColor: Colors.border },
  catText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textSecondary, textTransform: 'capitalize' },
  actionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  actionDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginBottom: 4 },
  actionMetaRow: { flexDirection: 'row', gap: 12 },
  actionMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  actionEvidence: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.accentTeal, marginTop: 4 },
  actionMeasures: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  eqCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  eqDim: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.accentTeal, textTransform: 'uppercase', marginBottom: 2 },
  eqMeasure: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  eqGroupsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  eqGroup: { alignItems: 'center' },
  eqGroupLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  eqGroupVal: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  eqVs: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  eqStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eqRatioBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  eqRatioText: { fontFamily: 'Roboto Mono, monospace', fontSize: 13 },
  eqAbsDiff: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textMuted },
  eqTrend: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'capitalize' },
});

