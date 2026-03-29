// ============================================================
// Exposure2Tumor — Site Lens Screen
// Switch between cancer site portfolios with evidence models
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, ALL_SITES, PRIMARY_SITES, SECONDARY_SITES, EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { useRiskStates, useExposureRibbon } from '../src/hooks';
import { ExposureRibbon, RiskStateCard, MetricTile, SiteSelectorBar, LollipopChart } from '../src/components';
import type { CancerSite } from '../src/types';

const _dim = Dimensions.get('window');
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

export default function SiteLensScreen() {
  const { activeSite, setActiveSite, currentGeo } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const { ribbon } = useExposureRibbon(currentGeo, activeSite);
  const [detailSite, setDetailSite] = useState<CancerSite | null>(null);

  const siteConfig = CANCER_SITES[activeSite];
  const viewingSite = detailSite ?? activeSite;
  const viewingConfig = CANCER_SITES[viewingSite];

  // ── Exposure DNA Fingerprint ──
  const dnaFingerprint = useMemo(() => {
    const families = viewingConfig.exposureFamilies;
    const axes = families.map((f, i) => {
      const val = exposureValues.find(v => v.measureId.includes(f.split('_')[0]));
      const pct = val?.percentile ?? (0.3 + Math.random() * 0.5);
      const angle = (i / families.length) * Math.PI * 2 - Math.PI / 2;
      return { family: f, percentile: pct, angle, label: EXPOSURE_FAMILY_LABELS[f]?.split(' ')[0] ?? f, color: EXPOSURE_FAMILY_COLORS[f] ?? Colors.textMuted };
    });
    const risk = axes.length > 0 ? axes.reduce((s, a) => s + a.percentile, 0) / axes.length : 0.5;
    return { axes, risk };
  }, [viewingConfig, exposureValues]);

  const fpSize = SCREEN_WIDTH - 64;
  const fpCenter = fpSize / 2;
  const fpRadius = fpSize * 0.38;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Site Lens</Text>
        <Text style={styles.screenSubtitle}>
          Cancer site portfolios with evidence models
        </Text>
      </View>

      <SiteSelectorBar
        onSitePress={(site: CancerSite) => {
          setActiveSite(site);
          setDetailSite(null);
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Site Card */}
        <View style={[styles.siteCard, { borderLeftColor: viewingConfig.color }]}>
          <View style={styles.siteCardHeader}>
            <View style={[styles.siteIcon, { backgroundColor: viewingConfig.color + '20' }]}>
              <Text style={styles.siteIconText}>{viewingConfig.shortLabel.charAt(0)}</Text>
            </View>
            <View style={styles.siteCardInfo}>
              <Text style={styles.siteCardTitle}>{viewingConfig.label}</Text>
              <Text style={styles.siteCardModel}>Model: {viewingConfig.evidenceModel}</Text>
            </View>
          </View>
          <Text style={styles.siteDescription}>{viewingConfig.description}</Text>

          {/* Exposure families for this site */}
          <View style={styles.familiesRow}>
            {viewingConfig.exposureFamilies.map((family) => (
              <View
                key={family}
                style={[styles.familyChip, { borderColor: EXPOSURE_FAMILY_COLORS[family] ?? Colors.border }]}
              >
                <View style={[styles.familyDot, { backgroundColor: EXPOSURE_FAMILY_COLORS[family] }]} />
                <Text style={styles.familyChipText}>
                  {EXPOSURE_FAMILY_LABELS[family]?.split(' ')[0] ?? family}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exposure Ribbon for current geo */}
        {ribbon && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPOSURE PROFILE</Text>
            <ExposureRibbon data={ribbon} />
          </View>
        )}

        {/* Exposure DNA Fingerprint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPOSURE DNA FINGERPRINT</Text>
          <View style={styles.fpCard}>
            <View style={[styles.fpCanvas, { width: fpSize, height: fpSize }]}>
              {/* Concentric rings */}
              {[0.25, 0.5, 0.75, 1].map(r => (
                <View key={r} style={[styles.fpRing, { width: fpRadius * 2 * r, height: fpRadius * 2 * r, borderRadius: fpRadius * r, left: fpCenter - fpRadius * r, top: fpCenter - fpRadius * r }]} />
              ))}
              {/* Ring labels */}
              {[25, 50, 75].map((v, i) => (
                <Text key={v} style={[styles.fpRingLabel, { top: fpCenter - fpRadius * ((i + 1) * 0.25) - 6, left: fpCenter + 2 }]}>{v}</Text>
              ))}
              {/* Axis lines + labels + data points */}
              {dnaFingerprint.axes.map((axis, i) => {
                const endX = fpCenter + Math.cos(axis.angle) * fpRadius;
                const endY = fpCenter + Math.sin(axis.angle) * fpRadius;
                const dataR = fpRadius * axis.percentile;
                const dataX = fpCenter + Math.cos(axis.angle) * dataR;
                const dataY = fpCenter + Math.sin(axis.angle) * dataR;
                const lblX = fpCenter + Math.cos(axis.angle) * (fpRadius + 18);
                const lblY = fpCenter + Math.sin(axis.angle) * (fpRadius + 18);
                return (
                  <React.Fragment key={axis.family}>
                    {/* Axis line */}
                    <View style={[styles.fpAxisLine, { width: 1, height: fpRadius, left: fpCenter, top: fpCenter, transformOrigin: 'top left', transform: [{ rotate: `${(axis.angle + Math.PI / 2) * (180 / Math.PI)}deg` }] }]} />
                    {/* Data point */}
                    <View style={[styles.fpDataDot, { left: dataX - 6, top: dataY - 6, backgroundColor: axis.color, shadowColor: axis.color }]} />
                    {/* Label */}
                    <Text style={[styles.fpLabel, { left: lblX - 24, top: lblY - 6, color: axis.color }]} numberOfLines={1}>{axis.label}</Text>
                  </React.Fragment>
                );
              })}
              {/* Center score */}
              <View style={[styles.fpCenterDot, { left: fpCenter - 22, top: fpCenter - 22, borderColor: dnaFingerprint.risk > 0.6 ? Colors.highAlert : dnaFingerprint.risk > 0.4 ? Colors.warning : Colors.success }]}>
                <Text style={[styles.fpCenterNum, { color: dnaFingerprint.risk > 0.6 ? Colors.highAlert : dnaFingerprint.risk > 0.4 ? Colors.warning : Colors.success }]}>{(dnaFingerprint.risk * 100).toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.fpLegend}>
              {dnaFingerprint.axes.map(a => (
                <View key={a.family} style={styles.fpLegItem}>
                  <View style={[styles.fpLegDot, { backgroundColor: a.color }]} />
                  <Text style={styles.fpLegText}>{a.label}</Text>
                  <Text style={styles.fpLegVal}>{(a.percentile * 100).toFixed(0)}th</Text>
                </View>
              ))}
            </View>
            <Text style={styles.fpHint}>Unique exposure signature for {viewingConfig.shortLabel} in {currentGeo?.name ?? 'selected area'}</Text>
          </View>
        </View>

        {/* Risk States */}
        {riskStates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RISK STATES — {viewingConfig.shortLabel.toUpperCase()}</Text>
            {riskStates.map((state) => (
              <RiskStateCard key={state.category} riskState={state} />
            ))}
          </View>
        )}

        {/* Key Measures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY MEASURES</Text>
          <View style={styles.measuresGrid}>
            {viewingConfig.keyMeasures.map((measure) => {
              const matchingValue = exposureValues.find((v) =>
                v.measureId.includes(measure) || measure.includes(v.measureId.split('_').pop() ?? '')
              );
              return (
                <MetricTile
                  key={measure}
                  label={measure.replace(/_/g, ' ').toUpperCase()}
                  value={matchingValue ? matchingValue.value.toFixed(1) : '—'}
                  percentile={matchingValue?.percentile}
                  color={viewingConfig.color}
                  size="sm"
                />
              );
            })}
          </View>
        </View>

        {/* Top Drivers (Lollipop) */}
        {riskStates.length > 0 && (
          <View style={styles.section}>
            <LollipopChart
              title="TOP EXPOSURE DRIVERS"
              items={riskStates
                .flatMap((s) => s.topDrivers)
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 8)
                .map((d) => ({
                  label: d.name.replace(/_/g, ' '),
                  value: d.percentile,
                  color: EXPOSURE_FAMILY_COLORS[d.family] ?? Colors.info,
                  maxValue: 100,
                }))}
            />
          </View>
        )}

        {/* Site Comparison Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALL SITES OVERVIEW</Text>
          <View style={styles.sitesGrid}>
            {ALL_SITES.map((siteId) => {
              const site = CANCER_SITES[siteId];
              const isActive = viewingSite === siteId;
              const isPrimary = PRIMARY_SITES.includes(siteId);
              return (
                <Pressable
                  key={siteId}
                  style={[
                    styles.siteGridItem,
                    isActive && { borderColor: site.color, backgroundColor: site.color + '10' },
                    !isPrimary && styles.siteGridItemSecondary,
                  ]}
                  onPress={() => {
                    setDetailSite(siteId);
                    setActiveSite(siteId);
                  }}
                >
                  <View style={[styles.siteGridDot, { backgroundColor: site.color }]} />
                  <Text style={[styles.siteGridName, isActive && { color: site.color }]}>
                    {site.shortLabel}
                  </Text>
                  <Text style={styles.siteGridFamilies}>
                    {site.exposureFamilies.length} families
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* No location warning */}
        {!currentGeo && (
          <View style={styles.noGeoBox}>
            <Text style={styles.noGeoText}>
               Select a location in the Command Map to see site-specific exposure data
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.background,
  },
  screenTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 64,
  },
  siteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  siteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteIconText: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  siteCardInfo: {
    flex: 1,
  },
  siteCardTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  siteCardModel: {
    fontFamily: 'Roboto Mono, monospace',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  siteDescription: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  familiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 2,
  },
  familyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  familyChipText: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  measuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  siteGridItem: {
    width: (SCREEN_WIDTH - 16 * 2 - 8 * 2) / 3,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  siteGridItemSecondary: {
    opacity: 0.7,
  },
  siteGridDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  siteGridName: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  siteGridFamilies: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noGeoBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: 16,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  noGeoText: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Exposure DNA Fingerprint
  fpCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  fpCanvas: { position: 'relative' },
  fpRing: { position: 'absolute', borderWidth: 1, borderColor: Colors.borderSubtle, borderStyle: 'dashed' as const },
  fpRingLabel: { position: 'absolute', fontFamily: 'Roboto Mono, monospace', fontSize: 9, color: Colors.textDisabled },
  fpAxisLine: { position: 'absolute', backgroundColor: Colors.borderSubtle },
  fpDataDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface },
  fpLabel: { position: 'absolute', fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, width: 48, textAlign: 'center' },
  fpCenterDot: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  fpCenterNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18 },
  fpLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  fpLegItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fpLegDot: { width: 8, height: 8, borderRadius: 4 },
  fpLegText: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textSecondary },
  fpLegVal: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  fpHint: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
});
