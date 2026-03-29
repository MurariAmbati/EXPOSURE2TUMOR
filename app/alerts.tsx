// ============================================================
// Exposure2Tumor � Alerts & Watchlist Screen
// Risk alerts, threshold monitoring, environmental events
// ============================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../src/theme';
import { useAppStore } from '../src/store';
import { CANCER_SITES } from '../src/config/cancerSites';
import { EXPOSURE_FAMILY_LABELS, EXPOSURE_FAMILY_COLORS } from '../src/config/cancerSites';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import { useRiskStates } from '../src/hooks';
import {
  createWatchlistItem,
  evaluateWatchlistItem,
  generateAlertsFromRiskStates,
  generateEnvironmentalEvents,
  prioritizeAlerts,
} from '../src/services/notificationEngine';
import { WatchlistCard, EnvironmentalEventCard } from '../src/components';
import type { WatchlistItem, EnvironmentalEvent, Alert } from '../src/types';

type AlertTab = 'feed' | 'watchlist' | 'events' | 'settings';

export default function AlertsScreen() {
  const { activeSite, currentGeo } = useAppStore();
  const { riskStates, exposureValues } = useRiskStates(currentGeo, activeSite);
  const siteConfig = CANCER_SITES[activeSite];

  const [activeTab, setActiveTab] = useState<AlertTab>('feed');
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [events, setEvents] = useState<EnvironmentalEvent[]>([]);

  const [newMeasureId, setNewMeasureId] = useState('current_smoking');
  const [newOperator, setNewOperator] = useState<'above' | 'below' | 'change_exceeds'>('above');
  const [newThresholdValue, setNewThresholdValue] = useState('80');

  useEffect(() => {
    if (riskStates.length > 0 && currentGeo && alerts.length === 0) {
      const auto = generateAlertsFromRiskStates(riskStates, currentGeo);
      setAlerts(prioritizeAlerts(auto));
    }
  }, [riskStates, currentGeo]);

  const loadEnvironmentalEvents = useCallback(() => {
    if (!currentGeo) return;
    setLoading(true);
    setTimeout(() => {
      const evts = generateEnvironmentalEvents(currentGeo);
      setEvents(evts);
      const evtAlerts: Alert[] = evts.map((e, i) => ({
        id: `evt_${Date.now()}_${i}`,
        type: 'environmental_event' as const,
        severity: e.severity === 'critical' ? 'critical' as const : e.severity === 'high' ? 'warning' as const : 'info' as const,
        title: `Env: ${e.type.replace(/_/g, ' ')}`,
        description: e.description,
        geoContext: currentGeo,
        createdAt: e.startDate,
        dismissed: false,
      }));
      setAlerts(prev => prioritizeAlerts([...prev, ...evtAlerts]));
      setLoading(false);
    }, 800);
  }, [currentGeo]);

  const addWatchlistItem = useCallback(() => {
    if (!currentGeo) return;
    const thresholds = [{ measureId: newMeasureId, operator: newOperator, value: parseFloat(newThresholdValue) || 80 }];
    const item = createWatchlistItem(currentGeo, activeSite, [newMeasureId], thresholds);
    const evaluated = evaluateWatchlistItem(item, exposureValues);
    setWatchlist(prev => [evaluated, ...prev]);
    if (evaluated.status === 'triggered' || evaluated.status === 'warning') {
      const newAlert: Alert = {
        id: `watch_${Date.now()}`,
        type: 'high_burden',
        severity: evaluated.status === 'triggered' ? 'critical' : 'warning',
        title: `Watchlist: ${item.geoName}`,
        description: `Threshold for ${newMeasureId.replace(/_/g, ' ')} has been ${evaluated.status}`,
        geoContext: currentGeo,
        createdAt: new Date().toISOString(),
        dismissed: false,
      };
      setAlerts(prev => prioritizeAlerts([newAlert, ...prev]));
    }
  }, [newMeasureId, newOperator, newThresholdValue, currentGeo, activeSite, exposureValues]);

  const removeWItem = useCallback((itemId: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== itemId));
  }, []);

  // ── Risk Pulse Monitor ──
  const [pulseActive, setPulseActive] = useState(true);
  const threatData = useMemo(() => {
    const critCount = alerts.filter(a => a.severity === 'critical').length;
    const warnCount = alerts.filter(a => a.severity === 'warning').length;
    const total = alerts.length;
    const level = critCount > 2 ? 'CRITICAL' : critCount > 0 ? 'ELEVATED' : warnCount > 2 ? 'ADVISORY' : total > 0 ? 'GUARDED' : 'NOMINAL';
    const color = level === 'CRITICAL' ? Colors.highAlert : level === 'ELEVATED' ? '#FF6B35' : level === 'ADVISORY' ? Colors.warning : level === 'GUARDED' ? '#4FC3F7' : Colors.success;

    const channels = [
      { id: 'air', label: 'Air', icon: 'wind', signal: 0.3 + Math.random() * 0.5, color: EXPOSURE_FAMILY_COLORS.climate_uv },
      { id: 'water', label: 'Water', icon: 'water', signal: 0.2 + Math.random() * 0.4, color: '#2196F3' },
      { id: 'soil', label: 'Soil', icon: 'rock', signal: 0.1 + Math.random() * 0.3, color: '#795548' },
      { id: 'facility', label: 'Industrial', icon: 'factory', signal: critCount > 0 ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3, color: EXPOSURE_FAMILY_COLORS.occupational },
      { id: 'radiation', label: 'UV/Rad', icon: 'radiation', signal: 0.15 + Math.random() * 0.35, color: EXPOSURE_FAMILY_COLORS.environmental },
      { id: 'bio', label: 'Biological', icon: 'dna', signal: 0.1 + Math.random() * 0.25, color: Colors.success },
    ];

    return { level, color, critCount, warnCount, total, channels };
  }, [alerts]);

  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => {
      const sev: Record<string, number> = { critical: 3, warning: 2, info: 1 };
      return (sev[b.severity] - sev[a.severity]) || b.createdAt.localeCompare(a.createdAt);
    })
  , [alerts]);

  const tabs: { key: AlertTab; label: string; badge?: number }[] = [
    { key: 'feed', label: 'Alert Feed', badge: alerts.filter(a => a.severity === 'critical').length },
    { key: 'watchlist', label: 'Watchlist', badge: watchlist.length },
    { key: 'events', label: 'Events' },
    { key: 'settings', label: 'Config' },
  ];

  const OPS: { key: 'above' | 'below' | 'change_exceeds'; label: string }[] = [
    { key: 'above', label: 'Above' }, { key: 'below', label: 'Below' }, { key: 'change_exceeds', label: 'Change >' },
  ];

  const MEASURES = ['current_smoking','obesity','physical_inactivity','pm25','mammography','colorectal_screening','poverty_rate','uninsured'];

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Alerts</Text>
          {alerts.filter(a => a.severity === 'critical').length > 0 && (
            <View style={s.critBadge}><Text style={s.critText}>{alerts.filter(a => a.severity === 'critical').length} CRITICAL</Text></View>
          )}
        </View>
        <Text style={s.subtitle}>Monitoring � {siteConfig.shortLabel} � {currentGeo?.name ?? 'No location'}</Text>
      </View>
      <View style={s.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && s.tabOn]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[s.tabT, activeTab === tab.key && s.tabTOn]}>{tab.label}</Text>
            {(tab.badge ?? 0) > 0 && <View style={s.badge}><Text style={s.badgeT}>{tab.badge}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.inner}>
        {activeTab === 'feed' && (
          <>
            {/* Risk Pulse Monitor */}
            <View style={[s.pulseCard, { borderColor: threatData.color + '40' }]}>
              <View style={s.pulseHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.pulseDot, { backgroundColor: threatData.color }]} />
                  <Text style={[s.pulseLevel, { color: threatData.color }]}>{threatData.level}</Text>
                </View>
                <Pressable onPress={() => setPulseActive(v => !v)}>
                  <Text style={s.pulseToggle}>{pulseActive ? 'LIVE' : 'PAUSED'}</Text>
                </Pressable>
              </View>
              <Text style={s.pulseLabel}>THREAT ASSESSMENT</Text>
              <View style={s.pulseMeter}>
                <View style={[s.pulseFill, { width: `${Math.min((threatData.critCount * 25 + threatData.warnCount * 10 + threatData.total * 2), 100)}%`, backgroundColor: threatData.color }]} />
              </View>
              <View style={s.pulseStats}>
                <View style={s.pulseStat}><Text style={[s.pulseStatNum, { color: Colors.highAlert }]}>{threatData.critCount}</Text><Text style={s.pulseStatLabel}>Critical</Text></View>
                <View style={s.pulseStatDiv} />
                <View style={s.pulseStat}><Text style={[s.pulseStatNum, { color: Colors.warning }]}>{threatData.warnCount}</Text><Text style={s.pulseStatLabel}>Warning</Text></View>
                <View style={s.pulseStatDiv} />
                <View style={s.pulseStat}><Text style={[s.pulseStatNum, { color: Colors.info }]}>{threatData.total - threatData.critCount - threatData.warnCount}</Text><Text style={s.pulseStatLabel}>Info</Text></View>
                <View style={s.pulseStatDiv} />
                <View style={s.pulseStat}><Text style={s.pulseStatNum}>{watchlist.length}</Text><Text style={s.pulseStatLabel}>Watched</Text></View>
              </View>

              {/* Exposure Channels */}
              <Text style={[s.pulseLabel, { marginTop: 12 }]}>EXPOSURE CHANNELS</Text>
              {threatData.channels.map(ch => (
                <View key={ch.id} style={s.channelRow}>
                  <SvgIcon name={ch.icon as IconName} size={14} color={ch.color} />
                  <Text style={s.channelLabel}>{ch.label}</Text>
                  <View style={s.channelBarBg}>
                    <View style={[s.channelBarFill, { width: `${ch.signal * 100}%`, backgroundColor: ch.signal > 0.7 ? Colors.highAlert : ch.signal > 0.4 ? Colors.warning : ch.color }]} />
                  </View>
                  <Text style={[s.channelVal, { color: ch.signal > 0.7 ? Colors.highAlert : ch.signal > 0.4 ? Colors.warning : Colors.textMuted }]}>{(ch.signal * 100).toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'feed' && (sortedAlerts.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyT}>No alerts yet.</Text></View>
        ) : sortedAlerts.map(al => (
          <View key={al.id} style={[s.card, { borderLeftColor: al.severity === 'critical' ? Colors.highAlert : al.severity === 'warning' ? Colors.warning : Colors.info }]}>
            <View style={s.row}>
              <View style={[s.sevB, { backgroundColor: (al.severity === 'critical' ? Colors.highAlert : al.severity === 'warning' ? Colors.warning : Colors.info) + '20' }]}>
                <Text style={[s.sevT, { color: al.severity === 'critical' ? Colors.highAlert : al.severity === 'warning' ? Colors.warning : Colors.info }]}>{al.severity.toUpperCase()}</Text>
              </View>
              <Text style={s.alType}>{al.type.replace(/_/g, ' ')}</Text>
              <Text style={s.alTime}>{new Date(al.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={s.alTitle}>{al.title}</Text>
            <Text style={s.alDesc}>{al.description}</Text>
          </View>
        )))}

        {activeTab === 'watchlist' && (
          <>
            <Text style={s.secTitle}>Active Watchlist</Text>
            {watchlist.length === 0 ? <View style={s.empty}><Text style={s.emptyT}>No watchlist items. Add one below.</Text></View> :
              watchlist.map(item => <WatchlistCard key={item.id} item={item} onRemove={() => removeWItem(item.id)} />)}
            <View style={s.addCard}>
              <Text style={s.addH}>Add Watchlist Item</Text>
              <Text style={s.label}>Measure</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {MEASURES.map(m => (
                  <TouchableOpacity key={m} style={[s.chip, newMeasureId === m && s.chipOn]} onPress={() => setNewMeasureId(m)}>
                    <Text style={[s.chipT, newMeasureId === m && s.chipTOn]}>{m.replace(/_/g, ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.label}>Operator</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {OPS.map(op => (
                  <TouchableOpacity key={op.key} style={[s.opBtn, newOperator === op.key && s.opOn]} onPress={() => setNewOperator(op.key)}>
                    <Text style={[s.opT, newOperator === op.key && s.opTOn]}>{op.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.label}>Threshold</Text>
              <TextInput style={s.input} value={newThresholdValue} onChangeText={setNewThresholdValue} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
              <TouchableOpacity style={s.addBtn} onPress={addWatchlistItem}><Text style={s.addBtnT}>Add to Watchlist</Text></TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'events' && (
          <>
            <Text style={s.secTitle}>Environmental Events</Text>
            <TouchableOpacity style={s.loadBtn} onPress={loadEnvironmentalEvents}>
              <Text style={s.loadBtnT}>{loading ? 'Loading�' : 'Load Environmental Events'}</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator color={Colors.accentTeal} style={{ marginTop: Spacing.lg }} />}
            {events.map(ev => <EnvironmentalEventCard key={ev.id} event={ev} />)}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <Text style={s.secTitle}>Alert Configuration</Text>
            <View style={s.setCard}>
              <View style={s.setRow}><Text style={s.setL}>Geography</Text><Text style={s.setV}>{currentGeo?.name ?? 'None'}</Text></View>
              <View style={s.setRow}><Text style={s.setL}>Cancer Site</Text><Text style={s.setV}>{siteConfig.label}</Text></View>
              <View style={s.setRow}><Text style={s.setL}>Alerts</Text><Text style={s.setV}>{alerts.length}</Text></View>
              <View style={s.setRow}><Text style={s.setL}>Critical</Text><Text style={[s.setV, { color: Colors.highAlert }]}>{alerts.filter(a => a.severity === 'critical').length}</Text></View>
            </View>
            <TouchableOpacity style={s.clearBtn} onPress={() => { setAlerts([]); setWatchlist([]); setEvents([]); }}>
              <Text style={s.clearBtnT}>Clear All</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  subtitle: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  critBadge: { backgroundColor: Colors.highAlert + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  critText: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.highAlert },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, marginRight: 4, borderRadius: BorderRadius.sm },
  tabOn: { backgroundColor: Colors.accentTealBg, borderWidth: 1, borderColor: Colors.accentTealBorder },
  tabT: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  tabTOn: { color: Colors.accentTeal, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },
  badge: { backgroundColor: Colors.highAlert, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeT: { fontFamily: 'Roboto Mono, monospace', fontSize: 9, color: '#FFF' },
  scroll: { flex: 1 },
  inner: { padding: 16, paddingBottom: 100 },
  secTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  empty: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyT: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sevB: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: BorderRadius.sm },
  sevT: { fontFamily: 'Roboto Mono, monospace', fontSize: 11 },
  alType: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted, flex: 1, textTransform: 'capitalize' },
  alTime: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, color: Colors.textMuted },
  alTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  alDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  addH: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.accentTeal, marginBottom: 8 },
  label: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 11, color: Colors.textSecondary, marginBottom: 4, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, marginRight: 4, borderWidth: 1, borderColor: Colors.border },
  chipOn: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  chipT: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted, textTransform: 'capitalize' },
  chipTOn: { color: Colors.accentTeal },
  opBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  opOn: { borderColor: Colors.accentTeal, backgroundColor: Colors.accentTealBg },
  opT: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textMuted },
  opTOn: { color: Colors.accentTeal },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 12, height: 40, justifyContent: 'center' },
  addBtnT: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  loadBtn: { backgroundColor: Colors.accentTeal, borderRadius: BorderRadius.sm, paddingVertical: 12, alignItems: 'center', marginBottom: 12, height: 40, justifyContent: 'center' },
  loadBtnT: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
  setCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  setL: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textSecondary },
  setV: { fontFamily: 'Roboto Mono, monospace', fontSize: 13, color: Colors.textPrimary },
  clearBtn: { backgroundColor: Colors.highAlert + '15', borderRadius: BorderRadius.sm, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.highAlert + '30', height: 40, justifyContent: 'center' },
  clearBtnT: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.highAlert },

  // Risk Pulse Monitor
  pulseCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  pulseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  pulseLevel: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 16, letterSpacing: 1 },
  pulseToggle: { fontFamily: 'Roboto Mono, monospace', fontSize: 10, color: Colors.success, backgroundColor: Colors.success + '12', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  pulseLabel: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  pulseMeter: { height: 6, backgroundColor: Colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  pulseFill: { height: 6, borderRadius: 3 },
  pulseStats: { flexDirection: 'row', alignItems: 'center' },
  pulseStat: { flex: 1, alignItems: 'center' },
  pulseStatDiv: { width: 1, height: 20, backgroundColor: Colors.borderSubtle },
  pulseStatNum: { fontFamily: 'Roboto Mono, monospace', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  pulseStatLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  channelLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textSecondary, width: 64 },
  channelBarBg: { flex: 1, height: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  channelBarFill: { height: 4, borderRadius: 2 },
  channelVal: { fontFamily: 'Roboto Mono, monospace', fontSize: 11, width: 32, textAlign: 'right' },
});

