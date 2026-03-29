// ============================================================
// Exposure2Tumor � Health Journal & Exposure Diary Screen
// Personal health timeline + daily exposure tracking
// ============================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Animated,
  FlatList,
  Switch,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/theme';
import { useAppStore } from '../src/store';
import { SvgIcon, IconName } from '../src/components/SvgIcon';
import type {
  HealthEvent,
  HealthEventCategory,
  ExposureDiaryEntry,
  ExposureDiaryCategory,
  FamilyMember,
  CancerSite,
} from '../src/types';
import {
  createHealthEvent,
  createDiaryEntry,
  createFamilyMember,
  getHealthTimeline,
  getDiaryStreak,
  getDiaryInsights,
  computeFamilyRiskFactor,
} from '../src/services/personalDataService';

const HEALTH_CATS: { key: HealthEventCategory; label: string; icon: string }[] = [
  { key: 'diagnosis', label: 'Diagnosis', icon: 'diagnosis' },
  { key: 'screening', label: 'Screening', icon: 'screening' },
  { key: 'surgery', label: 'Surgery', icon: 'surgery' },
  { key: 'treatment', label: 'Treatment', icon: 'treatment' },
  { key: 'symptom', label: 'Symptom', icon: 'symptom' },
  { key: 'lab_result', label: 'Lab Result', icon: 'lab' },
  { key: 'medication', label: 'Medication', icon: 'medication' },
  { key: 'lifestyle_change', label: 'Lifestyle', icon: 'lifestyle' },
  { key: 'environmental_exposure', label: 'Env. Exposure', icon: 'exposure' },
  { key: 'vaccination', label: 'Vaccination', icon: 'vaccine' },
];

const DIARY_CATS: { key: ExposureDiaryCategory; label: string; icon: string; color: string }[] = [
  { key: 'air_quality', label: 'Air Quality', icon: 'haze', color: '#6366F1' },
  { key: 'water_quality', label: 'Water', icon: 'water', color: '#06B6D4' },
  { key: 'chemical_contact', label: 'Chemicals', icon: 'chemical', color: '#F59E0B' },
  { key: 'radiation', label: 'Radiation', icon: 'radiation', color: '#EF4444' },
  { key: 'diet', label: 'Diet', icon: 'diet', color: '#10B981' },
  { key: 'physical_activity', label: 'Exercise', icon: 'exercise', color: '#14B8A6' },
  { key: 'tobacco', label: 'Tobacco', icon: 'smoking', color: '#78716C' },
  { key: 'alcohol', label: 'Alcohol', icon: 'alcohol', color: '#A855F7' },
  { key: 'occupational', label: 'Work', icon: 'work', color: '#F97316' },
  { key: 'sun_uv', label: 'Sun / UV', icon: 'sun', color: '#FBBF24' },
  { key: 'indoor_environment', label: 'Indoor', icon: 'indoor', color: '#8B5CF6' },
  { key: 'noise', label: 'Noise', icon: 'noise', color: '#EC4899' },
];

const FAMILY_RELATIONS: { key: FamilyMember['relation']; label: string }[] = [
  { key: 'mother', label: 'Mother' },
  { key: 'father', label: 'Father' },
  { key: 'sister', label: 'Sister' },
  { key: 'brother', label: 'Brother' },
  { key: 'maternal_grandmother', label: 'Maternal Grandmother' },
  { key: 'maternal_grandfather', label: 'Maternal Grandfather' },
  { key: 'paternal_grandmother', label: 'Paternal Grandmother' },
  { key: 'paternal_grandfather', label: 'Paternal Grandfather' },
  { key: 'aunt', label: 'Aunt' },
  { key: 'uncle', label: 'Uncle' },
  { key: 'child', label: 'Child' },
];

const CANCER_LABELS: Record<CancerSite, string> = {
  lung: 'Lung', breast: 'Breast', colorectal: 'Colorectal', melanoma: 'Melanoma',
  liver: 'Liver', cervical: 'Cervical', prostate: 'Prostate', pancreatic: 'Pancreatic',
  kidney: 'Kidney', bladder: 'Bladder', oral: 'Oral',
};

type TabId = 'timeline' | 'diary' | 'family';

export default function JournalScreen() {
  const {
    healthEvents, addHealthEvent, removeHealthEvent,
    diaryEntries, addDiaryEntry,
    familyMembers, addFamilyMember, removeFamilyMember,
    activeSite,
  } = useAppStore((s) => ({
    healthEvents: s.healthEvents,
    addHealthEvent: s.addHealthEvent,
    removeHealthEvent: s.removeHealthEvent,
    diaryEntries: s.diaryEntries,
    addDiaryEntry: s.addDiaryEntry,
    familyMembers: s.familyMembers,
    addFamilyMember: s.addFamilyMember,
    removeFamilyMember: s.removeFamilyMember,
    activeSite: s.activeSite,
  }));

  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'health' | 'diary' | 'family'>('health');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState<string>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSeverity, setFormSeverity] = useState<string>('moderate');
  const [formIntensity, setFormIntensity] = useState<string>('moderate');
  const [formRelation, setFormRelation] = useState<string>('mother');
  const [formSites, setFormSites] = useState<CancerSite[]>([]);
  const [formDeceased, setFormDeceased] = useState(false);

  const timeline = useMemo(() => getHealthTimeline(healthEvents), [healthEvents]);
  const streak = useMemo(() => getDiaryStreak(diaryEntries), [diaryEntries]);
  const insights = useMemo(() => getDiaryInsights(diaryEntries), [diaryEntries]);
  const familyRisk = useMemo(
    () => computeFamilyRiskFactor(familyMembers, activeSite),
    [familyMembers, activeSite],
  );

  const openAdd = useCallback((type: 'health' | 'diary' | 'family') => {
    setModalType(type);
    setFormTitle('');
    setFormDesc('');
    setFormCat(type === 'health' ? 'screening' : type === 'diary' ? 'air_quality' : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSites([]);
    setFormDeceased(false);
    setShowAddModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (modalType === 'health' && formTitle.trim()) {
      addHealthEvent(createHealthEvent(
        formCat as HealthEventCategory,
        formTitle.trim(),
        formDesc.trim(),
        formDate,
        { severity: formSeverity as HealthEvent['severity'] },
      ));
    } else if (modalType === 'diary' && formTitle.trim()) {
      addDiaryEntry(createDiaryEntry(
        formCat as ExposureDiaryCategory,
        formTitle.trim(),
        formDesc.trim(),
        formDate,
        { intensity: formIntensity as ExposureDiaryEntry['intensity'] },
      ));
    } else if (modalType === 'family') {
      addFamilyMember(createFamilyMember(
        formRelation as FamilyMember['relation'],
        formSites,
        { deceased: formDeceased, notes: formDesc.trim() || undefined },
      ));
    }
    setShowAddModal(false);
  }, [modalType, formTitle, formDesc, formCat, formDate, formSeverity, formIntensity, formRelation, formSites, formDeceased, addHealthEvent, addDiaryEntry, addFamilyMember]);

  const toggleSite = useCallback((site: CancerSite) => {
    setFormSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site],
    );
  }, []);

  // ---- Tab Bar ----
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'timeline', label: 'Timeline', icon: 'clipboard' },
    { id: 'diary', label: 'Diary', icon: 'note' },
    { id: 'family', label: 'Family', icon: 'community' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Journal</Text>
        <Text style={styles.headerSub}>Track events, exposures & family history</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <SvgIcon name={t.icon as IconName} size={16} color={activeTab === t.id ? Colors.accentTeal : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {activeTab === 'timeline' && (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{healthEvents.length}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {healthEvents.filter((e) => e.category === 'screening').length}
                </Text>
                <Text style={styles.statLabel}>Screenings</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {healthEvents.filter((e) => e.severity === 'critical').length}
                </Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>
            </View>

            {/* Add Button */}
            <Pressable style={styles.addBtn} onPress={() => openAdd('health')}>
              <Text style={styles.addBtnIcon}>+</Text>
              <Text style={styles.addBtnText}>Add Health Event</Text>
            </Pressable>

            {/* Timeline */}
            {timeline.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>??</Text>
                <Text style={styles.emptyTitle}>No health events yet</Text>
                <Text style={styles.emptyMsg}>
                  Start tracking your screenings, diagnoses, and health milestones
                </Text>
              </View>
            ) : (
              timeline.map((ev, idx) => (
                <View key={ev.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <SvgIcon name={(HEALTH_CATS.find((c) => c.key === ev.category)?.icon || 'info') as IconName} size={14} color={Colors.accentTeal} />
                  </View>
                  {idx < timeline.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <Text style={styles.timelineTitle}>{ev.title}</Text>
                      <Pressable onPress={() => removeHealthEvent(ev.id)}>
                        <SvgIcon name="close" size={14} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                    <Text style={styles.timelineCategory}>
                      {HEALTH_CATS.find((c) => c.key === ev.category)?.label}
                      {ev.severity && (
                        <Text style={styles.severityBadge}> � {ev.severity}</Text>
                      )}
                    </Text>
                    {ev.description ? (
                      <Text style={styles.timelineDesc}>{ev.description}</Text>
                    ) : null}
                    <Text style={styles.timelineDate}>{ev.date}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'diary' && (
          <>
            {/* Streak + Insights */}
            <View style={styles.streakRow}>
              <View style={styles.streakBox}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>day streak ??</Text>
              </View>
              <View style={styles.streakBox}>
                <Text style={styles.streakNumber}>{diaryEntries.length}</Text>
                <Text style={styles.streakLabel}>total entries</Text>
              </View>
            </View>

            {/* Quick Add Diary */}
            <Pressable style={styles.addBtn} onPress={() => openAdd('diary')}>
              <Text style={styles.addBtnIcon}>+</Text>
              <Text style={styles.addBtnText}>Log Exposure</Text>
            </Pressable>

            {/* Category Grid */}
            <Text style={styles.sectionTitle}>Quick Log</Text>
            <View style={styles.catGrid}>
              {DIARY_CATS.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.catCard, { borderColor: cat.color + '40' }]}
                  onPress={() => {
                    setFormCat(cat.key);
                    setFormTitle(cat.label);
                    openAdd('diary');
                  }}
                >
                  <SvgIcon name={cat.icon as IconName} size={22} color={cat.color} />
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catCount}>
                    {diaryEntries.filter((e) => e.category === cat.key).length}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Insights */}
            {insights.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Exposure Patterns</Text>
                {insights.map((ins) => (
                  <View key={ins.category} style={styles.insightRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <SvgIcon name={(DIARY_CATS.find((c) => c.key === ins.category)?.icon || 'info') as IconName} size={14} color={Colors.textMuted} />
                      <Text style={styles.insightCat}>
                        {DIARY_CATS.find((c) => c.key === ins.category)?.label}
                      </Text>
                    </View>
                    <Text style={styles.insightVal}>
                      {ins.count} entries � avg {ins.avgIntensity}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Recent Entries */}
            {diaryEntries.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Entries</Text>
                {diaryEntries.slice(0, 10).map((entry) => (
                  <View key={entry.id} style={styles.diaryItem}>
                    <SvgIcon name={(DIARY_CATS.find((c) => c.key === entry.category)?.icon || 'info') as IconName} size={16} color={Colors.textMuted} />
                    <View style={styles.diaryContent}>
                      <Text style={styles.diaryTitle}>{entry.title}</Text>
                      {entry.description ? (
                        <Text style={styles.diaryDesc} numberOfLines={1}>{entry.description}</Text>
                      ) : null}
                      <Text style={styles.diaryMeta}>
                        {entry.date.split('T')[0]}
                        {entry.intensity ? ` � ${entry.intensity}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'family' && (
          <>
            {/* Family Risk Summary */}
            <View style={styles.familyRiskBox}>
              <Text style={styles.familyRiskTitle}>
                Family Risk Factor � {CANCER_LABELS[activeSite]}
              </Text>
              <View style={styles.familyRiskRow}>
                <View style={styles.familyRiskItem}>
                  <Text style={styles.familyRiskNum}>{familyRisk.factor.toFixed(1)}�</Text>
                  <Text style={styles.familyRiskLabel}>Risk Multiplier</Text>
                </View>
                <View style={styles.familyRiskItem}>
                  <Text style={styles.familyRiskNum}>{familyRisk.firstDegreeCount}</Text>
                  <Text style={styles.familyRiskLabel}>1st Degree</Text>
                </View>
                <View style={styles.familyRiskItem}>
                  <Text style={styles.familyRiskNum}>{familyRisk.totalCount}</Text>
                  <Text style={styles.familyRiskLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Add Family Member */}
            <Pressable style={styles.addBtn} onPress={() => openAdd('family')}>
              <Text style={styles.addBtnIcon}>+</Text>
              <Text style={styles.addBtnText}>Add Family Member</Text>
            </Pressable>

            {/* Family List */}
            {familyMembers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>????????</Text>
                <Text style={styles.emptyTitle}>No family history recorded</Text>
                <Text style={styles.emptyMsg}>
                  Adding family cancer history helps refine your personal risk estimate
                </Text>
              </View>
            ) : (
              familyMembers.map((fm) => (
                <View key={fm.id} style={styles.familyCard}>
                  <View style={styles.familyCardHeader}>
                    <Text style={styles.familyRelation}>
                      {FAMILY_RELATIONS.find((r) => r.key === fm.relation)?.label || fm.relation}
                    </Text>
                    <Pressable onPress={() => removeFamilyMember(fm.id)}>
                      <Text style={styles.removeBtn}>?</Text>
                    </Pressable>
                  </View>
                  {fm.name && <Text style={styles.familyName}>{fm.name}</Text>}
                  <View style={styles.familySiteTags}>
                    {fm.cancerSites.map((site) => (
                      <View key={site} style={styles.siteTag}>
                        <Text style={styles.siteTagText}>{CANCER_LABELS[site]}</Text>
                      </View>
                    ))}
                    {fm.cancerSites.length === 0 && (
                      <Text style={styles.noSitesText}>No cancer history</Text>
                    )}
                  </View>
                  {fm.ageAtDiagnosis != null && (
                    <Text style={styles.familyMeta}>
                      Diagnosed at age {fm.ageAtDiagnosis}
                    </Text>
                  )}
                  {fm.deceased && (
                    <Text style={styles.familyDeceased}>Deceased</Text>
                  )}
                  {fm.notes && (
                    <Text style={styles.familyNotes}>{fm.notes}</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'health' ? 'Add Health Event' :
                 modalType === 'diary' ? 'Log Exposure' :
                 'Add Family Member'}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>?</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {modalType === 'health' && (
                <>
                  {/* Category selector */}
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.chipRow}>
                    {HEALTH_CATS.map((c) => (
                      <Pressable
                        key={c.key}
                        style={[styles.chip, formCat === c.key && styles.chipActive]}
                        onPress={() => setFormCat(c.key)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><SvgIcon name={c.icon as IconName} size={14} color={formCat === c.key ? Colors.accentTeal : Colors.textMuted} /><Text style={styles.chipText}>{c.label}</Text></View>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="e.g. Annual mammogram"
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="Details..."
                    value={formDesc}
                    onChangeText={setFormDesc}
                    multiline
                  />
                  <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="2026-03-28"
                    value={formDate}
                    onChangeText={setFormDate}
                  />
                  <Text style={styles.fieldLabel}>Severity</Text>
                  <View style={styles.chipRow}>
                    {['minor', 'moderate', 'significant', 'critical'].map((s) => (
                      <Pressable
                        key={s}
                        style={[styles.chip, formSeverity === s && styles.chipActive]}
                        onPress={() => setFormSeverity(s)}
                      >
                        <Text style={styles.chipText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {modalType === 'diary' && (
                <>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.chipRow}>
                    {DIARY_CATS.map((c) => (
                      <Pressable
                        key={c.key}
                        style={[styles.chip, formCat === c.key && styles.chipActive]}
                        onPress={() => setFormCat(c.key)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><SvgIcon name={c.icon as IconName} size={14} color={formCat === c.key ? Colors.accentTeal : Colors.textMuted} /><Text style={styles.chipText}>{c.label}</Text></View>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="e.g. Poor air quality today"
                    value={formTitle}
                    onChangeText={setFormTitle}
                  />
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="What happened..."
                    value={formDesc}
                    onChangeText={setFormDesc}
                    multiline
                  />
                  <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="2026-03-28"
                    value={formDate}
                    onChangeText={setFormDate}
                  />
                  <Text style={styles.fieldLabel}>Intensity</Text>
                  <View style={styles.chipRow}>
                    {['low', 'moderate', 'high', 'extreme'].map((i) => (
                      <Pressable
                        key={i}
                        style={[styles.chip, formIntensity === i && styles.chipActive]}
                        onPress={() => setFormIntensity(i)}
                      >
                        <Text style={styles.chipText}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {modalType === 'family' && (
                <>
                  <Text style={styles.fieldLabel}>Relation</Text>
                  <View style={styles.chipRow}>
                    {FAMILY_RELATIONS.map((r) => (
                      <Pressable
                        key={r.key}
                        style={[styles.chip, formRelation === r.key && styles.chipActive]}
                        onPress={() => setFormRelation(r.key)}
                      >
                        <Text style={styles.chipText}>{r.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.fieldLabel}>Cancer Sites</Text>
                  <View style={styles.chipRow}>
                    {(Object.keys(CANCER_LABELS) as CancerSite[]).map((site) => (
                      <Pressable
                        key={site}
                        style={[styles.chip, formSites.includes(site) && styles.chipActive]}
                        onPress={() => toggleSite(site)}
                      >
                        <Text style={styles.chipText}>{CANCER_LABELS[site]}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="Additional info..."
                    value={formDesc}
                    onChangeText={setFormDesc}
                    multiline
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Deceased</Text>
                    <Switch
                      value={formDeceased}
                      onValueChange={setFormDeceased}
                      trackColor={{ true: Colors.accentTeal + '60', false: Colors.border }}
                      thumbColor={formDeceased ? Colors.accentTeal : Colors.textMuted}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <Pressable
              style={[styles.saveBtn, !formTitle.trim() && modalType !== 'family' && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!formTitle.trim() && modalType !== 'family'}
            >
              <Text style={styles.saveBtnText}>Save</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accentTeal },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  tabLabelActive: { color: Colors.accentTeal, fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const },
  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 100 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 16, color: Colors.accentTeal },
  statLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Add Button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentTealBg,
    borderWidth: 1,
    borderColor: Colors.accentTealBorder,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  addBtnIcon: { fontSize: 20, color: Colors.accentTeal },
  addBtnText: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.accentTeal },

  // Empty
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  emptyMsg: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  // Timeline
  timelineItem: { flexDirection: 'row', marginBottom: 8, minHeight: 60 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotIcon: { fontSize: 14 },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -8,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  timelineCategory: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.accentTeal, marginTop: 2 },
  severityBadge: { color: Colors.warning },
  timelineDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  timelineDate: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  removeBtn: { color: Colors.textMuted, fontSize: 16, padding: 4 },

  // Streak
  streakRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  streakBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakNumber: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.accentTeal },
  streakLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Category Grid
  sectionTitle: {
    fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  catCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  catIcon: { fontSize: 22 },
  catLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary },
  catCount: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Insights
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  insightCat: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
  insightVal: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },

  // Diary items
  diaryItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
    gap: 8,
  },
  diaryIcon: { fontSize: 20, marginTop: 2 },
  diaryContent: { flex: 1 },
  diaryTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  diaryDesc: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  diaryMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Family
  familyRiskBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentTealBorder,
    marginBottom: 12,
  },
  familyRiskTitle: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  familyRiskRow: { flexDirection: 'row', gap: 12 },
  familyRiskItem: { flex: 1, alignItems: 'center' },
  familyRiskNum: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 18, color: Colors.accentTeal },
  familyRiskLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  familyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  familyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  familyRelation: { fontFamily: 'Roboto, sans-serif', fontWeight: '500' as const, fontSize: 14, color: Colors.textPrimary },
  familyName: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  familySiteTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  siteTag: {
    backgroundColor: Colors.accentTealBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  siteTagText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.accentTeal },
  noSitesText: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted },
  familyMeta: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  familyDeceased: { fontFamily: 'Roboto, sans-serif', fontSize: 12, color: Colors.highAlert, marginTop: 2 },
  familyNotes: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    maxHeight: '85%',
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
  modalScroll: { paddingHorizontal: 12, maxHeight: 400 },

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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentTealBg,
    borderColor: Colors.accentTeal,
  },
  chipText: { fontFamily: 'Roboto, sans-serif', fontSize: 13, color: Colors.textSecondary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: { fontFamily: 'Roboto, sans-serif', fontSize: 14, color: Colors.textPrimary },
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
