// ============================================================
// Exposure2Tumor � Profile & Intelligence Passport
// Apache Superset-style settings & data management
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES, ALL_SITES, EXPOSURE_FAMILY_LABELS } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import type { CancerSite, GeographyLevel } from '../src/types';

const _dim = Dimensions.get('window');
const SW = Platform.OS === 'web' ? Math.min(_dim.width, 430) : _dim.width;

const GEO_LEVELS: { label: string; value: GeographyLevel }[] = [
  { label: 'State', value: 'state' },
  { label: 'County', value: 'county' },
  { label: 'Census Tract', value: 'tract' },
  { label: 'ZIP Code', value: 'zcta' },
];

const APP_VERSION = '2.0.0';
const BUILD_NUMBER = '2024.6';

const MORE_LINKS: { route: string; label: string; icon: string; desc: string }[] = [
  { route: '/reports', label: 'Reports', icon: 'grid', desc: 'Generate & export' },
  { route: '/search', label: 'Search', icon: 'searchAlt', desc: 'Location search' },
  { route: '/compare', label: 'Compare', icon: 'compare', desc: 'Side-by-side' },
  { route: '/community', label: 'Community', icon: 'community', desc: 'Shared intel' },
  { route: '/scenarios', label: 'Scenarios', icon: 'flask', desc: 'What-if models' },
  { route: '/evidence', label: 'Evidence', icon: 'evidence', desc: 'Literature' },
  { route: '/predictions', label: 'Predictions', icon: 'bullseye', desc: 'Risk forecast' },
  { route: '/messages', label: 'Messages', icon: 'window', desc: 'Team comms' },
  { route: '/camera', label: 'Capture', icon: 'capture', desc: 'Photo docs' },
  { route: '/journal', label: 'Journal', icon: 'heart', desc: 'Field notes' },
  { route: '/collector', label: 'Collect', icon: 'plus', desc: 'Data entry' },
  { route: '/survey', label: 'Survey', icon: 'menu', desc: 'Questionnaires' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    activeSite,
    setActiveSite,
    geoLevel,
    setGeoLevel,
    investigations,
    scenarios,
    photos,
    predictions,
    messageThreads,
    alerts,
    resetState,
    themeMode,
    setThemeMode,
    favoriteGeos,
    removeFavoriteGeo,
    showConfidenceIntervals: showCI,
    setShowConfidenceIntervals: setShowCI,
    autoFetchOnLocationChange,
    setAutoFetchOnLocationChange,
    notificationsEnabled: notifEnabled,
    setNotificationsEnabled: setNotifEnabled,
    compactMode,
    setCompactMode,
    hasCompletedOnboarding,
    watchlistItems,
    communityReports,
    exportJobs,
    recentSearches,
    clearRecentSearches,
    setCurrentGeo,
    geoHistory,
  } = useAppStore();

  const [displayName, setDisplayName] = useState(user?.name ?? 'Researcher');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) =>
    setExpandedSection((p) => (p === section ? null : section));

  const handleClearData = useCallback(() => {
    Alert.alert('Clear All Data', 'Remove all saved data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          resetState();
          Alert.alert('Done', 'All local data cleared.');
        },
      },
    ]);
  }, [resetState]);

  // -- Computed Stats ------------------------------------
  const totalDataPoints = useMemo(() => {
    return (
      investigations.length +
      scenarios.length +
      photos.length +
      predictions.length +
      messageThreads.length +
      alerts.length +
      watchlistItems.length +
      communityReports.length +
      exportJobs.length +
      favoriteGeos.length
    );
  }, [investigations, scenarios, photos, predictions, messageThreads, alerts, watchlistItems, communityReports, exportJobs, favoriteGeos]);

  const dataStats = [
    { label: 'Investigations', count: investigations.length, icon: 'microscope' },
    { label: 'Scenarios', count: scenarios.length, icon: 'flask' },
    { label: 'Clinical Photos', count: photos.length, icon: 'photo' },
    { label: 'Predictions', count: predictions.length, icon: 'target' },
    { label: 'Message Threads', count: messageThreads.length, icon: 'message' },
    { label: 'Alerts', count: alerts.length, icon: 'warning' },
    { label: 'Watchlist Items', count: watchlistItems.length, icon: 'eye' },
    { label: 'Community Reports', count: communityReports.length, icon: 'chart' },
    { label: 'Export Jobs', count: exportJobs.length, icon: 'upload' },
    { label: 'Favorite Locations', count: favoriteGeos.length, icon: 'star' },
  ];

  // ── Gamification / Achievement System ──
  const achievements = useMemo(() => {
    const list: { id: string; icon: string; title: string; desc: string; unlocked: boolean; progress: number; max: number; xp: number; tier: string }[] = [
      { id: 'first_look', icon: 'eye', title: 'First Look', desc: 'View your first location', unlocked: geoHistory.length >= 1, progress: Math.min(geoHistory.length, 1), max: 1, xp: 10, tier: 'bronze' },
      { id: 'explorer', icon: 'map', title: 'Explorer', desc: 'Investigate 5 different locations', unlocked: geoHistory.length >= 5, progress: Math.min(geoHistory.length, 5), max: 5, xp: 50, tier: 'silver' },
      { id: 'cartographer', icon: 'earth', title: 'Cartographer', desc: 'Explore 20 locations', unlocked: geoHistory.length >= 20, progress: Math.min(geoHistory.length, 20), max: 20, xp: 200, tier: 'gold' },
      { id: 'shutterbug', icon: 'photo', title: 'Shutterbug', desc: 'Capture your first photo', unlocked: photos.length >= 1, progress: Math.min(photos.length, 1), max: 1, xp: 15, tier: 'bronze' },
      { id: 'field_agent', icon: 'search', title: 'Field Agent', desc: 'Take 10 environmental photos', unlocked: photos.length >= 10, progress: Math.min(photos.length, 10), max: 10, xp: 100, tier: 'silver' },
      { id: 'paparazzi', icon: 'camera', title: 'Evidence Master', desc: 'Build a vault of 50 photos', unlocked: photos.length >= 50, progress: Math.min(photos.length, 50), max: 50, xp: 500, tier: 'gold' },
      { id: 'analyst', icon: 'chart', title: 'Analyst', desc: 'Run your first prediction', unlocked: predictions.length >= 1, progress: Math.min(predictions.length, 1), max: 1, xp: 25, tier: 'bronze' },
      { id: 'scientist', icon: 'dna', title: 'Data Scientist', desc: 'Create 5 scenario models', unlocked: scenarios.length >= 5, progress: Math.min(scenarios.length, 5), max: 5, xp: 150, tier: 'silver' },
      { id: 'sentinel', icon: 'shield', title: 'Sentinel', desc: 'Set up 3 watchlist monitors', unlocked: watchlistItems.length >= 3, progress: Math.min(watchlistItems.length, 3), max: 3, xp: 75, tier: 'silver' },
      { id: 'guardian', icon: 'bolt', title: 'Community Guardian', desc: 'Generate 3 community reports', unlocked: communityReports.length >= 3, progress: Math.min(communityReports.length, 3), max: 3, xp: 200, tier: 'gold' },
      { id: 'star_collector', icon: 'star', title: 'Star Collector', desc: 'Save 5 favorite locations', unlocked: favoriteGeos.length >= 5, progress: Math.min(favoriteGeos.length, 5), max: 5, xp: 50, tier: 'silver' },
      { id: 'onboarded', icon: 'graduate', title: 'Certified', desc: 'Complete the onboarding tour', unlocked: hasCompletedOnboarding, progress: hasCompletedOnboarding ? 1 : 0, max: 1, xp: 30, tier: 'bronze' },
    ];
    return list;
  }, [geoHistory.length, photos.length, predictions.length, scenarios.length, watchlistItems.length, communityReports.length, favoriteGeos.length, hasCompletedOnboarding]);

  const totalXP = useMemo(() => achievements.filter(a => a.unlocked).reduce((s, a) => s + a.xp, 0), [achievements]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const xpLevel = totalXP < 50 ? 'Novice' : totalXP < 200 ? 'Researcher' : totalXP < 500 ? 'Specialist' : totalXP < 1000 ? 'Expert' : 'Master';
  const xpLevelNum = totalXP < 50 ? 1 : totalXP < 200 ? 2 : totalXP < 500 ? 3 : totalXP < 1000 ? 4 : 5;
  const nextLevelXP = xpLevelNum === 1 ? 50 : xpLevelNum === 2 ? 200 : xpLevelNum === 3 ? 500 : xpLevelNum === 4 ? 1000 : 1500;
  const xpProgress = Math.min(totalXP / nextLevelXP, 1);

  const kpis = [
    { label: 'TOTAL DATA', value: totalDataPoints.toString(), sub: 'records' },
    { label: 'SITES', value: ALL_SITES.length.toString(), sub: 'configured' },
    { label: 'HISTORY', value: geoHistory.length.toString(), sub: 'locations' },
    { label: 'FAVORITES', value: favoriteGeos.length.toString(), sub: 'saved' },
  ];

  // -- RENDER --------------------------------------------
  return (
    <SafeAreaView style={s.safe}>
      {/* -- Header -------------------------------------- */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>More</Text>
          <Text style={s.headerSub}>All tools · settings · profile</Text>
        </View>
        <View style={s.versionPill}>
          <Text style={s.versionText}>v{APP_VERSION}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
        {/* -- Quick Nav Grid ----------------------------- */}
        <View style={s.navGrid}>
          {MORE_LINKS.map((link) => (
            <Pressable
              key={link.route}
              style={({ pressed }) => [s.navCell, pressed && s.navCellPressed]}
              onPress={() => router.push(link.route as any)}
            >
              <SvgIcon name={link.icon as IconName} size={22} color={Colors.accentTeal} />
              <Text style={s.navLabel}>{link.label}</Text>
              <Text style={s.navDesc}>{link.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* -- Profile Divider --------------------------- */}
        <View style={s.sectionDivider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>PROFILE & SETTINGS</Text>
          <View style={s.dividerLine} />
        </View>

        {/* -- User Card --------------------------------- */}
        <View style={s.userCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[s.statusDot, { backgroundColor: Colors.success }]} />
          </View>
          <View style={s.userInfo}>
            <TextInput
              style={s.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={s.orgInput}
              value={organization}
              onChangeText={setOrganization}
              placeholder="Organization"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={s.userBadge}>
            <Text style={s.userBadgeText}>
              {hasCompletedOnboarding ? 'VERIFIED' : 'NEW'}
            </Text>
          </View>
        </View>

        {/* -- KPI Strip --------------------------------- */}
        <View style={s.kpiRow}>
          {kpis.map((k, i) => (
            <View key={k.label} style={[s.kpiCard, i > 0 && s.kpiCardBorder]}>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiValue}>{k.value}</Text>
              <Text style={s.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>

        {/* -- XP & Level Card ---------------------------- */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Research Level</Text>
            <View style={s.xpPill}><Text style={s.xpPillText}>{totalXP} XP</Text></View>
          </View>
          <View style={s.levelRow}>
            <View style={s.levelBadge}>
              <Text style={s.levelNum}>{xpLevelNum}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.levelName}>{xpLevel}</Text>
                <Text style={s.levelProgress}>{totalXP}/{nextLevelXP} XP</Text>
              </View>
              <View style={s.xpBarBg}><View style={[s.xpBarFill, { width: `${xpProgress * 100}%` }]} /></View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.miniStat}>{unlockedCount}/{achievements.length}</Text>
              <Text style={s.miniStatLabel}>Unlocked</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.miniStat}>{achievements.filter(a => a.tier === 'gold' && a.unlocked).length}</Text>
              <Text style={s.miniStatLabel}>Gold</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.miniStat}>{achievements.filter(a => a.tier === 'silver' && a.unlocked).length}</Text>
              <Text style={s.miniStatLabel}>Silver</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.miniStat}>{achievements.filter(a => a.tier === 'bronze' && a.unlocked).length}</Text>
              <Text style={s.miniStatLabel}>Bronze</Text>
            </View>
          </View>
        </View>

        {/* -- Achievements Grid -------------------------- */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Achievements</Text>
            <Text style={s.cardCount}>{unlockedCount} / {achievements.length}</Text>
          </View>
          <View style={s.achGrid}>
            {achievements.map((ach) => (
              <View key={ach.id} style={[s.achCard, !ach.unlocked && s.achCardLocked]}>
                <SvgIcon name={ach.icon as IconName} size={24} color={ach.unlocked ? Colors.accentTeal : Colors.textDisabled} />
                <Text style={[s.achTitle, !ach.unlocked && s.achTitleLocked]} numberOfLines={1}>{ach.title}</Text>
                <Text style={s.achDesc} numberOfLines={2}>{ach.desc}</Text>
                <View style={s.achBarBg}><View style={[s.achBarFill, { width: `${(ach.progress / ach.max) * 100}%`, backgroundColor: ach.tier === 'gold' ? '#FFD700' : ach.tier === 'silver' ? '#C0C0C0' : '#CD7F32' }]} /></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.achXP}>{ach.unlocked ? <SvgIcon name="check" size={12} color={Colors.success} /> : `${ach.progress}/${ach.max}`}</Text>
                  <Text style={[s.achTier, { color: ach.tier === 'gold' ? '#FFD700' : ach.tier === 'silver' ? '#A0A0A0' : '#CD7F32' }]}>{ach.xp}xp</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* -- Data Inventory ---------------------------- */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Data Inventory</Text>
            <Text style={s.cardCount}>{totalDataPoints} total</Text>
          </View>
          {dataStats.map((stat, i) => (
            <View key={stat.label} style={[s.statRow, i === dataStats.length - 1 && { borderBottomWidth: 0 }]}>
              <SvgIcon name={stat.icon as IconName} size={12} color={Colors.textMuted} />
              <Text style={s.statLabel}>{stat.label}</Text>
              <View style={s.statBarBg}>
                <View
                  style={[
                    s.statBarFill,
                    {
                      width: `${totalDataPoints > 0 ? Math.max((stat.count / totalDataPoints) * 100, 2) : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={s.statCount}>{stat.count}</Text>
            </View>
          ))}
        </View>

        {/* -- Default Cancer Site ----------------------- */}
        <Pressable style={s.card} onPress={() => toggleSection('cancer_site')}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Default Cancer Site</Text>
            <View style={s.chipActive}>
              <View style={[s.chipDot, { backgroundColor: CANCER_SITES[activeSite].color }]} />
              <Text style={s.chipText}>{CANCER_SITES[activeSite].shortLabel}</Text>
            </View>
          </View>
          {expandedSection === 'cancer_site' && (
            <View style={s.expandBody}>
              {ALL_SITES.map((siteId) => {
                const site = CANCER_SITES[siteId];
                const active = activeSite === siteId;
                return (
                  <Pressable key={siteId} style={[s.optRow, active && s.optRowActive]} onPress={() => setActiveSite(siteId)}>
                    <View style={[s.optDot, { backgroundColor: site.color }]} />
                    <Text style={[s.optLabel, active && s.optLabelActive]}>{site.label}</Text>
                    {active && <Text style={s.check}>?</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Pressable>

        {/* -- Geography Level --------------------------- */}
        <Pressable style={s.card} onPress={() => toggleSection('geo_level')}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Geography Level</Text>
            <View style={s.chipActive}>
              <Text style={s.chipText}>{geoLevel.toUpperCase()}</Text>
            </View>
          </View>
          {expandedSection === 'geo_level' && (
            <View style={s.expandBody}>
              {GEO_LEVELS.map((l) => {
                const active = geoLevel === l.value;
                return (
                  <Pressable key={l.value} style={[s.optRow, active && s.optRowActive]} onPress={() => setGeoLevel(l.value)}>
                    <Text style={[s.optLabel, active && s.optLabelActive]}>{l.label}</Text>
                    {active && <Text style={s.check}>?</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Pressable>

        {/* -- Display Settings -------------------------- */}
        <View style={s.card}>
          <Text style={s.cardTitleStatic}>Display Settings</Text>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Confidence Intervals</Text>
              <Text style={s.toggleHint}>Show CI bands on charts</Text>
            </View>
            <Switch value={showCI} onValueChange={setShowCI} trackColor={{ false: Colors.border, true: Colors.accentTeal + '40' }} thumbColor={showCI ? Colors.accentTeal : Colors.textMuted} />
          </View>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Compact Mode</Text>
              <Text style={s.toggleHint}>Reduce card height & spacing</Text>
            </View>
            <Switch value={compactMode} onValueChange={setCompactMode} trackColor={{ false: Colors.border, true: Colors.accentTeal + '40' }} thumbColor={compactMode ? Colors.accentTeal : Colors.textMuted} />
          </View>
        </View>

        {/* -- Theme ------------------------------------- */}
        <View style={s.card}>
          <Text style={s.cardTitleStatic}>Theme</Text>
          <View style={s.themeRow}>
            {(['dark', 'light', 'system'] as const).map((m) => (
              <Pressable key={m} style={[s.themeBtn, themeMode === m && s.themeBtnActive]} onPress={() => setThemeMode(m)}>
                <Text style={[s.themeBtnText, themeMode === m && s.themeBtnTextActive]}>
                  {m === 'dark' ? '?' : m === 'light' ? '?' : '?'} {m.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* -- Favorites --------------------------------- */}
        <Pressable style={s.card} onPress={() => toggleSection('favorites')}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Favorite Locations</Text>
            <Text style={s.cardCount}>{favoriteGeos.length}</Text>
          </View>
          {expandedSection === 'favorites' && (
            <View style={s.expandBody}>
              {favoriteGeos.length === 0 ? (
                <Text style={s.emptyHint}>Star locations from the map to save them here.</Text>
              ) : (
                favoriteGeos.map((geo) => (
                  <View key={geo.fips} style={s.favRow}>
                    <Pressable style={{ flex: 1 }} onPress={() => setCurrentGeo(geo)}>
                      <Text style={s.favName}>{geo.name}</Text>
                      <Text style={s.favMeta}>{geo.level} � FIPS {geo.fips}</Text>
                    </Pressable>
                    <Pressable onPress={() => removeFavoriteGeo(geo.fips)} hitSlop={8}>
                      <Text style={s.removeBtn}>?</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </Pressable>

        {/* -- Location History --------------------------- */}
        <Pressable style={s.card} onPress={() => toggleSection('history')}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Location History</Text>
            <Text style={s.cardCount}>{geoHistory.length}</Text>
          </View>
          {expandedSection === 'history' && (
            <View style={s.expandBody}>
              {geoHistory.slice(0, 10).map((geo, i) => (
                <Pressable key={`${geo.fips}_${i}`} style={s.optRow} onPress={() => setCurrentGeo(geo)}>
                  <Text style={s.optLabel}>{geo.name}</Text>
                  <Text style={s.histMeta}>{geo.level}</Text>
                </Pressable>
              ))}
              {geoHistory.length === 0 && <Text style={s.emptyHint}>Search for a location to build history.</Text>}
            </View>
          )}
        </Pressable>

        {/* -- Recent Searches --------------------------- */}
        {recentSearches.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitleStatic}>Recent Searches</Text>
              <Pressable onPress={clearRecentSearches}>
                <Text style={s.clearLink}>Clear</Text>
              </Pressable>
            </View>
            <View style={s.tagWrap}>
              {recentSearches.slice(0, 12).map((q, i) => (
                <View key={i} style={s.tag}>
                  <Text style={s.tagText}>{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* -- Data & Notifications ---------------------- */}
        <View style={s.card}>
          <Text style={s.cardTitleStatic}>Data & Notifications</Text>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Auto-fetch on Location</Text>
              <Text style={s.toggleHint}>Automatically load data when location changes</Text>
            </View>
            <Switch value={autoFetchOnLocationChange} onValueChange={setAutoFetchOnLocationChange} trackColor={{ false: Colors.border, true: Colors.accentTeal + '40' }} thumbColor={autoFetchOnLocationChange ? Colors.accentTeal : Colors.textMuted} />
          </View>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Push Notifications</Text>
              <Text style={s.toggleHint}>Receive risk alert updates</Text>
            </View>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ false: Colors.border, true: Colors.accentTeal + '40' }} thumbColor={notifEnabled ? Colors.accentTeal : Colors.textMuted} />
          </View>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Risk Alerts</Text>
              <Text style={s.toggleHint}>Background monitoring for watched locations</Text>
            </View>
            <Switch value={alertsEnabled} onValueChange={setAlertsEnabled} trackColor={{ false: Colors.border, true: Colors.accentTeal + '40' }} thumbColor={alertsEnabled ? Colors.accentTeal : Colors.textMuted} />
          </View>
        </View>

        {/* -- Danger Zone ------------------------------- */}
        <View style={[s.card, { borderColor: Colors.highAlert + '30' }]}>
          <Text style={[s.cardTitleStatic, { color: Colors.highAlert }]}>Danger Zone</Text>
          <Pressable style={s.dangerBtn} onPress={handleClearData}>
            <Text style={s.dangerBtnText}>Clear All Local Data</Text>
          </Pressable>
          <Text style={s.dangerHint}>Removes all investigations, scenarios, photos, predictions, and messages.</Text>
        </View>

        {/* -- About ------------------------------------- */}
        <View style={s.card}>
          <Text style={s.cardTitleStatic}>About</Text>
          {[
            ['Version', `${APP_VERSION} (${BUILD_NUMBER})`],
            ['Platform', 'Exposure2Tumor Intelligence'],
            ['Data Sources', '12 federal / public health APIs'],
            ['Cancer Sites', `${ALL_SITES.length} configured`],
            ['Model', 'exposure2tumor-v2.0'],
            ['License', 'Research use only'],
          ].map(([label, value]) => (
            <View key={label} style={s.aboutRow}>
              <Text style={s.aboutLabel}>{label}</Text>
              <Text style={s.aboutValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* -- Legal ------------------------------------- */}
        <View style={s.legalBox}>
          <Text style={s.legalText}>
            Exposure2Tumor is a research intelligence tool. It does not provide medical diagnoses.
            All data is sourced from public health repositories. Consult healthcare professionals for medical decisions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -- STYLES (Superset-faithful) --------------------------
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Navigation Grid — More menu
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  navCell: {
    width: '31%' as any,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  navCellPressed: {
    backgroundColor: Colors.accentTealBg,
    borderColor: Colors.accentTeal,
  },
  navIcon: { fontSize: 22, color: Colors.accentTeal, marginBottom: 4 },
  navLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textPrimary },
  navDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  dividerLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.textMuted, letterSpacing: 1 },

  // Header � Superset StyledHeader pattern
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
  headerLeft: {},
  headerTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  versionPill: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  versionText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },

  scroll: { flex: 1 },
  pad: { padding: 16, paddingBottom: 64, gap: 12 },

  // User card � Superset Card component
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentTealBg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 20, color: Colors.accentTeal },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userInfo: { flex: 1 },
  nameInput: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 4,
  },
  orgInput: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    color: Colors.textSecondary,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  userBadge: {
    backgroundColor: Colors.success + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: 8,
  },
  userBadgeText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.success },

  // KPI strip � Superset metric cards
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  kpiCard: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  kpiCardBorder: { borderLeftWidth: 1, borderLeftColor: Colors.borderSubtle },
  kpiLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted },
  kpiValue: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
  kpiSub: { fontFamily: 'Roboto, sans-serif', fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Card base � Superset Ant Design Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  cardTitleStatic: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  cardCount: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textMuted },

  // Data inventory rows � Superset table rows
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 8,
  },
  statIcon: { fontSize: 12, color: Colors.textMuted, width: 16, textAlign: 'center' },
  statLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, width: 120 },
  statBarBg: { flex: 1, height: 3, backgroundColor: Colors.surfaceHighlight, borderRadius: 2 },
  statBarFill: { height: 3, backgroundColor: Colors.accentTeal + '50', borderRadius: 2 },
  statCount: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary, width: 28, textAlign: 'right' },

  // Chips � Superset badge/tag style
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },

  // Expand body
  expandBody: { marginTop: 8 },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  optRowActive: { backgroundColor: Colors.accentTealBg },
  optDot: { width: 6, height: 6, borderRadius: 3 },
  optLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  optLabelActive: { color: Colors.accentTeal, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },
  check: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.accentTeal },

  // Toggle rows � Superset settings pattern
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  toggleLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
  toggleHint: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Theme buttons � Superset SubMenu tab style
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceElevated,
  },
  themeBtnActive: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  themeBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textMuted },
  themeBtnTextActive: { color: Colors.accentTeal },

  // Favorites
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  favName: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
  favMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  removeBtn: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.highAlert, paddingHorizontal: 8 },
  histMeta: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },

  // Tags � Superset filter/tag chips
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tagText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary },
  clearLink: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.accentTeal },

  // Danger zone � Superset destructive button pattern
  dangerBtn: {
    backgroundColor: Colors.highAlert + '0A',
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.highAlert + '30',
  },
  dangerBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 13, color: Colors.highAlert },
  dangerHint: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  // About � Superset info table
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  aboutLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  aboutValue: { fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: Colors.textSecondary },

  // Legal
  legalBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    padding: 16,
  },
  legalText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, lineHeight: 18, textAlign: 'center' },

  emptyHint: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', paddingVertical: 8 },

  // XP / Level
  xpPill: { backgroundColor: Colors.accentTealBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.accentTealBorder },
  xpPillText: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 12, color: Colors.accentTeal },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentTeal, justifyContent: 'center', alignItems: 'center' },
  levelNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 20, color: Colors.textInverse },
  levelName: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  levelProgress: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  xpBarBg: { height: 6, backgroundColor: Colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: 6, borderRadius: 3, backgroundColor: Colors.accentTeal },
  miniStat: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary },
  miniStatLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  // Achievements
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achCard: { width: '47.5%' as any, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.sm, padding: 12, borderWidth: 1, borderColor: Colors.borderSubtle, gap: 4 },
  achCardLocked: { opacity: 0.55, backgroundColor: Colors.surfaceHighlight },
  achTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 12, color: Colors.textPrimary },
  achTitleLocked: { color: Colors.textMuted },
  achDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, lineHeight: 14 },
  achBarBg: { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  achBarFill: { height: 3, borderRadius: 2 },
  achXP: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.textMuted },
  achTier: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10 },
});
