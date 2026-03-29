// ============================================================
// Exposure2Tumor � Field Data Collector Screen
// Simplified on-the-ground data collection toolkit
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import type {
  FieldCollectionRecord,
  FieldObservationType,
  FieldMeasurement,
} from '../src/types';
import { createFieldRecord, getFieldStats } from '../src/services/personalDataService';

const OBS_TYPES: { key: FieldObservationType; label: string; icon: string; color: string }[] = [
  { key: 'air_quality_observation', label: 'Air Quality', icon: 'haze', color: '#6366F1' },
  { key: 'water_source_check', label: 'Water Check', icon: 'water', color: '#06B6D4' },
  { key: 'industrial_facility_note', label: 'Facility', icon: 'factory', color: '#F97316' },
  { key: 'food_access_survey', label: 'Food Access', icon: 'food', color: '#10B981' },
  { key: 'built_environment', label: 'Built Env.', icon: 'building', color: '#8B5CF6' },
  { key: 'community_resource', label: 'Resource', icon: 'resource', color: '#14B8A6' },
  { key: 'health_event_report', label: 'Health Event', icon: 'health', color: '#EF4444' },
  { key: 'environmental_hazard', label: 'Hazard', icon: 'hazard', color: '#F59E0B' },
  { key: 'screening_site_visit', label: 'Screening Site', icon: 'screening', color: '#EC4899' },
  { key: 'custom', label: 'Custom', icon: 'custom', color: '#78716C' },
];

const PRESET_MEASUREMENTS: Record<string, Array<{ name: string; unit: string }>> = {
  air_quality_observation: [
    { name: 'PM2.5', unit: '�g/m�' },
    { name: 'PM10', unit: '�g/m�' },
    { name: 'AQI', unit: '' },
    { name: 'Ozone', unit: 'ppb' },
  ],
  water_source_check: [
    { name: 'pH', unit: '' },
    { name: 'Turbidity', unit: 'NTU' },
    { name: 'Lead', unit: 'ppb' },
    { name: 'Chlorine', unit: 'mg/L' },
  ],
  industrial_facility_note: [
    { name: 'Distance', unit: 'meters' },
    { name: 'Noise Level', unit: 'dB' },
    { name: 'Odor Rating', unit: '/10' },
  ],
  food_access_survey: [
    { name: 'Fresh Produce Items', unit: 'count' },
    { name: 'Distance to Store', unit: 'miles' },
    { name: 'Price Index', unit: '$/basket' },
  ],
  environmental_hazard: [
    { name: 'Radiation', unit: '�Sv/h' },
    { name: 'Benzene', unit: 'ppb' },
    { name: 'Asbestos Risk', unit: '/10' },
  ],
};

export default function CollectorScreen() {
  const {
    fieldRecords, addFieldRecord, removeFieldRecord,
    currentGeo, mapAnnotations, addMapAnnotation,
  } = useAppStore((s) => ({
    fieldRecords: s.fieldRecords,
    addFieldRecord: s.addFieldRecord,
    removeFieldRecord: s.removeFieldRecord,
    currentGeo: s.currentGeo,
    mapAnnotations: s.mapAnnotations,
    addMapAnnotation: s.addMapAnnotation,
  }));

  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<FieldObservationType | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formWeather, setFormWeather] = useState('');
  const [measurements, setMeasurements] = useState<FieldMeasurement[]>([]);
  const [formTags, setFormTags] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const stats = useMemo(() => getFieldStats(fieldRecords), [fieldRecords]);

  const startCollection = useCallback((type: FieldObservationType) => {
    setSelectedType(type);
    setFormTitle('');
    setFormDesc('');
    setFormWeather('');
    setFormTags('');
    // Pre-populate measurements for this type
    const presets = PRESET_MEASUREMENTS[type];
    if (presets) {
      setMeasurements(presets.map((p) => ({ name: p.name, unit: p.unit, value: 0 })));
    } else {
      setMeasurements([]);
    }
    setShowModal(true);
  }, []);

  const updateMeasurement = useCallback((idx: number, value: string) => {
    setMeasurements((prev) => prev.map((m, i) =>
      i === idx ? { ...m, value: parseFloat(value) || 0 } : m,
    ));
  }, []);

  const addMeasurement = useCallback(() => {
    setMeasurements((prev) => [...prev, { name: '', unit: '', value: 0 }]);
  }, []);

  const updateMeasurementField = useCallback((idx: number, field: 'name' | 'unit', val: string) => {
    setMeasurements((prev) => prev.map((m, i) =>
      i === idx ? { ...m, [field]: val } : m,
    ));
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedType || !formTitle.trim()) return;

    const loc = currentGeo
      ? { latitude: currentGeo.latitude, longitude: currentGeo.longitude }
      : { latitude: 39.8283, longitude: -98.5795 }; // default US center

    const validMeasurements = measurements.filter((m) => m.name.trim());
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean);

    const record = createFieldRecord(
      selectedType,
      formTitle.trim(),
      formDesc.trim(),
      loc,
      {
        geoContext: currentGeo || undefined,
        measurements: validMeasurements,
        tags,
        weather: formWeather.trim() ? { conditions: formWeather.trim() } : undefined,
      },
    );
    addFieldRecord(record);
    setShowModal(false);
  }, [selectedType, formTitle, formDesc, formWeather, formTags, measurements, currentGeo, addFieldRecord]);

  const deleteRecord = useCallback((id: string) => {
    removeFieldRecord(id);
  }, [removeFieldRecord]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Collector</Text>
        <Text style={styles.headerSub}>On-the-ground data collection toolkit</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Stats Dashboard */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.totalRecords}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.totalMeasurements}</Text>
            <Text style={styles.statLabel}>Measurements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.uniqueLocations}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, stats.pendingSync > 0 && { color: Colors.warning }]}>
              {stats.pendingSync}
            </Text>
            <Text style={styles.statLabel}>Pending Sync</Text>
          </View>
        </View>

        {/* Observation Type Grid */}
        <Text style={styles.sectionTitle}>Start New Collection</Text>
        <View style={styles.typeGrid}>
          {OBS_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.typeCard, { borderColor: t.color + '30' }]}
              onPress={() => startCollection(t.key)}
            >
              <SvgIcon name={t.icon as IconName} size={26} color={t.color} />
              <Text style={styles.typeLabel}>{t.label}</Text>
              <Text style={styles.typeCount}>
                {stats.byType[t.key] || 0}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Map Annotations Summary */}
        {mapAnnotations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Map Pins ({mapAnnotations.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pinScroll}>
              {mapAnnotations.map((pin) => (
                <View key={pin.id} style={[styles.pinCard, { borderLeftColor: pin.color }]}>
                  <SvgIcon name={(pin.icon || 'pin') as IconName} size={16} color={pin.color} />
                  <Text style={styles.pinTitle} numberOfLines={1}>{pin.title}</Text>
                  <Text style={styles.pinCat}>{pin.category}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* View toggle */}
        {fieldRecords.length > 0 && (
          <View style={styles.viewToggleRow}>
            <Text style={styles.sectionTitle}>Collected Data</Text>
            <View style={styles.viewToggle}>
              <Pressable
                style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
                onPress={() => setViewMode('grid')}
              >
                <SvgIcon name="grid" size={14} color={viewMode === 'grid' ? Colors.accentTeal : Colors.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <SvgIcon name="menu" size={14} color={viewMode === 'list' ? Colors.accentTeal : Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Records */}
        {fieldRecords.length === 0 ? (
          <View style={styles.emptyBox}>
            <SvgIcon name="clipboard" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No field records yet</Text>
            <Text style={styles.emptyMsg}>
              Tap an observation type above to start collecting data in the field
            </Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.recordGrid}>
            {fieldRecords.map((rec) => {
              const typeInfo = OBS_TYPES.find((t) => t.key === rec.type);
              return (
                <View key={rec.id} style={[styles.recordCard, { borderTopColor: typeInfo?.color || Colors.border }]}>
                  <View style={styles.recordHeader}>
                    <SvgIcon name={(typeInfo?.icon || 'info') as IconName} size={20} color={typeInfo?.color || Colors.textMuted} />
                    <Pressable onPress={() => deleteRecord(rec.id)}>
                      <SvgIcon name="close" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                  <Text style={styles.recordTitle} numberOfLines={1}>{rec.title}</Text>
                  <Text style={styles.recordMeta}>{rec.date.split('T')[0]}</Text>
                  {rec.measurements.length > 0 && (
                    <View style={styles.measBadge}>
                      <Text style={styles.measBadgeText}>
                        {rec.measurements.length} measurements
                      </Text>
                    </View>
                  )}
                  {rec.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {rec.tags.slice(0, 3).map((tag) => (
                        <Text key={tag} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          fieldRecords.map((rec) => {
            const typeInfo = OBS_TYPES.find((t) => t.key === rec.type);
            return (
              <View key={rec.id} style={styles.listItem}>
                <SvgIcon name={(typeInfo?.icon || 'info') as IconName} size={22} color={typeInfo?.color || Colors.textMuted} />
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{rec.title}</Text>
                  <Text style={styles.listMeta}>
                    {typeInfo?.label} � {rec.date.split('T')[0]}
                    {rec.measurements.length > 0 && ` � ${rec.measurements.length} meas.`}
                  </Text>
                  {rec.description ? (
                    <Text style={styles.listDesc} numberOfLines={2}>{rec.description}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => deleteRecord(rec.id)}>
                  <SvgIcon name="close" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Collection Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SvgIcon name={(OBS_TYPES.find((t) => t.key === selectedType)?.icon || 'info') as IconName} size={18} color={Colors.accentTeal} />
                <Text style={styles.modalTitle}>
                  {OBS_TYPES.find((t) => t.key === selectedType)?.label || 'Collection'}
                </Text>
              </View>
              <Pressable onPress={() => setShowModal(false)}>
                <SvgIcon name="close" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
                placeholder="Observation title"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholderTextColor={Colors.textMuted}
                placeholder="Describe what you observed..."
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
              />

              <Text style={styles.fieldLabel}>Weather Conditions</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
                placeholder="e.g. Sunny, 75�F, light wind"
                value={formWeather}
                onChangeText={setFormWeather}
              />

              {/* Measurements */}
              <View style={styles.measHeader}>
                <Text style={styles.fieldLabel}>Measurements</Text>
                <Pressable onPress={addMeasurement}>
                  <Text style={styles.addMeasBtn}>+ Add</Text>
                </Pressable>
              </View>
              {measurements.map((m, idx) => (
                <View key={idx} style={styles.measRow}>
                  <TextInput
                    style={[styles.input, styles.measName]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="Name"
                    value={m.name}
                    onChangeText={(v) => updateMeasurementField(idx, 'name', v)}
                  />
                  <TextInput
                    style={[styles.input, styles.measVal]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="0"
                    value={m.value === 0 ? '' : String(m.value)}
                    onChangeText={(v) => updateMeasurement(idx, v)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.measUnit]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="unit"
                    value={m.unit}
                    onChangeText={(v) => updateMeasurementField(idx, 'unit', v)}
                  />
                </View>
              ))}

              <Text style={styles.fieldLabel}>Tags (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
                placeholder="industrial, high-risk, follow-up"
                value={formTags}
                onChangeText={setFormTags}
              />

              {currentGeo && (
                <View style={styles.geoCtx}>
                  <SvgIcon name="location" size={16} color={Colors.accentTeal} />
                  <Text style={styles.geoCtxText}>
                    {currentGeo.name}{currentGeo.state ? `, ${currentGeo.state}` : ''}
                  </Text>
                </View>
              )}
            </ScrollView>

            <Pressable
              style={[styles.saveBtn, !formTitle.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!formTitle.trim()}
            >
              <Text style={styles.saveBtnText}>Save Record</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 100 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.accentTeal },
  statLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },

  sectionTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  typeCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  typeIcon: { fontSize: 26 },
  typeLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  typeCount: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Map Pins
  pinScroll: { marginBottom: 12 },
  pinCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginRight: 4,
    borderLeftWidth: 3,
    width: 120,
  },
  pinIcon: { fontSize: 16 },
  pinTitle: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textPrimary, marginTop: 2 },
  pinCat: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // View toggle
  viewToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewToggle: { flexDirection: 'row', gap: 2 },
  viewBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewBtnActive: { backgroundColor: Colors.accentTealBg, borderColor: Colors.accentTeal },
  viewBtnText: { color: Colors.textMuted, fontSize: 16 },
  viewBtnTextActive: { color: Colors.accentTeal },

  // Record grid
  recordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  recordCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordIcon: { fontSize: 20 },
  recordTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginTop: 4 },
  recordMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  measBadge: {
    backgroundColor: Colors.accentTealBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  measBadgeText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.accentTeal },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  delBtn: { color: Colors.textMuted, fontSize: 14, padding: 4 },

  // List view
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
    gap: 8,
    alignItems: 'center',
  },
  listIcon: { fontSize: 22 },
  listContent: { flex: 1 },
  listTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  listMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  listDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Empty
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  emptyMsg: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    maxHeight: '88%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalScroll: { paddingHorizontal: 12, maxHeight: 450 },

  fieldLabel: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    padding: 8,
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },

  // Measurement rows
  measHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addMeasBtn: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.accentTeal },
  measRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  measName: { flex: 3 },
  measVal: { flex: 2 },
  measUnit: { flex: 2 },

  geoCtx: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentTealBg,
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginTop: 12,
    gap: 8,
  },
  geoCtxIcon: { fontSize: 16 },
  geoCtxText: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.accentTeal },

  saveBtn: {
    backgroundColor: Colors.accentTeal,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textInverse },
});
