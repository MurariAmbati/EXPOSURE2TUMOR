// ============================================================
// Exposure2Tumor � Intelligence Dashboard
// Apache Superset�faithful dashboard layout
// Patterns: PageHeaderWithActions, SubMenu tabs, ListViewCard grid, FilterBar
// ============================================================

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
// react-native-maps is native-only; lazy-import to avoid web crash
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { useCurrentLocation, useRiskStates, useExposureRibbon } from '../src/hooks';
import { locationService } from '../src/services/location';
import { CommandBar, SearchBar, ExposureRibbon, RiskStateCard, MetricTile, EvidenceDrawer } from '../src/components';
import { CANCER_SITES } from '../src/config/cancerSites';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;
const SH = _dim.height;
const IS_WEB = Platform.OS === 'web';

// Demo county to auto-load on web so dashboard isn't empty
const DEMO_GEO = {
  fips: '48201',
  level: 'county' as const,
  name: 'Harris County',
  state: 'Texas',
  stateFips: '48',
  county: 'Harris',
  countyFips: '48201',
  latitude: 29.7604,
  longitude: -95.3698,
};

// -- Mini bar chart (pure RN) -----------------------------
function MiniBar({ values, color, height = 32 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values, 1);
  const w = Math.floor((SW - 64) / values.length) - 2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 1 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            width: Math.max(w, 3),
            height: Math.max((v / max) * height, 1),
            backgroundColor: i === values.length - 1 ? color : color + '55',
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

// -- Sparkline via dots ------------------------------------
function Sparkline({ values, color, width = 80, height = 24 }: { values: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  return (
    <View style={{ width, height, position: 'relative' }}>
      {values.map((v, i) => {
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: i * step - 1.5,
              top: y - 1.5,
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: i === values.length - 1 ? Colors.textPrimary : color,
            }}
          />
        );
      })}
    </View>
  );
}

export default function CommandMapScreen() {
  const mapRef = useRef<any>(null);
  const {
    currentGeo,
    setCurrentGeo,
    activeSite,
    mapView,
    setMapView,
    evidencePanelOpen,
    setEvidencePanelOpen,
    compareMode,
    setCompareMode,
    compareGeos,
    addCompareGeo,
  } = useAppStore();

  const { location, loading: locationLoading } = useCurrentLocation();
  const { riskStates, loading: riskLoading } = useRiskStates(currentGeo, activeSite);
  const { ribbon } = useExposureRibbon(currentGeo, activeSite);
  const [panelMode, setPanelMode] = useState<'map' | 'data'>('map');

  const siteConfig = CANCER_SITES[activeSite];

  // Derived stats
  const overallScore = useMemo(() => {
    if (!riskStates.length) return 0;
    return Math.round(riskStates.reduce((s, r) => s + r.score, 0) / riskStates.length);
  }, [riskStates]);

  const highAlertCount = useMemo(
    () => riskStates.filter((r) => r.tier === 'very_high' || r.tier === 'high').length,
    [riskStates],
  );

  const avgPercentile = useMemo(() => {
    if (!riskStates.length) return 0;
    return Math.round(riskStates.reduce((s, r) => s + (r.percentile ?? 0), 0) / riskStates.length);
  }, [riskStates]);

  // Synthetic trend data for sparklines
  const trendValues = useMemo(
    () => riskStates.map((r) => r.score),
    [riskStates],
  );

  // Auto-detect location on launch (native), or load demo geo (web)
  useEffect(() => {
    if (!currentGeo) {
      if (IS_WEB) {
        // On web, auto-load a demo county so dashboard has data immediately
        setCurrentGeo(DEMO_GEO as any);
      } else if (location) {
        (async () => {
          const geo = await locationService.getGeoIdentifierFromCoords(location.latitude, location.longitude);
          if (geo) {
            setCurrentGeo(geo);
            setEvidencePanelOpen(true);
          }
        })();
      }
    }
  }, [location, currentGeo, setCurrentGeo, setEvidencePanelOpen]);

  const handleMapPress = useCallback(
    async (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const geo = await locationService.getGeoIdentifierFromCoords(latitude, longitude);
      if (geo) {
        if (compareMode) addCompareGeo(geo);
        else {
          setCurrentGeo(geo);
          setEvidencePanelOpen(true);
        }
      }
    },
    [compareMode, addCompareGeo, setCurrentGeo, setEvidencePanelOpen],
  );

  const handleRegionChange = useCallback(
    (region: any) => {
      setMapView({
        latitude: region.latitude,
        longitude: region.longitude,
        zoom: Math.log2(360 / region.longitudeDelta),
      });
    },
    [setMapView],
  );

  const tierColor = (tier: string) =>
    tier === 'very_high' || tier === 'high'
      ? Colors.highAlert
      : tier === 'moderate'
      ? Colors.warning
      : Colors.success;

  // -- RENDER ---------------------------------------------
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        {/* -- SUPERSET HEADER (PageHeaderWithActions) ---- */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerTitleRow}>
              <Text style={s.headerTitle}>Intelligence Dashboard</Text>
              {highAlertCount > 0 && (
                <View style={s.alertBadge}>
                  <Text style={s.alertBadgeText}>{highAlertCount}</Text>
                </View>
              )}
            </View>
            <Text style={s.headerSub}>
              {currentGeo ? `${currentGeo.name} � ${currentGeo.state ?? ''}` : 'Select a location'}
              {currentGeo ? ` � FIPS ${currentGeo.fips}` : ''}
            </Text>
          </View>
          <View style={s.headerActions}>
            <View style={s.siteChip}>
              <View style={[s.siteDot, { backgroundColor: siteConfig.color }]} />
              <Text style={s.siteChipText}>{siteConfig.shortLabel}</Text>
            </View>
          </View>
        </View>

        {/* -- SUBMENU TABS (Superset SubMenu component) -- */}
        <View style={s.subMenu}>
          <View style={s.subMenuTabs}>
            <Pressable
              style={[s.subMenuTab, panelMode === 'map' && s.subMenuTabActive]}
              onPress={() => setPanelMode('map')}
            >
              <Text style={[s.subMenuTabText, panelMode === 'map' && s.subMenuTabTextActive]}>
                {IS_WEB ? 'Overview' : 'Map'}
              </Text>
            </Pressable>
            <Pressable
              style={[s.subMenuTab, panelMode === 'data' && s.subMenuTabActive]}
              onPress={() => setPanelMode('data')}
            >
              <Text style={[s.subMenuTabText, panelMode === 'data' && s.subMenuTabTextActive]}>
                {IS_WEB ? 'Details' : 'Data'}
              </Text>
            </Pressable>
          </View>
          <View style={s.subMenuRight}>
            {currentGeo && (
              <View style={[s.statusChip, highAlertCount > 0 ? s.statusDanger : s.statusOk]}>
                <View style={[s.statusDot, { backgroundColor: highAlertCount > 0 ? Colors.highAlert : Colors.success }]} />
                <Text style={s.statusChipText}>
                  {highAlertCount > 0 ? `${highAlertCount} alert${highAlertCount > 1 ? 's' : ''}` : 'Clear'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* -- METRIC ROW (Superset-style KPI cards) ----- */}
        <View style={s.metricRow}>
          <View style={s.metricCard}>
            <Text style={s.metricLabel}>Composite</Text>
            <Text style={s.metricValue}>{overallScore}</Text>
            <Text style={s.metricSuffix}>/ 100</Text>
          </View>
          <View style={s.metricDivider} />
          <View style={s.metricCard}>
            <Text style={s.metricLabel}>Percentile</Text>
            <Text style={s.metricValue}>{avgPercentile}<Text style={s.metricSuper}>th</Text></Text>
            <View style={s.metricBar}>
              <View style={[s.metricBarFill, { width: `${avgPercentile}%` }]} />
            </View>
          </View>
          <View style={s.metricDivider} />
          <View style={s.metricCard}>
            <Text style={s.metricLabel}>Factors</Text>
            <Text style={s.metricValue}>{riskStates.length}</Text>
          </View>
          <View style={s.metricDivider} />
          <View style={s.metricCard}>
            <Text style={s.metricLabel}>Alerts</Text>
            <Text style={[s.metricValue, highAlertCount > 0 && { color: Colors.highAlert }]}>{highAlertCount}</Text>
          </View>
        </View>

        {/* -- MAIN CONTENT -------------------------------- */}
        {panelMode === 'map' ? (
          Platform.OS !== 'web' && MapView ? (
          <View style={s.mapWrap}>
            <MapView
              ref={mapRef}
              style={s.map}
              initialRegion={{
                latitude: location?.latitude ?? mapView.latitude,
                longitude: location?.longitude ?? mapView.longitude,
                latitudeDelta: 10,
                longitudeDelta: 10,
              }}
              onPress={handleMapPress}
              onRegionChangeComplete={handleRegionChange}
              mapType="standard"
              userInterfaceStyle="light"
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
            >
              {currentGeo && (
                <Marker
                  coordinate={{ latitude: currentGeo.latitude, longitude: currentGeo.longitude }}
                  title={currentGeo.name}
                  description={`${currentGeo.county ?? ''}, ${currentGeo.state ?? ''}`}
                />
              )}
              {compareGeos.map((g) => (
                <Marker
                  key={g.fips}
                  coordinate={{ latitude: g.latitude, longitude: g.longitude }}
                  title={g.name}
                  pinColor={Colors.socialVulnerability}
                />
              ))}
            </MapView>
            <View style={s.mapOverlay}>
              <SearchBar />
            </View>
            <View style={s.mapActions}>
              <Pressable style={[s.mapActionBtn, compareMode && s.mapActionBtnActive]} onPress={() => setCompareMode(!compareMode)}>
                <Text style={[s.mapActionText, compareMode && s.mapActionTextActive]}>Compare</Text>
              </Pressable>
            </View>
            {(locationLoading || riskLoading) && (
              <View style={s.loader}>
                <ActivityIndicator color={Colors.accentTeal} size="small" />
                <Text style={s.loaderText}>Loading...</Text>
              </View>
            )}
          </View>
          ) : (
          /* -- WEB: Full Dashboard View (no empty map) -- */
          <ScrollView style={s.dataScroll} contentContainerStyle={s.dataPad} showsVerticalScrollIndicator={false}>
            {/* Search Bar for web — lets user change location */}
            <View style={{ zIndex: 100 }}>
              <SearchBar placeholder="Search county, city, ZIP..." />
            </View>

            {/* Loading indicator while data fetches */}
            {(locationLoading || riskLoading) && (
              <View style={s.webLoading}>
                <ActivityIndicator color={Colors.accentTeal} size="small" />
                <Text style={s.webLoadingText}>Fetching exposure data...</Text>
              </View>
            )}

            {/* 4-Quad Overview */}
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>
                  {currentGeo ? currentGeo.name : 'No Location Selected'}
                </Text>
                <Text style={s.sectionMeta}>
                  {currentGeo ? `${currentGeo.state ?? ''} | FIPS ${currentGeo.fips}` : 'Use search to pick a location'}
                </Text>
              </View>
              <View style={s.quadGrid}>
                <View style={s.quadCell}>
                  <Text style={s.quadLabel}>COMPOSITE</Text>
                  <Text style={[s.quadBigNum, { color: overallScore > 65 ? Colors.highAlert : overallScore > 40 ? Colors.warning : Colors.success }]}>{overallScore}</Text>
                  <View style={s.quadBarTrack}><View style={[s.quadBarFill, { width: `${overallScore}%`, backgroundColor: overallScore > 65 ? Colors.highAlert : overallScore > 40 ? Colors.warning : Colors.success }]} /></View>
                  <Text style={s.quadSub}>of 100</Text>
                </View>
                <View style={s.quadCell}>
                  <Text style={s.quadLabel}>PERCENTILE</Text>
                  <Text style={s.quadBigNum}>{avgPercentile}<Text style={s.quadBigSup}>th</Text></Text>
                  <View style={s.quadBarTrack}><View style={[s.quadBarFill, { width: `${avgPercentile}%`, backgroundColor: Colors.accentTeal }]} /></View>
                  <Text style={s.quadSub}>national</Text>
                </View>
                <View style={s.quadCell}>
                  <Text style={s.quadLabel}>ALERTS</Text>
                  <Text style={[s.quadBigNum, highAlertCount > 0 && { color: Colors.highAlert }]}>{highAlertCount}</Text>
                  <Text style={s.quadSub}>{riskStates.length} factors</Text>
                </View>
                <View style={s.quadCell}>
                  <Text style={s.quadLabel}>TREND</Text>
                  {trendValues.length >= 2 ? (
                    <Sparkline values={trendValues} color={Colors.accentTeal} width={SW / 2 - 56} height={32} />
                  ) : (
                    <Text style={s.quadSub}>No data</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Risk Factor Breakdown */}
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Risk Factor Breakdown</Text>
                <Text style={s.sectionMeta}>{riskStates.length} factors</Text>
              </View>
              <View style={s.cardGrid}>
                {riskStates.map((rs) => (
                  <View key={rs.category} style={s.factorCard}>
                    <View style={s.factorHeader}>
                      <Text style={s.factorName} numberOfLines={1}>{rs.category.replace(/_/g, ' ')}</Text>
                      <View style={[s.tierDot, { backgroundColor: tierColor(rs.tier) }]} />
                    </View>
                    <Text style={s.factorScore}>{rs.score.toFixed(1)}</Text>
                    <View style={s.factorBarTrack}>
                      <View style={[s.factorBarFill, { width: `${rs.percentile ?? 0}%`, backgroundColor: tierColor(rs.tier) }]} />
                    </View>
                    <View style={s.factorFooter}>
                      <Text style={s.factorMeta}>P{rs.percentile ?? 0}</Text>
                      <Text style={[s.factorTier, { color: tierColor(rs.tier) }]}>{rs.tier.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                ))}
                {riskStates.length === 0 && (
                  <View style={s.emptyCard}>
                    <Text style={s.emptyText}>Select a location to view risk factors</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Exposure Profile */}
            {ribbon && ribbon.segments.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>Exposure Profile</Text>
                  <Text style={s.sectionMeta}>{ribbon.segments.length} families</Text>
                </View>
                {ribbon.segments.map((r: any, i: number) => (
                  <View key={i} style={s.expRow}>
                    <View style={[s.expDot, { backgroundColor: Colors.accentTeal }]} />
                    <Text style={s.expName} numberOfLines={1}>{r.family ?? r.label ?? `Exposure ${i + 1}`}</Text>
                    <View style={s.expBarTrack}>
                      <View style={[s.expBarFill, { width: `${Math.min((r.score ?? r.value ?? 50) / 100 * 100, 100)}%` }]} />
                    </View>
                    <Text style={s.expScore}>{(r.score ?? r.value ?? 0).toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Score Distribution */}
            {trendValues.length >= 2 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>Score Distribution</Text>
                </View>
                <MiniBar values={trendValues} color={Colors.accentTeal} height={48} />
                <View style={s.chartLegend}>
                  <Text style={s.chartLabel}>Lower risk</Text>
                  <Text style={s.chartLabel}>Higher risk</Text>
                </View>
              </View>
            )}

            {/* Session Summary */}
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Session Summary</Text>
              </View>
              <View style={s.statGrid}>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{currentGeo ? '1' : '0'}</Text>
                  <Text style={s.statLabel}>Active Geo</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{compareGeos.length}</Text>
                  <Text style={s.statLabel}>Compare Pins</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{Object.keys(CANCER_SITES).length}</Text>
                  <Text style={s.statLabel}>Cancer Sites</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{riskStates.length}</Text>
                  <Text style={s.statLabel}>Risk Factors</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          )
        ) : (
          /* -- DATA VIEW (card grid layout) ------------- */
          <ScrollView style={s.dataScroll} contentContainerStyle={s.dataPad} showsVerticalScrollIndicator={false}>
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Risk Factor Breakdown</Text>
                <Text style={s.sectionMeta}>{riskStates.length} factors</Text>
              </View>
              <View style={s.cardGrid}>
                {riskStates.map((rs) => (
                  <View key={rs.category} style={s.factorCard}>
                    <View style={s.factorHeader}>
                      <Text style={s.factorName} numberOfLines={1}>{rs.category.replace(/_/g, ' ')}</Text>
                      <View style={[s.tierDot, { backgroundColor: tierColor(rs.tier) }]} />
                    </View>
                    <Text style={s.factorScore}>{rs.score.toFixed(1)}</Text>
                    <View style={s.factorBarTrack}>
                      <View style={[s.factorBarFill, { width: `${rs.percentile ?? 0}%`, backgroundColor: tierColor(rs.tier) }]} />
                    </View>
                    <View style={s.factorFooter}>
                      <Text style={s.factorMeta}>P{rs.percentile ?? 0}</Text>
                      <Text style={[s.factorTier, { color: tierColor(rs.tier) }]}>{rs.tier.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                ))}
                {riskStates.length === 0 && (
                  <View style={s.emptyCard}>
                    <Text style={s.emptyText}>Select a location to view risk factors</Text>
                  </View>
                )}
              </View>
            </View>
            {ribbon && ribbon.segments.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>Exposure Profile</Text>
                </View>
                {ribbon.segments.map((r: any, i: number) => (
                  <View key={i} style={s.expRow}>
                    <View style={[s.expDot, { backgroundColor: Colors.accentTeal }]} />
                    <Text style={s.expName} numberOfLines={1}>{r.family ?? r.label ?? `Exposure ${i + 1}`}</Text>
                    <View style={s.expBarTrack}>
                      <View style={[s.expBarFill, { width: `${Math.min((r.score ?? r.value ?? 50) / 100 * 100, 100)}%` }]} />
                    </View>
                    <Text style={s.expScore}>{(r.score ?? r.value ?? 0).toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={s.section}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Session Summary</Text>
              </View>
              <View style={s.statGrid}>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{currentGeo ? '1' : '0'}</Text>
                  <Text style={s.statLabel}>Active Geo</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{compareGeos.length}</Text>
                  <Text style={s.statLabel}>Compare Pins</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{Object.keys(CANCER_SITES).length}</Text>
                  <Text style={s.statLabel}>Cancer Sites</Text>
                </View>
                <View style={s.statCell}>
                  <Text style={s.statValue}>{riskStates.length}</Text>
                  <Text style={s.statLabel}>Risk Factors</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* -- BOTTOM BAR (Superset-style footer actions) -- */}
        <View style={s.bottomBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bottomBarScroll}>
            {riskStates.slice(0, 6).map((rs) => (
              <Pressable
                key={rs.category}
                style={s.bottomTile}
                onPress={() => setEvidencePanelOpen(true)}
              >
                <Text style={s.bottomTileLabel} numberOfLines={1}>
                  {rs.category.replace(/_/g, ' ').substring(0, 10)}
                </Text>
                <Text style={[s.bottomTileVal, { color: tierColor(rs.tier) }]}>{rs.score.toFixed(0)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={s.evidenceBtn} onPress={() => setEvidencePanelOpen(!evidencePanelOpen)}>
            <Text style={s.evidenceBtnText}>Evidence</Text>
          </Pressable>
        </View>

        <EvidenceDrawer />
      </View>
    </SafeAreaView>
  );
}

// -- STYLES (Superset-faithful) --------------------------
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1 },

  // Header � matches Superset StyledHeader / PageHeaderWithActions
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerLeft: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 18, // Superset SubMenu title = 18px fontWeightStrong
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  alertBadge: {
    backgroundColor: Colors.highAlert,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  alertBadgeText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textInverse },
  headerSub: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  siteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceHighlight,
  },
  siteDot: { width: 8, height: 8, borderRadius: 4 },
  siteChipText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },

  // SubMenu � matches Superset SubMenu.tsx horizontal tabs
  subMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  subMenuTabs: { flexDirection: 'row', gap: 4 },
  subMenuTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  subMenuTabActive: {
    backgroundColor: Colors.accentTealBg, // colorPrimaryBgHover
  },
  subMenuTabText: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 12, // fontSizeSM
    color: Colors.textSecondary,
  },
  subMenuTabTextActive: {
    color: Colors.accentTeal,
  },
  subMenuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusDanger: { backgroundColor: Colors.highAlert + '10' },
  statusOk: { backgroundColor: Colors.success + '10' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textSecondary },

  // Metric row � Superset KPI stat cards pattern
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  metricCard: { flex: 1, alignItems: 'center' },
  metricLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  metricValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
  metricSuper: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },
  metricSuffix: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  metricDivider: { width: 1, height: 32, backgroundColor: Colors.borderSubtle },
  metricBar: { width: 44, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 4 },
  metricBarFill: { height: 3, backgroundColor: Colors.accentTeal, borderRadius: 2 },

  // Map
  mapWrap: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: { position: 'absolute', top: 8, left: 16, right: 16, zIndex: 10 },
  mapActions: { position: 'absolute', bottom: 12, right: 12, gap: 4 },
  mapActionBtn: {
    backgroundColor: Colors.surface + 'EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapActionBtnActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  mapActionText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textSecondary },
  mapActionTextActive: { color: Colors.accentTeal },
  loader: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  loaderText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Data view � Superset card grid on colorBgLayout background
  dataScroll: { flex: 1, backgroundColor: Colors.background },
  dataPad: { padding: 16, gap: 16 },

  // Section card � matches Superset Card (Ant Design Card)
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  sectionTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 14, // Superset fontSize (base)
    color: Colors.textPrimary,
  },
  sectionMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textMuted },

  // Factor cards � ListViewCard-like grid items
  cardGrid: { gap: 8 },
  factorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  factorName: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, flex: 1, textTransform: 'capitalize' },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  factorScore: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary },
  factorBarTrack: { height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 6 },
  factorBarFill: { height: 3, borderRadius: 2 },
  factorFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  factorMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  factorTier: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, textTransform: 'capitalize' },

  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted },

  // Exposure rows � Superset data table style
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  expDot: { width: 4, height: 4, borderRadius: 2 },
  expName: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, width: 90 },
  expBarTrack: { flex: 1, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2 },
  expBarFill: { height: 3, backgroundColor: Colors.accentTeal, borderRadius: 2 },
  expScore: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textPrimary, width: 36, textAlign: 'right' },

  // Chart legend
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted },

  // Table rows � Superset ListView table
  tableRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tableCell: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textPrimary, flex: 1 },
  tableCellMono: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textMuted },

  // Stat grid � Superset summary cards
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: {
    width: (SW - 72) / 2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary },
  statLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  // 4-Quadrant overview grid (web dashboard)
  quadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quadCell: {
    width: (SW - 56) / 2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quadLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.8 },
  quadBigNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 28, color: Colors.textPrimary, marginTop: 2 },
  quadBigSup: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  quadBarTrack: { width: '80%', height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginTop: 6 },
  quadBarFill: { height: 3, borderRadius: 2 },
  quadSub: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Web loading state
  webLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  webLoadingText: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Bottom bar � matches Superset footer/action area
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingVertical: 4,
  },
  bottomBarScroll: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  bottomTile: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.sm,
    minWidth: 52,
  },
  bottomTileLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 9, color: Colors.textMuted },
  bottomTileVal: { fontFamily: 'Roboto Mono, monospace', fontSize: 13 },
  evidenceBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  evidenceBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.accentTeal },
});
