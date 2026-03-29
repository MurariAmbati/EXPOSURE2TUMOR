// ============================================================
// Exposure2Tumor — Personal Data Service
// Health journal, exposure diary, family history, field collection
// ============================================================

import type {
  HealthEvent,
  HealthEventCategory,
  ExposureDiaryEntry,
  ExposureDiaryCategory,
  FamilyMember,
  PersonalRiskProfile,
  FieldCollectionRecord,
  FieldObservationType,
  DataSnapshot,
  MapAnnotation,
  CancerSite,
  GeoIdentifier,
  RiskState,
  ExposureValue,
} from '../types';

// ---- ID Generation ----
const uid = (): string =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ---- Health Event Journal ----
export function createHealthEvent(
  category: HealthEventCategory,
  title: string,
  description: string,
  date: string,
  opts?: Partial<HealthEvent>,
): HealthEvent {
  const now = new Date().toISOString();
  return {
    id: uid(),
    category,
    title,
    description,
    date,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...opts,
  };
}

export function categorizeHealthEvents(
  events: HealthEvent[],
): Record<HealthEventCategory, HealthEvent[]> {
  const grouped = {} as Record<HealthEventCategory, HealthEvent[]>;
  const cats: HealthEventCategory[] = [
    'diagnosis', 'screening', 'surgery', 'treatment', 'symptom',
    'lab_result', 'medication', 'lifestyle_change', 'environmental_exposure', 'vaccination',
  ];
  cats.forEach((c) => { grouped[c] = []; });
  events.forEach((e) => { grouped[e.category].push(e); });
  return grouped;
}

export function getHealthTimeline(events: HealthEvent[]): HealthEvent[] {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getEventsForDateRange(
  events: HealthEvent[],
  start: string,
  end: string,
): HealthEvent[] {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return events.filter((ev) => {
    const d = new Date(ev.date).getTime();
    return d >= s && d <= e;
  });
}

// ---- Exposure Diary ----
export function createDiaryEntry(
  category: ExposureDiaryCategory,
  title: string,
  description: string,
  date: string,
  opts?: Partial<ExposureDiaryEntry>,
): ExposureDiaryEntry {
  return {
    id: uid(),
    category,
    title,
    description,
    date,
    tags: [],
    createdAt: new Date().toISOString(),
    ...opts,
  };
}

export function getDiaryStreak(entries: ExposureDiaryEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = [...new Set(entries.map((e) => e.date.split('T')[0]))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff <= 1) streak++;
    else break;
  }
  return streak;
}

export function getDiaryInsights(
  entries: ExposureDiaryEntry[],
): Array<{ category: ExposureDiaryCategory; count: number; avgIntensity: string }> {
  const map = new Map<ExposureDiaryCategory, { count: number; intensities: string[] }>();
  entries.forEach((e) => {
    const cur = map.get(e.category) || { count: 0, intensities: [] };
    cur.count++;
    if (e.intensity) cur.intensities.push(e.intensity);
    map.set(e.category, cur);
  });
  return Array.from(map.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    avgIntensity: getModeIntensity(data.intensities),
  }));
}

function getModeIntensity(intensities: string[]): string {
  if (intensities.length === 0) return 'unknown';
  const counts: Record<string, number> = {};
  intensities.forEach((i) => { counts[i] = (counts[i] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ---- Family History ----
export function createFamilyMember(
  relation: FamilyMember['relation'],
  cancerSites: CancerSite[],
  opts?: Partial<FamilyMember>,
): FamilyMember {
  return {
    id: uid(),
    relation,
    cancerSites,
    otherConditions: [],
    deceased: false,
    createdAt: new Date().toISOString(),
    ...opts,
  };
}

export function computeFamilyRiskFactor(
  members: FamilyMember[],
  site: CancerSite,
): { factor: number; firstDegreeCount: number; totalCount: number } {
  const firstDegree = ['mother', 'father', 'sister', 'brother', 'child'];
  const siteMembers = members.filter((m) => m.cancerSites.includes(site));
  const firstDegreeCount = siteMembers.filter((m) => firstDegree.includes(m.relation)).length;
  const totalCount = siteMembers.length;
  // Simplified relative risk multiplier
  let factor = 1.0;
  if (firstDegreeCount >= 2) factor = 3.0;
  else if (firstDegreeCount === 1) factor = 1.8;
  else if (totalCount > 0) factor = 1.3;
  return { factor, firstDegreeCount, totalCount };
}

// ---- Personal Risk Profile ----
export function computePersonalRiskScores(
  profile: Omit<PersonalRiskProfile, 'personalRiskScores' | 'id' | 'userId' | 'lastUpdated'>,
): Record<CancerSite, number> {
  const sites: CancerSite[] = [
    'lung', 'breast', 'colorectal', 'melanoma', 'liver',
    'cervical', 'prostate', 'pancreatic', 'kidney', 'bladder', 'oral',
  ];
  const scores = {} as Record<CancerSite, number>;
  sites.forEach((site) => {
    let score = 50; // baseline
    // Age adjustment
    if (profile.age > 65) score += 15;
    else if (profile.age > 50) score += 8;
    // Smoking
    if (profile.smokingStatus === 'current') {
      score += site === 'lung' ? 30 : site === 'bladder' ? 15 : 10;
    } else if (profile.smokingStatus === 'former') {
      score += site === 'lung' ? 15 : 5;
    }
    // BMI
    if (profile.bmi && profile.bmi > 30) {
      score += ['colorectal', 'liver', 'kidney', 'pancreatic', 'breast'].includes(site) ? 10 : 3;
    }
    // Alcohol
    if (profile.alcoholUsePerWeek && profile.alcoholUsePerWeek > 14) {
      score += site === 'liver' ? 20 : site === 'oral' ? 15 : 5;
    }
    // Physical activity (protective)
    if (profile.physicalActivityMinPerWeek && profile.physicalActivityMinPerWeek >= 150) {
      score -= 5;
    }
    // Family history
    const fam = computeFamilyRiskFactor(profile.familyMembers, site);
    score = Math.round(score * fam.factor);
    // Occupational
    if (profile.occupationalExposures.length > 0) {
      score += Math.min(profile.occupationalExposures.length * 3, 15);
    }
    scores[site] = Math.max(0, Math.min(100, score));
  });
  return scores;
}

// ---- Field Collection ----
export function createFieldRecord(
  type: FieldObservationType,
  title: string,
  description: string,
  location: { latitude: number; longitude: number },
  opts?: Partial<FieldCollectionRecord>,
): FieldCollectionRecord {
  const now = new Date().toISOString();
  return {
    id: uid(),
    type,
    title,
    description,
    date: now,
    location,
    photoUris: [],
    measurements: [],
    tags: [],
    submittedToServer: false,
    createdAt: now,
    updatedAt: now,
    ...opts,
  };
}

export function getFieldStats(records: FieldCollectionRecord[]): {
  totalRecords: number;
  byType: Record<string, number>;
  totalMeasurements: number;
  totalPhotos: number;
  uniqueLocations: number;
  pendingSync: number;
} {
  const byType: Record<string, number> = {};
  let totalMeasurements = 0;
  let totalPhotos = 0;
  let pendingSync = 0;
  const locations = new Set<string>();
  records.forEach((r) => {
    byType[r.type] = (byType[r.type] || 0) + 1;
    totalMeasurements += r.measurements.length;
    totalPhotos += r.photoUris.length;
    if (!r.submittedToServer) pendingSync++;
    locations.add(`${r.location.latitude.toFixed(4)},${r.location.longitude.toFixed(4)}`);
  });
  return {
    totalRecords: records.length,
    byType,
    totalMeasurements,
    totalPhotos,
    uniqueLocations: locations.size,
    pendingSync,
  };
}

// ---- Data Snapshots ----
export function createDataSnapshot(
  geo: GeoIdentifier,
  cancerSite: CancerSite,
  riskStates: RiskState[],
  exposureValues: ExposureValue[],
  note?: string,
  autoGenerated = false,
): DataSnapshot {
  return {
    id: uid(),
    geoId: geo.fips,
    geoName: geo.name,
    cancerSite,
    snapshotDate: new Date().toISOString(),
    riskStates: [...riskStates],
    exposureValues: [...exposureValues],
    note,
    autoGenerated,
    createdAt: new Date().toISOString(),
  };
}

export function compareSnapshots(
  a: DataSnapshot,
  b: DataSnapshot,
): Array<{ category: string; oldScore: number; newScore: number; delta: number }> {
  const changes: Array<{ category: string; oldScore: number; newScore: number; delta: number }> = [];
  a.riskStates.forEach((rsA) => {
    const rsB = b.riskStates.find((r) => r.category === rsA.category);
    if (rsB) {
      changes.push({
        category: rsA.category,
        oldScore: rsA.score,
        newScore: rsB.score,
        delta: rsB.score - rsA.score,
      });
    }
  });
  return changes;
}

// ---- Map Annotations ----
export function createMapAnnotation(
  latitude: number,
  longitude: number,
  title: string,
  description: string,
  category: MapAnnotation['category'],
  opts?: Partial<MapAnnotation>,
): MapAnnotation {
  const colorMap: Record<MapAnnotation['category'], string> = {
    note: '#14B8A6',
    hazard: '#F59E0B',
    resource: '#10B981',
    observation: '#6366F1',
    bookmark: '#EC4899',
  };
  const iconMap: Record<MapAnnotation['category'], string> = {
    note: 'note',
    hazard: 'warning',
    resource: 'hospital',
    observation: 'eye',
    bookmark: 'pin',
  };
  return {
    id: uid(),
    latitude,
    longitude,
    title,
    description,
    color: colorMap[category],
    icon: iconMap[category],
    category,
    createdAt: new Date().toISOString(),
    ...opts,
  };
}
