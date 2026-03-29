// ============================================================
// Exposure2Tumor — Core Type Definitions
// Cancer Exposure Intelligence Platform
// ============================================================

// ---- Geography Types ----
export type GeographyLevel = 'national' | 'state' | 'county' | 'tract' | 'blockgroup' | 'zcta' | 'place';

export interface GeoIdentifier {
  fips: string;
  level: GeographyLevel;
  name: string;
  state?: string;
  stateFips?: string;
  county?: string;
  countyFips?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

export interface GeoBoundary {
  geoId: string;
  level: GeographyLevel;
  geometry: { type: string; coordinates: any };
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

// ---- Cancer Site Types ----
export type CancerSite =
  | 'lung'
  | 'breast'
  | 'colorectal'
  | 'melanoma'
  | 'liver'
  | 'cervical'
  | 'prostate'
  | 'pancreatic'
  | 'kidney'
  | 'bladder'
  | 'oral';

export interface CancerSiteConfig {
  id: CancerSite;
  label: string;
  shortLabel: string;
  color: string;
  icon: string;
  exposureFamilies: ExposureFamily[];
  keyMeasures: string[];
  description: string;
  evidenceModel: string;
}

// ---- Exposure Family Types ----
export type ExposureFamily =
  | 'environmental'
  | 'behavioral'
  | 'screening_access'
  | 'social_structural'
  | 'occupational'
  | 'climate_uv'
  | 'food_environment';

export interface ExposureMeasure {
  id: string;
  name: string;
  family: ExposureFamily;
  source: DataSource;
  unit: string;
  description: string;
  yearRange: [number, number];
  geographyLevels: GeographyLevel[];
  direction: 'higher_worse' | 'higher_better' | 'neutral';
}

export interface ExposureValue {
  measureId: string;
  geoId: string;
  year: number;
  value: number;
  percentile: number;
  confidence?: [number, number]; // CI lower, upper
  suppressed?: boolean;
  note?: string;
}

// ---- Risk State Types ----
export type RiskStateCategory =
  | 'environmental_burden'
  | 'behavioral_burden'
  | 'preventive_access'
  | 'structural_vulnerability'
  | 'cumulative_cancer_pressure'
  | 'prevention_opportunity';

export interface RiskState {
  category: RiskStateCategory;
  geoId: string;
  cancerSite: CancerSite;
  year: number;
  score: number;           // 0-100 composite
  percentile: number;      // national percentile
  tier: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  confidence: [number, number];
  topDrivers: RiskDriver[];
  trend: TrendDirection;
}

export interface RiskDriver {
  measureId: string;
  name: string;
  family: ExposureFamily;
  contribution: number; // weight / importance
  value: number;
  percentile: number;
  direction: 'increasing_risk' | 'decreasing_risk' | 'neutral';
}

export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'insufficient_data';

// ---- Cancer Burden Types ----
export interface CancerBurden {
  geoId: string;
  cancerSite: CancerSite;
  year: number;
  incidenceRate: number;
  incidenceCount?: number;
  mortalityRate: number;
  mortalityCount?: number;
  lateStagePercent?: number;
  fiveYearSurvival?: number;
  ageAdjusted: boolean;
  source: DataSource;
  percentileNational: number;
  trend: TrendDirection;
}

// ---- Data Source / Provenance Types ----
export interface DataSource {
  id: string;
  name: string;
  abbreviation: string;
  url: string;
  description: string;
  publisher: string;
  vintage: string;             // e.g., "2020-2024"
  releaseDate: string;
  geographyLevels: GeographyLevel[];
  updateFrequency: string;
  limitations: string[];
  citation: string;
  measures?: DataSourceMeasure[];
}

export interface DataSourceMeasure {
  id: string;
  label: string;
  unit: string;
}

export interface ProvenanceEntry {
  measureId: string;
  sourceId: string;
  geography: string;
  year: number;
  methodology: string;
  limitations: string[];
  lastUpdated: string;
  apiEndpoint?: string;
  downloadUrl?: string;
}

// ---- Exposure Ribbon Types ----
export interface ExposureRibbonSegment {
  family: ExposureFamily;
  label: string;
  color: string;
  percentile: number;
  direction: TrendDirection;
  uncertainty: [number, number];
  recency: number; // year of most recent data
  measures: ExposureValue[];
}

export interface ExposureRibbonData {
  geoId: string;
  geoName: string;
  cancerSite: CancerSite;
  segments: ExposureRibbonSegment[];
  overallScore: number;
  overallPercentile: number;
}

// ---- Scenario Engine Types ----
export interface ScenarioParameter {
  measureId: string;
  name: string;
  family: ExposureFamily;
  currentValue: number;
  currentPercentile: number;
  adjustedValue: number;
  adjustedPercentile: number;
  direction: 'increase' | 'decrease';
  magnitude: number; // percentage change
}

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  geoId: string;
  cancerSite: CancerSite;
  parameters: ScenarioParameter[];
  baselineRiskStates: RiskState[];
  projectedRiskStates: RiskState[];
  deltaScores: Record<RiskStateCategory, number>;
  confidence: number;
  createdAt: string;
}

export interface ScenarioOutput {
  projectedRiskStates: RiskState[];
  overallScoreChange: number;
  affectedFamilies: ExposureFamily[];
  confidence: number;
}

export interface Scenario {
  id: string;
  name: string;
  parameters: Array<{ measureId: string; direction: 'increase' | 'decrease'; magnitude: number }>;
  baselineGeo: GeoIdentifier | { level: string; fips: string; name: string };
  result: ScenarioOutput;
  createdAt: string;
}

// ---- Investigation / Saved Views ----
export interface Investigation {
  id: string;
  name: string;
  description: string;
  geoIds: string[];
  cancerSites: CancerSite[];
  layers: ExposureFamily[];
  filters: Record<string, unknown>;
  scenarios: ScenarioResult[];
  notes: InvestigationNote[];
  createdAt: string;
  updatedAt: string;
  shared: boolean;
}

export interface InvestigationNote {
  id: string;
  content: string;
  attachments: string[];
  createdAt: string;
  author: string;
}

// ---- Messaging Types ----
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments: MessageAttachment[];
  geoContext?: GeoIdentifier;
  cancerSiteContext?: CancerSite;
  investigationRef?: string;
  createdAt: string;
  readAt?: string;
  type: 'text' | 'alert' | 'investigation_share' | 'data_update' | 'system';
}

export interface MessageThread {
  id: string;
  participants: string[];
  title: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  investigationId?: string;
  geoContext?: GeoIdentifier;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'investigation' | 'map_snapshot' | 'chart';
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

// ---- Clinical Photo Types ----
export interface ClinicalPhoto {
  id: string;
  uri: string;
  thumbnailUri?: string;
  capturedAt: string;
  captureDate?: string;
  bodyRegion?: string;
  geoContext?: GeoIdentifier;
  cancerSiteContext?: CancerSite;
  siteId?: CancerSite;
  notes: string;
  tags: string[];
  metadata?: PhotoMetadata;
  analysisResult?: PhotoAnalysis;
  analysis?: LocalPhotoAnalysis;
}

export interface PhotoMetadata {
  width: number;
  height: number;
  format: string;
  latitude?: number;
  longitude?: number;
  deviceModel?: string;
  captureSettings?: Record<string, unknown>;
}

export interface LocalPhotoAnalysis {
  photoId: string;
  modelVersion: string;
  classifications: { label: string; confidence: number }[];
  riskScore: number;
  suggestedActions: string[];
  analyzedAt: string;
  // Environmental scene analysis
  sceneType?: string;
  environmentalHazards?: EnvironmentalHazard[];
  proximityRisks?: ProximityRisk[];
  airQualityEstimate?: AirQualityEstimate;
  waterRiskIndicators?: WaterRiskIndicator[];
  landUseClassification?: string;
}

export interface EnvironmentalHazard {
  id: string;
  type: 'industrial' | 'waste' | 'chemical' | 'radiation' | 'air_pollution' | 'water_contamination' | 'soil_contamination' | 'noise' | 'electromagnetic' | 'biological';
  label: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'minimal';
  confidence: number;
  description: string;
  cancerRelevance: string[];
  mitigationActions: string[];
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ProximityRisk {
  facilityType: string;
  estimatedDistance: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  relevantExposures: string[];
  description: string;
}

export interface AirQualityEstimate {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  visibleIndicators: string[];
}

export interface WaterRiskIndicator {
  type: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
}

export interface PhotoAnalysis {
  id: string;
  photoId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  predictions: PredictionResult[];
  processedAt?: string;
  modelVersion: string;
}

// ---- Prediction Types ----
export interface PredictionResult {
  id: string;
  type: 'risk_classification' | 'exposure_estimate' | 'trend_forecast' | 'screening_recommendation';
  cancerSite: CancerSite;
  geoId?: string;
  score: number;
  confidence: number;
  category: string;
  explanation: string;
  factors: PredictionFactor[];
  modelVersion: string;
  timestamp: string;
}

export interface PredictionFactor {
  name: string;
  family: ExposureFamily;
  weight: number;
  value: number;
  direction: 'positive' | 'negative' | 'neutral';
}

// ---- User / Auth Types ----
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastActiveAt: string;
}

export type UserRole = 'researcher' | 'clinician' | 'public_health' | 'community' | 'admin';

export interface UserPreferences {
  defaultCancerSite: CancerSite;
  defaultGeography: GeoIdentifier | null;
  theme: 'dark' | 'system';
  units: 'metric' | 'imperial';
  notifications: NotificationPrefs;
  mapStyle: 'dark' | 'satellite' | 'terrain';
  dataDisplayMode: 'percentile' | 'raw' | 'both';
}

export interface NotificationPrefs {
  dataUpdates: boolean;
  alertThresholds: boolean;
  messages: boolean;
  weeklySummary: boolean;
  pushEnabled: boolean;
}

// ---- Alert Types ----
export interface Alert {
  id: string;
  type: 'high_burden' | 'data_update' | 'trend_change' | 'screening_gap' | 'environmental_event';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  geoContext?: GeoIdentifier;
  cancerSiteContext?: CancerSite;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  dismissed: boolean;
}

// ---- Map Types ----
export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapLayer {
  id: string;
  name: string;
  family: ExposureFamily;
  type: 'choropleth' | 'heatmap' | 'cluster' | 'point' | 'boundary';
  visible: boolean;
  opacity: number;
  source: string;
  geographyLevel: GeographyLevel;
}

export interface MapSelection {
  geoId: string;
  level: GeographyLevel;
  name: string;
  coordinates: [number, number];
}

// ---- Comparison Types ----
export interface ComparisonSet {
  id: string;
  name: string;
  geoIds: string[];
  cancerSite: CancerSite;
  measures: string[];
  createdAt: string;
}

export interface ComparisonResult {
  setId: string;
  geoId: string;
  geoName: string;
  values: Record<string, number>;
  percentiles: Record<string, number>;
  rank: Record<string, number>;
}

// ---- Timeline Types ----
export interface TimelineEntry {
  geoId: string;
  cancerSite: CancerSite;
  measure: string;
  years: number[];
  values: number[];
  percentiles: number[];
  trend: TrendDirection;
  changeRate: number;
}

// ---- Report Types ----
export interface Report {
  id: string;
  title: string;
  type: 'community_profile' | 'site_analysis' | 'comparison' | 'scenario' | 'trend';
  geoIds: string[];
  cancerSites: CancerSite[];
  sections: ReportSection[];
  generatedAt: string;
  format: 'pdf' | 'json' | 'csv';
}

export interface ReportSection {
  title: string;
  type: 'text' | 'chart' | 'map' | 'table' | 'ribbon';
  content: unknown;
}

// ---- Trend Analytics Types ----
export interface TrendAnalysis {
  id: string;
  geoId: string;
  geoName: string;
  cancerSite: CancerSite;
  measureId: string;
  measureName: string;
  family: ExposureFamily;
  dataPoints: TrendDataPoint[];
  regression: RegressionResult;
  anomalies: AnomalyDetection[];
  forecast: ForecastPoint[];
  createdAt: string;
}

export interface TrendDataPoint {
  year: number;
  value: number;
  percentile: number;
  ci_lower?: number;
  ci_upper?: number;
  suppressed?: boolean;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  pValue: number;
  direction: TrendDirection;
  annualChangePercent: number;
  significanceLevel: 'p001' | 'p01' | 'p05' | 'not_significant';
}

export interface AnomalyDetection {
  year: number;
  value: number;
  expected: number;
  zScore: number;
  type: 'spike' | 'dip' | 'structural_break';
  possibleCauses: string[];
}

export interface ForecastPoint {
  year: number;
  predicted: number;
  ci_lower: number;
  ci_upper: number;
  method: 'linear' | 'exponential_smoothing' | 'arima';
}

// ---- Watchlist Types ----
export interface WatchlistItem {
  id: string;
  geoId: string;
  geoName: string;
  cancerSite: CancerSite;
  measures: string[];
  thresholds: WatchlistThreshold[];
  status: 'normal' | 'warning' | 'triggered' | 'resolved';
  lastChecked: string;
  createdAt: string;
  notes?: string;
}

export interface WatchlistThreshold {
  measureId: string;
  measureName: string;
  operator: 'above' | 'below' | 'change_exceeds';
  value: number;
  currentValue: number;
  triggered: boolean;
  triggeredAt?: string;
}

// ---- Cohort Analysis Types ----
export interface CohortDefinition {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriterion[];
  geoIds: string[];
  matchedCount: number;
  totalPopulation: number;
  createdAt: string;
}

export interface CohortCriterion {
  field: 'exposure_family' | 'risk_tier' | 'cancer_site' | 'percentile_range' | 'trend_direction' | 'population_size';
  operator: 'equals' | 'above' | 'below' | 'between' | 'in';
  value: string | number | [number, number] | string[];
}

export interface CohortComparison {
  id: string;
  cohortA: CohortDefinition;
  cohortB: CohortDefinition;
  metrics: CohortMetric[];
  significanceTests: SignificanceTest[];
  generatedAt: string;
}

export interface CohortMetric {
  measureId: string;
  measureName: string;
  cohortAMean: number;
  cohortAMedian: number;
  cohortBMean: number;
  cohortBMedian: number;
  difference: number;
  percentDifference: number;
}

export interface SignificanceTest {
  measureId: string;
  testType: 'welch_t' | 'mann_whitney' | 'chi_square';
  statistic: number;
  pValue: number;
  significant: boolean;
  effectSize: number;
}

// ---- Community Intelligence Types ----
export interface CommunityReport {
  id: string;
  geoId: string;
  geoName: string;
  population: number;
  generatedAt: string;
  executiveSummary: string;
  riskProfile: CommunityRiskProfile;
  disparities: DisparityMetric[];
  resources: CommunityResource[];
  actionItems: ActionRecommendation[];
  benchmarks: BenchmarkComparison[];
}

export interface CommunityRiskProfile {
  overallScore: number;
  tier: RiskState['tier'];
  topExposures: Array<{
    family: ExposureFamily;
    score: number;
    nationalPercentile: number;
    trend: TrendDirection;
  }>;
  cancerBurdens: Array<{
    site: CancerSite;
    incidencePercentile: number;
    mortalityPercentile: number;
    trend: TrendDirection;
  }>;
}

export interface DisparityMetric {
  dimension: 'race_ethnicity' | 'income' | 'insurance' | 'rural_urban' | 'age' | 'education';
  measureId: string;
  measureName: string;
  groupA: { label: string; value: number };
  groupB: { label: string; value: number };
  ratio: number;
  absoluteDifference: number;
  trend: TrendDirection;
}

export interface CommunityResource {
  id: string;
  name: string;
  type: 'screening_center' | 'treatment_facility' | 'support_group' | 'prevention_program' | 'research_initiative';
  address: string;
  distance?: number;
  phone?: string;
  url?: string;
  cancerSites: CancerSite[];
  services: string[];
}

export interface ActionRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'screening' | 'environmental' | 'behavioral' | 'policy' | 'infrastructure';
  title: string;
  description: string;
  expectedImpact: string;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
  relatedMeasures: string[];
}

export interface BenchmarkComparison {
  metric: string;
  localValue: number;
  stateValue: number;
  nationalValue: number;
  hp2030Target?: number;
  localPercentile: number;
  metTarget: boolean;
}

// ---- Export / Share Types ----
export interface ExportJob {
  id: string;
  type: 'report' | 'dataset' | 'visualization' | 'investigation_bundle';
  format: 'pdf' | 'csv' | 'json' | 'geojson' | 'xlsx' | 'png';
  status: 'pending' | 'generating' | 'complete' | 'failed';
  progress: number;
  data: ExportPayload;
  outputUri?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ExportPayload {
  title: string;
  description?: string;
  geoIds: string[];
  cancerSites: CancerSite[];
  measures?: string[];
  dateRange?: [string, string];
  includeProvenance: boolean;
  includeMethodology: boolean;
  sections?: string[];
}

// ---- Correlation Matrix Types ----
export interface CorrelationMatrix {
  id: string;
  geoIds: string[];
  measures: string[];
  matrix: number[][];
  pValues: number[][];
  significantPairs: CorrelationPair[];
  method: 'pearson' | 'spearman' | 'kendall';
  generatedAt: string;
}

export interface CorrelationPair {
  measureA: string;
  measureB: string;
  coefficient: number;
  pValue: number;
  direction: 'positive' | 'negative';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
}

// ---- Spatial Cluster Types ----
export interface SpatialCluster {
  id: string;
  type: 'hotspot' | 'coldspot' | 'spatial_outlier';
  geoIds: string[];
  centroid: [number, number];
  radius: number;
  measure: string;
  statistic: number; // Moran's I or Getis-Ord G*
  pValue: number;
  category: 'high_high' | 'low_low' | 'high_low' | 'low_high';
  population: number;
}

export interface SpatialAnalysis {
  id: string;
  cancerSite: CancerSite;
  measure: string;
  clusters: SpatialCluster[];
  globalMoransI: number;
  globalPValue: number;
  spatialAutocorrelation: 'clustered' | 'dispersed' | 'random';
  generatedAt: string;
}

// ---- Environmental Event Types ----
export interface EnvironmentalEvent {
  id: string;
  type: 'industrial_release' | 'wildfire' | 'chemical_spill' | 'air_quality_alert' | 'water_contamination' | 'superfund_update';
  title: string;
  description: string;
  location: { latitude: number; longitude: number };
  affectedRadius: number;
  affectedGeoIds: string[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  source: string;
  url?: string;
  relatedExposures: ExposureFamily[];
  cancerRelevance: Array<{
    site: CancerSite;
    mechanism: string;
    latencyYears: [number, number];
  }>;
}

// ---- Data Quality Types ----
export interface DataQualityReport {
  geoId: string;
  measures: DataQualityMetric[];
  overallScore: number;
  lastAssessed: string;
}

export interface DataQualityMetric {
  measureId: string;
  measureName: string;
  completeness: number;
  recency: number;
  granularity: GeographyLevel;
  suppressed: boolean;
  confidence: 'high' | 'moderate' | 'low';
  issues: string[];
}

// ---- Health Event Journal Types ----
export type HealthEventCategory =
  | 'diagnosis'
  | 'screening'
  | 'surgery'
  | 'treatment'
  | 'symptom'
  | 'lab_result'
  | 'medication'
  | 'lifestyle_change'
  | 'environmental_exposure'
  | 'vaccination';

export interface HealthEvent {
  id: string;
  category: HealthEventCategory;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  severity?: 'minor' | 'moderate' | 'significant' | 'critical';
  cancerSiteRelevance?: CancerSite[];
  geoContext?: GeoIdentifier;
  provider?: string;
  facility?: string;
  attachmentUris?: string[];
  tags: string[];
  privateNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Exposure Diary Types ----
export type ExposureDiaryCategory =
  | 'air_quality'
  | 'water_quality'
  | 'chemical_contact'
  | 'radiation'
  | 'noise'
  | 'diet'
  | 'physical_activity'
  | 'tobacco'
  | 'alcohol'
  | 'occupational'
  | 'sun_uv'
  | 'indoor_environment';

export interface ExposureDiaryEntry {
  id: string;
  category: ExposureDiaryCategory;
  title: string;
  description: string;
  date: string;
  duration?: number; // minutes
  intensity?: 'low' | 'moderate' | 'high' | 'extreme';
  location?: { latitude: number; longitude: number; name?: string };
  geoContext?: GeoIdentifier;
  measurementValue?: number;
  measurementUnit?: string;
  source?: string; // manual, sensor, wearable
  photoUri?: string;
  tags: string[];
  createdAt: string;
}

// ---- Family History Types ----
export type FamilyRelation =
  | 'self'
  | 'mother'
  | 'father'
  | 'sister'
  | 'brother'
  | 'maternal_grandmother'
  | 'maternal_grandfather'
  | 'paternal_grandmother'
  | 'paternal_grandfather'
  | 'aunt'
  | 'uncle'
  | 'child';

export interface FamilyMember {
  id: string;
  relation: FamilyRelation;
  name?: string;
  ageAtDiagnosis?: number;
  cancerSites: CancerSite[];
  otherConditions: string[];
  deceased: boolean;
  ageAtDeath?: number;
  geneticTesting?: string;
  notes?: string;
  createdAt: string;
}

// ---- Personal Risk Profile Types ----
export interface PersonalRiskProfile {
  id: string;
  userId: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  ethnicity?: string;
  smokingStatus: 'never' | 'former' | 'current';
  packYears?: number;
  bmi?: number;
  alcoholUsePerWeek?: number;
  physicalActivityMinPerWeek?: number;
  occupationalExposures: string[];
  residenceHistory: Array<{ geoId: string; geoName: string; yearsLived: number }>;
  familyMembers: FamilyMember[];
  personalRiskScores: Record<CancerSite, number>;
  lastUpdated: string;
}

// ---- Field Collection Types ----
export type FieldObservationType =
  | 'air_quality_observation'
  | 'water_source_check'
  | 'industrial_facility_note'
  | 'food_access_survey'
  | 'built_environment'
  | 'community_resource'
  | 'health_event_report'
  | 'environmental_hazard'
  | 'screening_site_visit'
  | 'custom';

export interface FieldCollectionRecord {
  id: string;
  type: FieldObservationType;
  title: string;
  description: string;
  date: string;
  location: { latitude: number; longitude: number };
  geoContext?: GeoIdentifier;
  photoUris: string[];
  measurements: FieldMeasurement[];
  tags: string[];
  weather?: { temp?: number; humidity?: number; conditions?: string };
  submittedToServer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMeasurement {
  name: string;
  value: number;
  unit: string;
  instrument?: string;
  confidence?: 'high' | 'moderate' | 'low';
}

// ---- Activity Log Types ----
export type ActivityAction =
  | 'search'
  | 'view_screen'
  | 'view_geo'
  | 'run_scenario'
  | 'export_data'
  | 'capture_photo'
  | 'add_journal_entry'
  | 'field_collection'
  | 'bookmark'
  | 'share'
  | 'generate_report'
  | 'set_watchlist'
  | 'change_setting';

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  label: string;
  detail?: string;
  geoContext?: string;
  cancerSiteContext?: CancerSite;
  screen?: string;
  timestamp: string;
}

// ---- Data Snapshot Types ----
export interface DataSnapshot {
  id: string;
  geoId: string;
  geoName: string;
  cancerSite: CancerSite;
  snapshotDate: string;
  riskStates: RiskState[];
  exposureValues: ExposureValue[];
  note?: string;
  autoGenerated: boolean;
  createdAt: string;
}

// ---- Map Pin / Annotation Types ----
export interface MapAnnotation {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  color: string;
  icon: string;
  category: 'note' | 'hazard' | 'resource' | 'observation' | 'bookmark';
  photoUri?: string;
  createdAt: string;
}

// ---- Community Survey Types ----
export type SurveyQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'likert_scale'
  | 'numeric_slider'
  | 'free_text'
  | 'yes_no'
  | 'ranking'
  | 'geo_pin';

export type SurveyCategory =
  | 'environmental_concern'
  | 'health_perception'
  | 'exposure_awareness'
  | 'neighborhood_quality'
  | 'access_to_care'
  | 'lifestyle_habits'
  | 'occupational_safety'
  | 'community_action'
  | 'custom';

export interface SurveyOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  text: string;
  description?: string;
  required: boolean;
  options?: SurveyOption[];
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  category: SurveyCategory;
  icon: string;
  color: string;
  questions: SurveyQuestion[];
  estimatedMinutes: number;
  totalResponses: number;
  createdAt: string;
  featured: boolean;
}

export interface SurveyAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: SurveyAnswer[];
  geoContext?: GeoIdentifier;
  completedAt: string;
  durationSeconds: number;
}

export interface SurveyInsight {
  questionId: string;
  questionText: string;
  topAnswer: string;
  topAnswerPercent: number;
  totalAnswers: number;
  distribution: Array<{ label: string; count: number; percent: number }>;
}
