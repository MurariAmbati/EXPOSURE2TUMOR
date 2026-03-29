// ============================================================
// Exposure2Tumor � Global Search / Command Palette
// Unified search across geo, cancer sites, investigations,
// measures, and quick-navigation shortcuts
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, ALL_SITES, EXPOSURE_FAMILY_LABELS } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import { DATA_SOURCES } from '../src/config/dataSources';
import type { CancerSite, ExposureFamily } from '../src/types';

interface SearchResult {
  id: string;
  type: 'screen' | 'cancer_site' | 'geo_history' | 'geo_favorite' | 'data_source' | 'exposure_family' | 'recent_search';
  title: string;
  subtitle: string;
  route?: string;
  icon: string;
  color?: string;
}

// Static navigation targets
const SCREENS: SearchResult[] = [
  { id: 's_map', type: 'screen', title: 'Command Map', subtitle: 'Map-led exposure intelligence', route: '/', icon: 'map' },
  { id: 's_sites', type: 'screen', title: 'Site Lens', subtitle: 'Cancer site portfolio', route: '/sites', icon: 'microscope' },
  { id: 's_scenarios', type: 'screen', title: 'Scenarios', subtitle: 'What-if modeling engine', route: '/scenarios', icon: 'flask' },
  { id: 's_evidence', type: 'screen', title: 'Evidence Vault', subtitle: 'Data provenance & citations', route: '/evidence', icon: 'document' },
  { id: 's_predictions', type: 'screen', title: 'Predictions', subtitle: 'Risk classification', route: '/predictions', icon: 'target' },
  { id: 's_analytics', type: 'screen', title: 'Analytics', subtitle: 'Trends & correlations', route: '/trends', icon: 'chart' },
  { id: 's_reports', type: 'screen', title: 'Reports', subtitle: 'Community reports & export', route: '/reports', icon: 'clipboard' },
  { id: 's_alerts', type: 'screen', title: 'Alerts', subtitle: 'Watchlists & notifications', route: '/alerts', icon: 'bell' },
  { id: 's_compare', type: 'screen', title: 'Compare', subtitle: 'Multi-geography comparison', route: '/compare', icon: 'compare' },
  { id: 's_community', type: 'screen', title: 'Community', subtitle: 'Community intelligence', route: '/community', icon: 'community' },
  { id: 's_messages', type: 'screen', title: 'Messages', subtitle: 'Investigation threads', route: '/messages', icon: 'message' },
  { id: 's_camera', type: 'screen', title: 'Capture', subtitle: 'Clinical photo evidence', route: '/camera', icon: 'camera' },
  { id: 's_profile', type: 'screen', title: 'Profile', subtitle: 'Settings & preferences', route: '/profile', icon: 'menu' },
];

export default function SearchScreen() {
  const router = useRouter();
  const {
    geoHistory,
    favoriteGeos,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    setCurrentGeo,
    setActiveSite,
  } = useAppStore();

  const [query, setQuery] = useState('');

  // Build full search index
  const allItems = useMemo((): SearchResult[] => {
    const items: SearchResult[] = [...SCREENS];

    // Cancer sites
    ALL_SITES.forEach((siteId) => {
      const site = CANCER_SITES[siteId];
      items.push({
        id: `cs_${siteId}`,
        type: 'cancer_site',
        title: site.label,
        subtitle: `${site.exposureFamilies.length} exposure families - ${site.keyMeasures.length} measures`,
        icon: 'dna',
        color: site.color,
      });
    });

    // Favorite geos
    favoriteGeos.forEach((geo) => {
      items.push({
        id: `fav_${geo.fips}`,
        type: 'geo_favorite',
        title: geo.name,
        subtitle: `Favorite - ${geo.level} - FIPS ${geo.fips}`,
        icon: 'star',
      });
    });

    // Geo history
    geoHistory.slice(0, 10).forEach((geo) => {
      if (!favoriteGeos.find((f) => f.fips === geo.fips)) {
        items.push({
          id: `geo_${geo.fips}`,
          type: 'geo_history',
          title: geo.name,
          subtitle: `Recent - ${geo.level} - FIPS ${geo.fips}`,
          icon: 'location',
        });
      }
    });

    // Exposure families
    (Object.keys(EXPOSURE_FAMILY_LABELS) as ExposureFamily[]).forEach((fam) => {
      items.push({
        id: `ef_${fam}`,
        type: 'exposure_family',
        title: EXPOSURE_FAMILY_LABELS[fam],
        subtitle: 'Exposure family',
        icon: 'flask',
      });
    });

    // Data sources
    Object.values(DATA_SOURCES).forEach((ds) => {
      items.push({
        id: `ds_${ds.id}`,
        type: 'data_source',
        title: ds.name,
        subtitle: `${ds.abbreviation} - ${ds.publisher}`,
        icon: 'document',
      });
    });

    return items;
  }, [geoHistory, favoriteGeos]);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allItems
      .filter((item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, allItems]);

  // Recent searches as results when query is empty
  const recentItems = useMemo((): SearchResult[] => {
    return recentSearches.slice(0, 8).map((s, i) => ({
      id: `recent_${i}`,
      type: 'recent_search',
      title: s,
      subtitle: 'Recent search',
      icon: 'search',
    }));
  }, [recentSearches]);

  const handleSelect = useCallback((item: SearchResult) => {
    Keyboard.dismiss();
    addRecentSearch(item.title);

    if (item.type === 'screen' && item.route) {
      router.push(item.route as any);
    } else if (item.type === 'cancer_site') {
      const siteId = item.id.replace('cs_', '') as CancerSite;
      setActiveSite(siteId);
      router.push('/sites' as any);
    } else if (item.type === 'geo_favorite' || item.type === 'geo_history') {
      const fips = item.id.replace('fav_', '').replace('geo_', '');
      const geo = [...favoriteGeos, ...geoHistory].find((g) => g.fips === fips);
      if (geo) {
        setCurrentGeo(geo);
        router.push('/' as any);
      }
    } else if (item.type === 'data_source') {
      router.push('/evidence' as any);
    } else if (item.type === 'recent_search') {
      setQuery(item.title);
    }
  }, [addRecentSearch, router, setActiveSite, setCurrentGeo, favoriteGeos, geoHistory]);

  const displayList = query.trim() ? results : recentItems;
  const showRecentsHeader = !query.trim() && recentItems.length > 0;

  return (
    <SafeAreaView style={st.safeArea}>
      {/* Search input */}
      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <SvgIcon name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={st.searchInput}
            placeholder="Search screens, locations, cancer sites, data..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            selectionColor={Colors.accentTeal}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <SvgIcon name="close" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent header */}
      {showRecentsHeader && (
        <View style={st.recentHeader}>
          <Text style={st.recentTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearRecentSearches}>
            <Text style={st.clearRecent}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick shortcuts when empty */}
      {!query.trim() && recentItems.length === 0 && (
        <View style={st.quickSection}>
          <Text style={st.quickTitle}>Quick Navigation</Text>
          <View style={st.quickGrid}>
            {SCREENS.slice(0, 8).map((s) => (
              <TouchableOpacity key={s.id} style={st.quickCard} onPress={() => handleSelect(s)}>
                <SvgIcon name={s.icon as IconName} size={22} color={Colors.accentTeal} />
                <Text style={st.quickLabel}>{s.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {favoriteGeos.length > 0 && (
            <>
              <Text style={[st.quickTitle, { marginTop: Spacing.lg }]}>Favorite Locations</Text>
              {favoriteGeos.slice(0, 5).map((geo) => (
                <TouchableOpacity key={geo.fips} style={st.favRow} onPress={() => {
                  setCurrentGeo(geo);
                  router.push('/' as any);
                }}>
                  <SvgIcon name="star" size={16} color={Colors.warning} />
                  <View style={st.favInfo}>
                    <Text style={st.favName}>{geo.name}</Text>
                    <Text style={st.favMeta}>{geo.level} - FIPS {geo.fips}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}

      {/* Results */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={st.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={st.resultRow} onPress={() => handleSelect(item)} activeOpacity={0.6}>
            <SvgIcon name={(item.icon || 'info') as IconName} size={18} color={item.color || Colors.textMuted} />
            <View style={st.resultText}>
              <Text style={st.resultTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={st.resultSub} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            {item.color && <View style={[st.colorDot, { backgroundColor: item.color }]} />}
            <SvgIcon name="arrowRight" size={12} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.trim() ? (
            <View style={st.emptyContainer}>
              <SvgIcon name="search" size={40} color={Colors.textMuted} />
              <Text style={st.emptyTitle}>No results for "{query}"</Text>
              <Text style={st.emptyMsg}>Try a different search term or browse quick navigation above.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 18, color: Colors.textMuted, marginRight: 8 },
  searchInput: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary, flex: 1, height: 48 },
  clearBtn: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, paddingLeft: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  recentTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted },
  clearRecent: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.accentTeal },
  quickSection: { paddingHorizontal: 16, paddingTop: 8 },
  quickTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: {
    width: '23%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  quickIcon: { fontSize: 20, marginBottom: 4 },
  quickLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  favIcon: { fontSize: 16 },
  favInfo: { flex: 1 },
  favName: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
  favMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  listContent: { paddingHorizontal: 16 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  resultIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  resultText: { flex: 1 },
  resultTitle: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
  resultSub: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  resultArrow: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  emptyMsg: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4, maxWidth: 260 },
});
