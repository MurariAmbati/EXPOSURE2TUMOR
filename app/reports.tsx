// ============================================================
// Exposure2Tumor — Reports & Export Screen
// Community reports, benchmarks, disparities, CSV/PDF export
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
  Alert as RNAlert,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { useRiskStates } from '../src/hooks';
import { generateCommunityReport, exposureValuesToCSV, riskStatesToCSV } from '../src/services/reportService';
import { BenchmarkGauge, DisparityBars } from '../src/components';
import type { CommunityReport, ExportJob, ExposureFamily } from '../src/types';

type ReportTab = 'generate' | 'benchmarks' | 'disparities' | 'export';

export default function ReportsScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];

  const [activeTab, setActiveTab] = useState<ReportTab>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  const generateReport = useCallback(() => {
    if (!currentGeo) return;
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateCommunityReport(currentGeo, riskStates, exposureValues);
      setReport(result);
      setIsGenerating(false);
    }, 1500);
  }, [currentGeo, riskStates, exposureValues]);

  const handleExport = useCallback((format: 'csv' | 'pdf' | 'json') => {
    const job: ExportJob = {
      id: `exp_${Date.now()}`,
      type: 'report',
      format,
      status: 'complete',
      progress: 100,
      data: {
        title: `${siteConfig.label} Report - ${currentGeo?.name ?? 'Unknown'}`,
        geoIds: currentGeo ? [currentGeo.fips] : [],
        cancerSites: [activeSite],
        includeProvenance: true,
        includeMethodology: true,
        sections: ['executive_summary', 'risk_profile', 'disparities', 'benchmarks'],
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    setExportJobs(prev => [job, ...prev]);
    if (format === 'csv') {
      const csv = exposureValuesToCSV(exposureValues, currentGeo?.name ?? 'Unknown');
      RNAlert.alert('CSV Export Ready', `${csv.split('\n').length - 1} rows exported.`);
    } else {
      RNAlert.alert('Export Queued', `${format.toUpperCase()} report will be ready shortly.`);
    }
  }, [currentGeo, activeSite, exposureValues, siteConfig]);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'generate', label: 'Report' },
    { key: 'benchmarks', label: 'Benchmarks' },
    { key: 'disparities', label: 'Disparities' },
    { key: 'export', label: 'Export' },
  ];

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.header}>
        <Text style={st.screenTitle}>Reports</Text>
        <Text style={st.screenSubtitle}>Community intelligence · {siteConfig.shortLabel} · {currentGeo?.name ?? 'No location'}</Text>
      </View>
      <View style={st.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} style={[st.tab, activeTab === tab.key && st.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[st.tabText, activeTab === tab.key && st.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={st.content} contentContainerStyle={st.contentInner}>
        {/* GENERATE */}
        {activeTab === 'generate' && (
          <>
            <TouchableOpacity style={[st.genBtn, !currentGeo && st.genBtnDisabled]} onPress={generateReport} disabled={!currentGeo || isGenerating}>
              <Text style={st.genBtnText}>{isGenerating ? 'Generating…' : 'Generate Full Report'}</Text>
            </TouchableOpacity>
            {isGenerating && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}
            {report && !isGenerating && (
              <>
                <View style={st.execCard}>
                  <Text style={st.execTitle}>Executive Summary</Text>
                  <Text style={st.execText}>{report.executiveSummary}</Text>
                  <Text style={st.execMeta}>Generated {new Date(report.generatedAt).toLocaleString()}</Text>
                </View>
                <View style={st.riskCard}>
                  <Text style={st.cardTitle}>Risk Profile</Text>
                  <View style={st.riskRow}>
                    <View style={st.riskBubble}>
                      <Text style={st.riskNum}>{report.riskProfile.overallScore.toFixed(0)}</Text>
                      <Text style={st.riskLabel}>Score</Text>
                    </View>
                    <View style={st.riskBubble}>
                      <Text style={[st.riskNum, { color: Colors.highAlert }]}>{report.riskProfile.topExposures.length}</Text>
                      <Text style={st.riskLabel}>Top Risks</Text>
                    </View>
                    <View style={st.riskBubble}>
                      <Text style={[st.riskNum, { color: Colors.success }]}>{report.actionItems.length}</Text>
                      <Text style={st.riskLabel}>Actions</Text>
                    </View>
                  </View>
                  <Text style={st.subSec}>Top Exposure Concerns</Text>
                  {report.riskProfile.topExposures.map((exp, i) => (
                    <View key={i} style={st.exposureRow}>
                      <Text style={st.exposureRank}>#{i + 1}</Text>
                      <View style={[st.famDot, { backgroundColor: EXPOSURE_FAMILY_COLORS[exp.family] ?? Colors.textMuted }]} />
                      <Text style={st.exposureName}>{EXPOSURE_FAMILY_LABELS[exp.family]}</Text>
                      <View style={st.percBar}>
                        <View style={[st.percFill, { width: `${exp.nationalPercentile}%`, backgroundColor: exp.nationalPercentile >= 75 ? Colors.highAlert : Colors.warning }]} />
                      </View>
                      <Text style={st.percText}>{exp.nationalPercentile.toFixed(0)}th</Text>
                    </View>
                  ))}
                </View>
                <View style={st.actionsCard}>
                  <Text style={st.cardTitle}>Recommended Actions</Text>
                  {report.actionItems.map((action, i) => (
                    <View key={i} style={st.actionItem}>
                      <View style={st.actionHeader}>
                        <View style={[st.priorityBadge, {
                          backgroundColor: action.priority === 'critical' ? Colors.highAlert + '20' : action.priority === 'high' ? Colors.warning + '20' : Colors.accentTeal + '15',
                        }]}>
                          <Text style={[st.priorityText, {
                            color: action.priority === 'critical' ? Colors.highAlert : action.priority === 'high' ? Colors.warning : Colors.accentTeal,
                          }]}>{action.priority}</Text>
                        </View>
                        <Text style={st.actionTitle}>{action.title}</Text>
                      </View>
                      <Text style={st.actionDesc}>{action.description}</Text>
                      <Text style={st.actionMeta}>Impact: {action.expectedImpact} · Timeline: {action.timeframe}</Text>
                    </View>
                  ))}
                </View>
                {report.resources.length > 0 && (
                  <View style={st.resourcesCard}>
                    <Text style={st.cardTitle}>Community Resources</Text>
                    {report.resources.map((res, i) => (
                      <View key={i} style={st.resourceItem}>
                        <Text style={st.resourceName}>{res.name}</Text>
                        <Text style={st.resourceType}>{res.type.replace(/_/g, ' ')}</Text>
                        <Text style={st.resourceAddr}>{res.address}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* BENCHMARKS */}
        {activeTab === 'benchmarks' && (
          <>
            <Text style={st.sectionTitle}>Benchmark Comparisons</Text>
            {!report ? (
              <View style={st.noData}><Text style={st.noDataT}>Generate a report first</Text></View>
            ) : (
              <View style={st.bmGrid}>{report.benchmarks.map((bm, i) => <BenchmarkGauge key={i} benchmark={bm} size={150} />)}</View>
            )}
          </>
        )}

        {/* DISPARITIES */}
        {activeTab === 'disparities' && (
          <>
            <Text style={st.sectionTitle}>Health Disparities</Text>
            {!report ? (
              <View style={st.noData}><Text style={st.noDataT}>Generate a report first</Text></View>
            ) : (
              <>
                <DisparityBars disparities={report.disparities} maxWidth={320} />
                <View style={st.dispSummary}>
                  <Text style={st.cardTitle}>Disparity Analysis</Text>
                  {report.disparities.map((d, i) => (
                    <View key={i} style={st.dispRow}>
                      <Text style={st.dispDim}>{d.dimension}</Text>
                      <Text style={st.dispGroups}>{d.groupA.label} vs {d.groupB.label}</Text>
                      <View style={[st.dispBadge, {
                        backgroundColor: d.ratio >= 1.5 ? Colors.highAlert + '20' : d.ratio >= 1.2 ? Colors.warning + '20' : Colors.success + '20',
                      }]}>
                        <Text style={[st.dispRatio, {
                          color: d.ratio >= 1.5 ? Colors.highAlert : d.ratio >= 1.2 ? Colors.warning : Colors.success,
                        }]}>{d.ratio.toFixed(2)}x</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* EXPORT */}
        {activeTab === 'export' && (
          <>
            <Text style={st.sectionTitle}>Export Data</Text>
            <View style={st.exportGrid}>
              {(['csv', 'json', 'pdf'] as const).map(fmt => (
                <TouchableOpacity key={fmt} style={st.exportCard} onPress={() => handleExport(fmt)}>
                  <Text style={st.exportLabel}>{fmt.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {exportJobs.length > 0 && (
              <View style={st.exportHistory}>
                <Text style={st.cardTitle}>Export History</Text>
                {exportJobs.map(job => (
                  <View key={job.id} style={st.jobRow}>
                    <View style={[st.jobDot, { backgroundColor: job.status === 'complete' ? Colors.success : Colors.warning }]} />
                    <Text style={st.jobFmt}>{job.format.toUpperCase()}</Text>
                    <Text style={st.jobTime}>{new Date(job.createdAt).toLocaleTimeString()}</Text>
                    <Text style={[st.jobStatus, { color: job.status === 'complete' ? Colors.success : Colors.textMuted }]}>{job.status}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[st.genBtn, { marginTop: Spacing.md }]} onPress={() => {
              const csv = riskStatesToCSV(riskStates);
              RNAlert.alert('Risk States', `${csv.split('\n').length - 1} rows exported.`);
            }}>
              <Text style={st.genBtnText}>Export Risk Assessments (CSV)</Text>
            </TouchableOpacity>
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
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  genBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingVertical: 12, alignItems: 'center', marginBottom: 12, height: 40, justifyContent: 'center' },
  genBtnDisabled: { opacity: 0.5 },
  genBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  execCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.accentTeal },
  execTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.accentTeal, marginBottom: 8 },
  execText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  execMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  riskCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  riskRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  riskBubble: { alignItems: 'center' },
  riskNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.accentTeal },
  riskLabel: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  subSec: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textSecondary, marginTop: 8, marginBottom: 4 },
  exposureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 4 },
  exposureRank: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textMuted, width: 24 },
  famDot: { width: 8, height: 8, borderRadius: 4 },
  exposureName: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  percBar: { width: 70, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  percFill: { height: 6, borderRadius: 3 },
  percText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, width: 35, textAlign: 'right' },
  actionsCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  actionItem: { marginBottom: 12 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  priorityText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'uppercase' },
  actionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  actionDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  actionMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  resourcesCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  resourceItem: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  resourceName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  resourceType: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.accentTeal, textTransform: 'capitalize', marginVertical: 2 },
  resourceAddr: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  noData: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  noDataT: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },
  bmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  dispSummary: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  dispRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  dispDim: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textPrimary, width: 75, textTransform: 'capitalize' },
  dispGroups: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, flex: 1 },
  dispBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  dispRatio: { fontFamily: 'Roboto Mono, monospace', fontSize: 13 },
  exportGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  exportCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  exportLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  exportHistory: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  jobDot: { width: 8, height: 8, borderRadius: 4 },
  jobFmt: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary, width: 40 },
  jobTime: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, flex: 1 },
  jobStatus: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, textTransform: 'capitalize' },
});

