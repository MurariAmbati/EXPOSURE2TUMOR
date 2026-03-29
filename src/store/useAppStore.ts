// ============================================================
// Exposure2Tumor — Global State Store (Zustand)
// Single-source-of-truth for app state
// ============================================================

import { create } from 'zustand';
import type {
  CancerSite,
  GeoIdentifier,
  GeographyLevel,
  MapViewState,
  MapLayer,
  MapSelection,
  RiskState,
  ExposureRibbonData,
  ScenarioResult,
  Investigation,
  Alert,
  User,
  MessageThread,
  ClinicalPhoto,
  PredictionResult,
  ExposureFamily,
  WatchlistItem,
  TrendAnalysis,
  CommunityReport,
  EnvironmentalEvent,
  ExportJob,
  CohortDefinition,
  HealthEvent,
  ExposureDiaryEntry,
  FamilyMember,
  FieldCollectionRecord,
  MapAnnotation,
  ActivityLogEntry,
  DataSnapshot,
  SurveyResponse,
} from '../types';

interface CommandBarState {
  searchQuery: string;
  selectedSite: CancerSite;
  yearRange: [number, number];
  geographyMode: GeographyLevel;
  modelVersion: string;
}

interface AppState {
  // ---- Auth ----
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // ---- Command Bar ----
  commandBar: CommandBarState;

  // ---- Map ----
  mapView: MapViewState;
  mapLayers: MapLayer[];
  mapSelection: MapSelection | null;
  mapLoading: boolean;

  // ---- Geography ----
  currentGeo: GeoIdentifier | null;
  compareGeos: GeoIdentifier[];
  geoHistory: GeoIdentifier[];

  // ---- Cancer Site ----
  activeSite: CancerSite;
  siteFavorites: CancerSite[];

  // ---- Risk States ----
  riskStates: RiskState[];
  riskStatesLoading: boolean;

  // ---- Exposure Ribbon ----
  exposureRibbon: ExposureRibbonData | null;
  exposureRibbonLoading: boolean;

  // ---- Scenarios ----
  activeScenario: ScenarioResult | null;
  savedScenarios: ScenarioResult[];
  scenarioLoading: boolean;

  // ---- Investigations ----
  investigations: Investigation[];
  activeInvestigation: Investigation | null;

  // ---- Alerts ----
  alerts: Alert[];
  unreadAlertCount: number;

  // ---- Messaging ----
  threads: MessageThread[];
  activeThread: MessageThread | null;
  unreadMessageCount: number;

  // ---- Photos ----
  photos: ClinicalPhoto[];
  selectedPhoto: ClinicalPhoto | null;

  // ---- Predictions ----
  predictions: PredictionResult[];
  activePrediction: PredictionResult | null;

  // ---- Layers / Filters ----
  activeExposureFamilies: ExposureFamily[];
  layerOpacity: Record<string, number>;

  // ---- Watchlist & Alerts (Novel) ----
  watchlistItems: WatchlistItem[];
  environmentalEvents: EnvironmentalEvent[];

  // ---- Analytics (Novel) ----
  trendAnalyses: TrendAnalysis[];
  activeTrendAnalysis: TrendAnalysis | null;

  // ---- Community (Novel) ----
  communityReports: CommunityReport[];
  activeCommunityReport: CommunityReport | null;

  // ---- Export (Novel) ----
  exportJobs: ExportJob[];

  // ---- Cohorts (Novel) ----
  cohortDefinitions: CohortDefinition[];

  // ---- Health Journal ----
  healthEvents: HealthEvent[];
  diaryEntries: ExposureDiaryEntry[];
  familyMembers: FamilyMember[];

  // ---- Field Collection ----
  fieldRecords: FieldCollectionRecord[];
  mapAnnotations: MapAnnotation[];

  // ---- Activity Log ----
  activityLog: ActivityLogEntry[];

  // ---- Data Snapshots ----
  dataSnapshots: DataSnapshot[];

  // ---- Surveys ----
  surveyResponses: SurveyResponse[];
  completedSurveyIds: string[];

  // ---- UX / Quality of Life ----
  hasCompletedOnboarding: boolean;
  themeMode: 'dark' | 'light' | 'system';
  favoriteGeos: GeoIdentifier[];
  recentSearches: string[];
  bookmarkedInvestigations: string[];
  showConfidenceIntervals: boolean;
  autoFetchOnLocationChange: boolean;
  notificationsEnabled: boolean;
  compactMode: boolean;

  // ---- UI ----
  drawerOpen: boolean;
  evidencePanelOpen: boolean;
  bottomSheetExpanded: boolean;
  compareMode: boolean;

  // ---- Actions ----
  setUser: (user: User | null) => void;
  setAuthenticated: (val: boolean) => void;

  setCommandBar: (updates: Partial<CommandBarState>) => void;

  setMapView: (view: Partial<MapViewState>) => void;
  setMapSelection: (sel: MapSelection | null) => void;
  toggleMapLayer: (layerId: string) => void;
  setMapLayerOpacity: (layerId: string, opacity: number) => void;

  setCurrentGeo: (geo: GeoIdentifier | null) => void;
  addCompareGeo: (geo: GeoIdentifier) => void;
  removeCompareGeo: (geoId: string) => void;
  clearCompareGeos: () => void;

  setActiveSite: (site: CancerSite) => void;
  toggleSiteFavorite: (site: CancerSite) => void;

  setRiskStates: (states: RiskState[]) => void;
  setRiskStatesLoading: (val: boolean) => void;

  setExposureRibbon: (data: ExposureRibbonData | null) => void;
  setExposureRibbonLoading: (val: boolean) => void;

  setActiveScenario: (scenario: ScenarioResult | null) => void;
  addSavedScenario: (scenario: ScenarioResult) => void;
  removeScenario: (id: string) => void;

  setInvestigations: (inv: Investigation[]) => void;
  setActiveInvestigation: (inv: Investigation | null) => void;
  addInvestigation: (inv: Investigation) => void;

  setAlerts: (alerts: Alert[]) => void;
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;

  setThreads: (threads: MessageThread[]) => void;
  setActiveThread: (thread: MessageThread | null) => void;
  addThread: (thread: MessageThread) => void;
  addMessageToThread: (threadId: string, message: import('../types').Message) => void;

  addPhoto: (photo: ClinicalPhoto) => void;
  removePhoto: (id: string) => void;
  setSelectedPhoto: (photo: ClinicalPhoto | null) => void;

  setPredictions: (preds: PredictionResult[]) => void;
  setActivePrediction: (pred: PredictionResult | null) => void;
  addPrediction: (pred: PredictionResult) => void;

  addScenario: (scenario: import('../types').Scenario) => void;

  // Geography level shortcut
  geoLevel: GeographyLevel;
  setGeoLevel: (level: GeographyLevel) => void;

  // Aliases for screens
  messageThreads: MessageThread[];
  scenarios: import('../types').Scenario[];

  resetState: () => void;

  // ---- Novel Actions ----
  addWatchlistItem: (item: WatchlistItem) => void;
  updateWatchlistItem: (item: WatchlistItem) => void;
  removeWatchlistItem: (id: string) => void;
  setEnvironmentalEvents: (events: EnvironmentalEvent[]) => void;
  addTrendAnalysis: (t: TrendAnalysis) => void;
  setActiveTrendAnalysis: (t: TrendAnalysis | null) => void;
  addCommunityReport: (r: CommunityReport) => void;
  setActiveCommunityReport: (r: CommunityReport | null) => void;
  addExportJob: (job: ExportJob) => void;
  addCohortDefinition: (c: CohortDefinition) => void;

  toggleExposureFamily: (family: ExposureFamily) => void;
  setDrawerOpen: (val: boolean) => void;
  setEvidencePanelOpen: (val: boolean) => void;
  setBottomSheetExpanded: (val: boolean) => void;
  setCompareMode: (val: boolean) => void;

  // ---- Health Journal Actions ----
  addHealthEvent: (event: HealthEvent) => void;
  removeHealthEvent: (id: string) => void;
  updateHealthEvent: (event: HealthEvent) => void;
  addDiaryEntry: (entry: ExposureDiaryEntry) => void;
  removeDiaryEntry: (id: string) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (member: FamilyMember) => void;

  // ---- Field Collection Actions ----
  addFieldRecord: (record: FieldCollectionRecord) => void;
  removeFieldRecord: (id: string) => void;
  updateFieldRecord: (record: FieldCollectionRecord) => void;
  addMapAnnotation: (annotation: MapAnnotation) => void;
  removeMapAnnotation: (id: string) => void;

  // ---- Activity Log Actions ----
  logActivity: (entry: ActivityLogEntry) => void;
  clearActivityLog: () => void;

  // ---- Data Snapshot Actions ----
  addDataSnapshot: (snapshot: DataSnapshot) => void;
  removeDataSnapshot: (id: string) => void;

  // ---- Survey Actions ----
  addSurveyResponse: (response: SurveyResponse) => void;
  removeSurveyResponse: (id: string) => void;
  markSurveyCompleted: (surveyId: string) => void;

  // ---- UX Actions ----
  completeOnboarding: () => void;
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void;
  addFavoriteGeo: (geo: GeoIdentifier) => void;
  removeFavoriteGeo: (fips: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  toggleBookmarkInvestigation: (id: string) => void;
  setShowConfidenceIntervals: (val: boolean) => void;
  setAutoFetchOnLocationChange: (val: boolean) => void;
  setNotificationsEnabled: (val: boolean) => void;
  setCompactMode: (val: boolean) => void;
}

const DEFAULT_MAP_VIEW: MapViewState = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 4,
  bearing: 0,
  pitch: 0,
};

const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'cancer_burden', name: 'Cancer Burden', family: 'environmental', type: 'choropleth', visible: true, opacity: 0.7, source: 'uscs', geographyLevel: 'county' },
  { id: 'environmental_burden', name: 'Environmental Burden', family: 'environmental', type: 'choropleth', visible: false, opacity: 0.6, source: 'ejscreen', geographyLevel: 'tract' },
  { id: 'social_vulnerability', name: 'Social Vulnerability', family: 'social_structural', type: 'choropleth', visible: false, opacity: 0.6, source: 'svi', geographyLevel: 'tract' },
  { id: 'screening_access', name: 'Screening & Access', family: 'screening_access', type: 'choropleth', visible: false, opacity: 0.6, source: 'places', geographyLevel: 'tract' },
  { id: 'behavioral_risk', name: 'Behavioral Risk', family: 'behavioral', type: 'choropleth', visible: false, opacity: 0.6, source: 'places', geographyLevel: 'county' },
  { id: 'food_access', name: 'Food Access', family: 'food_environment', type: 'choropleth', visible: false, opacity: 0.6, source: 'usda_fara', geographyLevel: 'tract' },
  { id: 'facilities', name: 'Industrial Facilities', family: 'environmental', type: 'point', visible: false, opacity: 0.8, source: 'epa', geographyLevel: 'blockgroup' },
  { id: 'risk_state_composite', name: 'Risk State Composite', family: 'environmental', type: 'heatmap', visible: false, opacity: 0.5, source: 'model', geographyLevel: 'county' },
];

export const useAppStore = create<AppState>((set) => ({
  // ---- Initial State ----
  user: null,
  isAuthenticated: false,
  authLoading: true,

  commandBar: {
    searchQuery: '',
    selectedSite: 'lung',
    yearRange: [2018, 2022],
    geographyMode: 'county',
    modelVersion: 'v1.0',
  },

  mapView: DEFAULT_MAP_VIEW,
  mapLayers: DEFAULT_LAYERS,
  mapSelection: null,
  mapLoading: false,

  currentGeo: null,
  compareGeos: [],
  geoHistory: [],

  activeSite: 'lung',
  siteFavorites: ['lung', 'breast', 'colorectal', 'melanoma'],

  riskStates: [],
  riskStatesLoading: false,

  exposureRibbon: null,
  exposureRibbonLoading: false,

  activeScenario: null,
  savedScenarios: [],
  scenarioLoading: false,

  investigations: [],
  activeInvestigation: null,

  alerts: [],
  unreadAlertCount: 0,

  threads: [],
  activeThread: null,
  unreadMessageCount: 0,

  photos: [],
  selectedPhoto: null,

  predictions: [],
  activePrediction: null,

  activeExposureFamilies: ['environmental', 'behavioral', 'screening_access', 'social_structural'],
  layerOpacity: {},

  watchlistItems: [],
  environmentalEvents: [],
  trendAnalyses: [],
  activeTrendAnalysis: null,
  communityReports: [],
  activeCommunityReport: null,
  exportJobs: [],
  cohortDefinitions: [],

  healthEvents: [],
  diaryEntries: [],
  familyMembers: [],
  fieldRecords: [],
  mapAnnotations: [],
  activityLog: [],
  dataSnapshots: [],
  surveyResponses: [],
  completedSurveyIds: [],

  hasCompletedOnboarding: false,
  themeMode: 'dark',
  favoriteGeos: [],
  recentSearches: [],
  bookmarkedInvestigations: [],
  showConfidenceIntervals: true,
  autoFetchOnLocationChange: true,
  notificationsEnabled: true,
  compactMode: false,

  drawerOpen: false,
  evidencePanelOpen: false,
  bottomSheetExpanded: false,
  compareMode: false,

  // ---- Actions ----
  setUser: (user) => set({ user, isAuthenticated: !!user, authLoading: false }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setCommandBar: (updates) =>
    set((s) => ({ commandBar: { ...s.commandBar, ...updates } })),

  setMapView: (view) =>
    set((s) => ({ mapView: { ...s.mapView, ...view } })),
  setMapSelection: (mapSelection) => set({ mapSelection }),
  toggleMapLayer: (layerId) =>
    set((s) => ({
      mapLayers: s.mapLayers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    })),
  setMapLayerOpacity: (layerId, opacity) =>
    set((s) => ({
      mapLayers: s.mapLayers.map((l) =>
        l.id === layerId ? { ...l, opacity } : l
      ),
    })),

  setCurrentGeo: (geo) =>
    set((s) => ({
      currentGeo: geo,
      geoHistory: geo
        ? [geo, ...s.geoHistory.filter((g) => g.fips !== geo.fips).slice(0, 19)]
        : s.geoHistory,
    })),
  addCompareGeo: (geo) =>
    set((s) => ({
      compareGeos: s.compareGeos.find((g) => g.fips === geo.fips)
        ? s.compareGeos
        : [...s.compareGeos, geo].slice(0, 5),
    })),
  removeCompareGeo: (geoId) =>
    set((s) => ({ compareGeos: s.compareGeos.filter((g) => g.fips !== geoId) })),
  clearCompareGeos: () => set({ compareGeos: [] }),

  setActiveSite: (site) =>
    set((s) => ({ activeSite: site, commandBar: { ...s.commandBar, selectedSite: site } })),
  toggleSiteFavorite: (site) =>
    set((s) => ({
      siteFavorites: s.siteFavorites.includes(site)
        ? s.siteFavorites.filter((f) => f !== site)
        : [...s.siteFavorites, site],
    })),

  setRiskStates: (riskStates) => set({ riskStates, riskStatesLoading: false }),
  setRiskStatesLoading: (riskStatesLoading) => set({ riskStatesLoading }),

  setExposureRibbon: (exposureRibbon) => set({ exposureRibbon, exposureRibbonLoading: false }),
  setExposureRibbonLoading: (exposureRibbonLoading) => set({ exposureRibbonLoading }),

  setActiveScenario: (activeScenario) => set({ activeScenario }),
  addSavedScenario: (scenario) =>
    set((s) => ({ savedScenarios: [...s.savedScenarios, scenario] })),
  removeScenario: (id) =>
    set((s) => ({ savedScenarios: s.savedScenarios.filter((sc) => sc.id !== id) })),

  setInvestigations: (investigations) => set({ investigations }),
  setActiveInvestigation: (activeInvestigation) => set({ activeInvestigation }),
  addInvestigation: (inv) =>
    set((s) => ({ investigations: [...s.investigations, inv] })),

  setAlerts: (alerts) =>
    set({ alerts, unreadAlertCount: alerts.filter((a) => !a.readAt && !a.dismissed).length }),
  dismissAlert: (id) =>
    set((s) => {
      const alerts = s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a));
      return { alerts, unreadAlertCount: alerts.filter((a) => !a.readAt && !a.dismissed).length };
    }),
  markAlertRead: (id) =>
    set((s) => {
      const alerts = s.alerts.map((a) =>
        a.id === id ? { ...a, readAt: new Date().toISOString() } : a
      );
      return { alerts, unreadAlertCount: alerts.filter((a) => !a.readAt && !a.dismissed).length };
    }),

  setThreads: (threads) =>
    set({
      threads,
      messageThreads: threads,
      unreadMessageCount: threads.reduce((n, t) => n + (t.unreadCount ?? 0), 0),
    }),
  setActiveThread: (activeThread) => set({ activeThread }),
  addThread: (thread) =>
    set((s) => {
      const threads = [thread, ...s.threads];
      return { threads, messageThreads: threads };
    }),
  addMessageToThread: (threadId, message) =>
    set((s) => {
      const threads = s.threads.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() }
          : t
      );
      return { threads, messageThreads: threads };
    }),

  addPhoto: (photo) => set((s) => ({ photos: [photo, ...s.photos] })),
  removePhoto: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
  setSelectedPhoto: (selectedPhoto) => set({ selectedPhoto }),

  setPredictions: (predictions) => set({ predictions }),
  setActivePrediction: (activePrediction) => set({ activePrediction }),
  addPrediction: (pred) => set((s) => ({ predictions: [pred, ...s.predictions] })),

  addScenario: (scenario) =>
    set((s) => ({
      scenarios: [...s.scenarios, scenario],
    })),

  geoLevel: 'county',
  setGeoLevel: (level) =>
    set((s) => ({ geoLevel: level, commandBar: { ...s.commandBar, geographyMode: level } })),

  messageThreads: [],
  scenarios: [],

  resetState: () =>
    set({
      investigations: [],
      savedScenarios: [],
      scenarios: [],
      photos: [],
      predictions: [],
      threads: [],
      messageThreads: [],
      alerts: [],
      activeThread: null,
      activeScenario: null,
      activeInvestigation: null,
      selectedPhoto: null,
      activePrediction: null,
      unreadAlertCount: 0,
      unreadMessageCount: 0,
    }),

  toggleExposureFamily: (family) =>
    set((s) => ({
      activeExposureFamilies: s.activeExposureFamilies.includes(family)
        ? s.activeExposureFamilies.filter((f) => f !== family)
        : [...s.activeExposureFamilies, family],
    })),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setEvidencePanelOpen: (evidencePanelOpen) => set({ evidencePanelOpen }),
  setBottomSheetExpanded: (bottomSheetExpanded) => set({ bottomSheetExpanded }),
  setCompareMode: (compareMode) => set({ compareMode }),

  // ---- Health Journal Actions ----
  addHealthEvent: (event) => set((s) => ({ healthEvents: [event, ...s.healthEvents] })),
  removeHealthEvent: (id) => set((s) => ({ healthEvents: s.healthEvents.filter((e) => e.id !== id) })),
  updateHealthEvent: (event) => set((s) => ({
    healthEvents: s.healthEvents.map((e) => e.id === event.id ? event : e),
  })),
  addDiaryEntry: (entry) => set((s) => ({ diaryEntries: [entry, ...s.diaryEntries].slice(0, 500) })),
  removeDiaryEntry: (id) => set((s) => ({ diaryEntries: s.diaryEntries.filter((e) => e.id !== id) })),
  addFamilyMember: (member) => set((s) => ({ familyMembers: [...s.familyMembers, member] })),
  removeFamilyMember: (id) => set((s) => ({ familyMembers: s.familyMembers.filter((m) => m.id !== id) })),
  updateFamilyMember: (member) => set((s) => ({
    familyMembers: s.familyMembers.map((m) => m.id === member.id ? member : m),
  })),

  // ---- Field Collection Actions ----
  addFieldRecord: (record) => set((s) => ({ fieldRecords: [record, ...s.fieldRecords] })),
  removeFieldRecord: (id) => set((s) => ({ fieldRecords: s.fieldRecords.filter((r) => r.id !== id) })),
  updateFieldRecord: (record) => set((s) => ({
    fieldRecords: s.fieldRecords.map((r) => r.id === record.id ? record : r),
  })),
  addMapAnnotation: (annotation) => set((s) => ({ mapAnnotations: [annotation, ...s.mapAnnotations].slice(0, 200) })),
  removeMapAnnotation: (id) => set((s) => ({ mapAnnotations: s.mapAnnotations.filter((a) => a.id !== id) })),

  // ---- Activity Log Actions ----
  logActivity: (entry) => set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 500) })),
  clearActivityLog: () => set({ activityLog: [] }),

  // ---- Data Snapshot Actions ----
  addDataSnapshot: (snapshot) => set((s) => ({ dataSnapshots: [snapshot, ...s.dataSnapshots].slice(0, 100) })),
  removeDataSnapshot: (id) => set((s) => ({ dataSnapshots: s.dataSnapshots.filter((s2) => s2.id !== id) })),

  // ---- Survey Actions ----
  addSurveyResponse: (response) => set((s) => ({ surveyResponses: [response, ...s.surveyResponses].slice(0, 200) })),
  removeSurveyResponse: (id) => set((s) => ({ surveyResponses: s.surveyResponses.filter((r) => r.id !== id) })),
  markSurveyCompleted: (surveyId) => set((s) => ({
    completedSurveyIds: s.completedSurveyIds.includes(surveyId)
      ? s.completedSurveyIds
      : [...s.completedSurveyIds, surveyId],
  })),

  // ---- UX Actions ----
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  setThemeMode: (themeMode) => set({ themeMode }),
  addFavoriteGeo: (geo) =>
    set((s) => ({
      favoriteGeos: s.favoriteGeos.find((g) => g.fips === geo.fips)
        ? s.favoriteGeos
        : [geo, ...s.favoriteGeos].slice(0, 20),
    })),
  removeFavoriteGeo: (fips) =>
    set((s) => ({ favoriteGeos: s.favoriteGeos.filter((g) => g.fips !== fips) })),
  addRecentSearch: (query) =>
    set((s) => ({
      recentSearches: [query, ...s.recentSearches.filter((q) => q !== query)].slice(0, 30),
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),
  toggleBookmarkInvestigation: (id) =>
    set((s) => ({
      bookmarkedInvestigations: s.bookmarkedInvestigations.includes(id)
        ? s.bookmarkedInvestigations.filter((i) => i !== id)
        : [...s.bookmarkedInvestigations, id],
    })),
  setShowConfidenceIntervals: (showConfidenceIntervals) => set({ showConfidenceIntervals }),
  setAutoFetchOnLocationChange: (autoFetchOnLocationChange) => set({ autoFetchOnLocationChange }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setCompactMode: (compactMode) => set({ compactMode }),

  // ---- Novel Actions ----
  addWatchlistItem: (item) => set((s) => ({ watchlistItems: [item, ...s.watchlistItems] })),
  updateWatchlistItem: (item) => set((s) => ({
    watchlistItems: s.watchlistItems.map((w) => w.id === item.id ? item : w),
  })),
  removeWatchlistItem: (id) => set((s) => ({
    watchlistItems: s.watchlistItems.filter((w) => w.id !== id),
  })),
  setEnvironmentalEvents: (environmentalEvents) => set({ environmentalEvents }),
  addTrendAnalysis: (t) => set((s) => ({ trendAnalyses: [t, ...s.trendAnalyses].slice(0, 50) })),
  setActiveTrendAnalysis: (activeTrendAnalysis) => set({ activeTrendAnalysis }),
  addCommunityReport: (r) => set((s) => ({ communityReports: [r, ...s.communityReports].slice(0, 20) })),
  setActiveCommunityReport: (activeCommunityReport) => set({ activeCommunityReport }),
  addExportJob: (job) => set((s) => ({ exportJobs: [job, ...s.exportJobs].slice(0, 50) })),
  addCohortDefinition: (c) => set((s) => ({ cohortDefinitions: [c, ...s.cohortDefinitions] })),
}));
