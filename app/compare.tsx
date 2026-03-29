// ============================================================
// Exposure2Tumor — Compare Screen
// Multi-geography comparison: radar, table, ranking
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { RadarChart } from '../src/components';
import type { GeoIdentifier, ExposureFamily, RiskState, RiskStateCategory } from '../src/types';

type CompareView = 'radar' | 'table' | 'ranking';

// Demo comparison geographies - full GeoIdentifier objects
const DEMO_GEOS: GeoIdentifier[] = [
  { fips: '36061', level: 'county', name: 'New York County, NY', state: 'New York', stateFips: '36', latitude: 40.7831, longitude: -73.9712, population: 1628706 },
  { fips: '06037', level: 'county', name: 'Los Angeles County, CA', state: 'California', stateFips: '06', latitude: 34.0522, longitude: -118.2437, population: 10014009 },
  { fips: '17031', level: 'county', name: 'Cook County, IL', state: 'Illinois', stateFips: '17', latitude: 41.8781, longitude: -87.6298, population: 5150233 },
];

// Generate deterministic demo risk data per geo
function generateDemoRisk(geoFips: string, category: RiskStateCategory): number {
  let hash = 0;
  const seed = geoFips + category;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return 20 + Math.abs(hash % 60);
}

// Map exposure families to radar axes
const RADAR_FAMILIES: ExposureFamily[] = [
  'environmental', 'behavioral', 'screening_access',
  'social_structural', 'occupational', 'climate_uv', 'food_environment',
];

const RISK_CATS: RiskStateCategory[] = [
  'environmental_burden', 'behavioral_burden', 'preventive_access',
  'structural_vulnerability', 'cumulative_cancer_pressure', 'prevention_opportunity',
];

const RISK_CAT_LABELS: Record<RiskStateCategory, string> = {
  environmental_burden: 'Environmental',
  behavioral_burden: 'Behavioral',
  preventive_access: 'Prevention',
  structural_vulnerability: 'Structural',
  cumulative_cancer_pressure: 'Cumulative',
  prevention_opportunity: 'Opportunity',
};

const GEO_COLORS = [Colors.accentTeal, '#E879F9', '#FB923C'];

export default function CompareScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const siteConfig = CANCER_SITES[activeSite];

  const [view, setView] = useState<CompareView>('radar');
  const [selectedGeos, setSelectedGeos] = useState<GeoIdentifier[]>(
    currentGeo ? [currentGeo, DEMO_GEOS[1], DEMO_GEOS[2]] : DEMO_GEOS,
  );

  const toggleGeo = (geo: GeoIdentifier) => {
    setSelectedGeos(prev =>
      prev.find(g => g.fips === geo.fips)
        ? prev.filter(g => g.fips !== geo.fips)
        : [...prev.slice(0, 2), geo],
    );
  };

  // Generate table data per geo per risk category
  const tableData = useMemo(() => {
    return selectedGeos.map(geo => ({
      geo,
      scores: RISK_CATS.reduce((acc, cat) => {
        acc[cat] = generateDemoRisk(geo.fips, cat);
        return acc;
      }, {} as Record<RiskStateCategory, number>),
    }));
  }, [selectedGeos]);

  // Radar chart data - primary geo axes + optional compare
  const radarAxes = useMemo(() => {
    const primary = selectedGeos[0];
    if (!primary) return [];
    return RADAR_FAMILIES.map(f => ({
      label: EXPOSURE_FAMILY_LABELS[f],
      value: generateDemoRisk(primary.fips, f === 'environmental' ? 'environmental_burden' : f === 'behavioral' ? 'behavioral_burden' : 'preventive_access'),
    }));
  }, [selectedGeos]);

  const radarCompareAxes = useMemo(() => {
    const compare = selectedGeos[1];
    if (!compare) return undefined;
    return RADAR_FAMILIES.map(f => ({
      label: EXPOSURE_FAMILY_LABELS[f],
      value: generateDemoRisk(compare.fips, f === 'environmental' ? 'environmental_burden' : f === 'behavioral' ? 'behavioral_burden' : 'preventive_access'),
    }));
  }, [selectedGeos]);

  // Rankings - sort geos by cumulative score descending
  const rankings = useMemo(() => {
    return [...tableData]
      .map(td => ({ geo: td.geo, total: Object.values(td.scores).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [tableData]);

  const views: { key: CompareView; label: string }[] = [
    { key: 'radar', label: 'Radar' },
    { key: 'table', label: 'Table' },
    { key: 'ranking', label: 'Ranking' },
  ];

  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.header}>
        <Text style={st.screenTitle}>Compare</Text>
        <Text style={st.screenSubtitle}>Multi-geography comparison · {siteConfig.shortLabel}</Text>
      </View>
      <View style={st.tabBar}>
        {views.map(v => (
          <TouchableOpacity key={v.key} style={[st.tab, view === v.key && st.tabActive]} onPress={() => setView(v.key)}>
            <Text style={[st.tabText, view === v.key && st.tabTextActive]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Geo Selector Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.chipBar} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}>
        {(currentGeo ? [currentGeo, ...DEMO_GEOS.filter(g => g.fips !== currentGeo.fips)] : DEMO_GEOS).map(geo => {
          const sel = selectedGeos.find(g => g.fips === geo.fips);
          return (
            <TouchableOpacity key={geo.fips} style={[st.chip, sel && st.chipActive]} onPress={() => toggleGeo(geo)}>
              <Text style={[st.chipText, sel && st.chipTextActive]}>{geo.name.split(',')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={st.content} contentContainerStyle={st.contentInner}>
        {/* RADAR */}
        {view === 'radar' && (
          <>
            <View style={st.radarContainer}>
              <RadarChart
                axes={radarAxes}
                compareAxes={radarCompareAxes}
                size={280}
              />
            </View>
            <View style={st.legendRow}>
              {selectedGeos.slice(0, 2).map((geo, i) => (
                <View key={geo.fips} style={st.legendItem}>
                  <View style={[st.legendDot, { backgroundColor: GEO_COLORS[i] }]} />
                  <Text style={st.legendText}>{geo.name.split(',')[0]}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* TABLE */}
        {view === 'table' && (
          <View style={st.tableCard}>
            <View style={st.tableHeaderRow}>
              <Text style={[st.tableHeaderCell, { flex: 2 }]}>Category</Text>
              {selectedGeos.map((geo, idx) => (
                <Text key={geo.fips} style={[st.tableHeaderCell, { color: GEO_COLORS[idx] }]}>{geo.name.split(',')[0]}</Text>
              ))}
            </View>
            {RISK_CATS.map(cat => (
              <View key={cat} style={st.tableRow}>
                <Text style={[st.tableCell, { flex: 2 }]}>{RISK_CAT_LABELS[cat]}</Text>
                {tableData.map((td, idx) => {
                  const score = td.scores[cat];
                  return (
                    <View key={td.geo.fips} style={st.tableCell}>
                      <View style={[st.scorePill, {
                        backgroundColor: score >= 65 ? Colors.highAlert + '20' : score >= 40 ? Colors.warning + '20' : Colors.success + '20',
                      }]}>
                        <Text style={[st.scoreNum, {
                          color: score >= 65 ? Colors.highAlert : score >= 40 ? Colors.warning : Colors.success,
                        }]}>{score}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* RANKING */}
        {view === 'ranking' && (
          <>
            <Text style={st.sectionTitle}>Overall Risk Ranking</Text>
            {rankings.map((r, idx) => (
              <View key={r.geo.fips} style={st.rankRow}>
                <Text style={st.rankNum}>#{idx + 1}</Text>
                <View style={st.rankInfo}>
                  <Text style={st.rankName}>{r.geo.name}</Text>
                  <Text style={st.rankMeta}>{r.geo.level} · Pop: {(r.geo.population ?? 0).toLocaleString()}</Text>
                </View>
                <View style={st.rankScoreContainer}>
                  <Text style={[st.rankScore, {
                    color: r.total / RISK_CATS.length >= 55 ? Colors.highAlert : Colors.accentTeal,
                  }]}>{(r.total / RISK_CATS.length).toFixed(0)}</Text>
                  <Text style={st.rankScoreLabel}>avg</Text>
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
  chipBar: { maxHeight: 50, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, marginRight: 4 },
  chipActive: { backgroundColor: Colors.accentTealBg, borderColor: Colors.accentTeal },
  chipText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  chipTextActive: { color: Colors.accentTeal },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 8 },
  radarContainer: { alignItems: 'center', marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary },
  tableCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, borderWidth: 1, borderColor: Colors.border },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, paddingBottom: 4, marginBottom: 4 },
  tableHeaderCell: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  tableCell: { flex: 1, alignItems: 'center' },
  scorePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  scoreNum: { fontFamily: 'Roboto Mono, monospace', fontSize: 13 },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  rankNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.accentTeal, width: 40 },
  rankInfo: { flex: 1 },
  rankName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  rankMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  rankScoreContainer: { alignItems: 'center' },
  rankScore: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16 },
  rankScoreLabel: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
});

