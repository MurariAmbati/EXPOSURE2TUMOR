// Exposure2Tumor — Advanced Analytics Engine
// Trend analysis, anomaly detection, forecasting, correlation, clustering

import type {
  TrendAnalysis,
  TrendDataPoint,
  RegressionResult,
  AnomalyDetection,
  ForecastPoint,
  CorrelationMatrix,
  CorrelationPair,
  SpatialCluster,
  SpatialAnalysis,
  CohortDefinition,
  CohortComparison,
  CohortMetric,
  SignificanceTest,
  CohortCriterion,
  ExposureValue,
  ExposureFamily,
  CancerSite,
  RiskState,
  TrendDirection,
  DataQualityReport,
  DataQualityMetric,
  GeographyLevel,
} from '../types';

// ---- Linear Regression ----
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, rSquared: 0 };

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTotal = ys.reduce((a, y) => a + (y - meanY) ** 2, 0);
  const ssResidual = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, rSquared };
}

// ---- P-value approximation (from t-statistic) ----
function approxPValue(tStat: number, df: number): number {
  const x = df / (df + tStat * tStat);
  // Simplified beta-regularized for p-value approximation
  if (df <= 0) return 1;
  const p = Math.exp(
    -0.5 * Math.log(1 + (tStat * tStat) / df) * (df + 1)
  ) * 0.5;
  return Math.min(1, Math.max(0, p * 2));
}

// ---- Standard Deviation ----
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---- Trend Analysis ----
export function analyzeTrend(
  dataPoints: TrendDataPoint[],
  geoId: string,
  geoName: string,
  cancerSite: CancerSite,
  measureId: string,
  measureName: string,
  family: ExposureFamily,
): TrendAnalysis {
  const sorted = [...dataPoints].sort((a, b) => a.year - b.year);
  const xs = sorted.map(d => d.year);
  const ys = sorted.map(d => d.value);

  // Linear regression
  const reg = linearRegression(xs, ys);
  const n = xs.length;
  const df = Math.max(1, n - 2);
  const sResid = stdDev(ys.map((y, i) => y - (reg.slope * xs[i] + reg.intercept)));
  const sX = stdDev(xs);
  const tStat = sX > 0 && sResid > 0 ? reg.slope / (sResid / (sX * Math.sqrt(n))) : 0;
  const pValue = approxPValue(Math.abs(tStat), df);

  const direction: TrendDirection = pValue > 0.05
    ? 'stable'
    : reg.slope > 0 ? 'worsening' : 'improving';

  const meanY = mean(ys);
  const annualChangePercent = meanY !== 0 ? (reg.slope / meanY) * 100 : 0;

  const regression: RegressionResult = {
    slope: Math.round(reg.slope * 1000) / 1000,
    intercept: Math.round(reg.intercept * 100) / 100,
    rSquared: Math.round(reg.rSquared * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    direction,
    annualChangePercent: Math.round(annualChangePercent * 100) / 100,
    significanceLevel: pValue < 0.001 ? 'p001' : pValue < 0.01 ? 'p01' : pValue < 0.05 ? 'p05' : 'not_significant',
  };

  // Anomaly detection (z-score based)
  const residuals = ys.map((y, i) => y - (reg.slope * xs[i] + reg.intercept));
  const residStd = stdDev(residuals);
  const anomalies: AnomalyDetection[] = [];
  if (residStd > 0) {
    residuals.forEach((r, i) => {
      const z = r / residStd;
      if (Math.abs(z) > 2.0) {
        anomalies.push({
          year: sorted[i].year,
          value: sorted[i].value,
          expected: Math.round((reg.slope * xs[i] + reg.intercept) * 100) / 100,
          zScore: Math.round(z * 100) / 100,
          type: Math.abs(z) > 3 ? 'structural_break' : z > 0 ? 'spike' : 'dip',
          possibleCauses: generatePossibleCauses(family, z > 0 ? 'spike' : 'dip', sorted[i].year),
        });
      }
    });
  }

  // Forecast (simple linear extrapolation with confidence)
  const lastYear = xs[xs.length - 1] ?? 2022;
  const forecastYears = [1, 2, 3, 5, 10];
  const forecast: ForecastPoint[] = forecastYears.map(yAhead => {
    const yr = lastYear + yAhead;
    const predicted = reg.slope * yr + reg.intercept;
    const se = sResid * Math.sqrt(1 + 1 / n + ((yr - mean(xs)) ** 2) / ((n - 1) * (sX ** 2 || 1)));
    return {
      year: yr,
      predicted: Math.round(predicted * 100) / 100,
      ci_lower: Math.round((predicted - 1.96 * se) * 100) / 100,
      ci_upper: Math.round((predicted + 1.96 * se) * 100) / 100,
      method: 'linear' as const,
    };
  });

  return {
    id: `trend-${geoId}-${cancerSite}-${measureId}-${Date.now()}`,
    geoId,
    geoName,
    cancerSite,
    measureId,
    measureName,
    family,
    dataPoints: sorted,
    regression,
    anomalies,
    forecast,
    createdAt: new Date().toISOString(),
  };
}

function generatePossibleCauses(family: ExposureFamily, type: 'spike' | 'dip', year: number): string[] {
  const causes: string[] = [];
  if (family === 'environmental') {
    causes.push(type === 'spike' ? 'Industrial discharge event' : 'Environmental remediation effect');
    if (year >= 2020 && year <= 2021) causes.push('COVID-19 lockdown emission changes');
  } else if (family === 'behavioral') {
    causes.push(type === 'spike' ? 'Community health behavior shift' : 'Public health campaign effect');
    if (year >= 2020) causes.push('Pandemic behavioral changes');
  } else if (family === 'screening_access') {
    if (year >= 2020 && year <= 2021) causes.push('COVID-19 screening disruption');
    causes.push(type === 'dip' ? 'Facility closure or funding change' : 'Expanded access program');
  } else if (family === 'social_structural') {
    causes.push(type === 'spike' ? 'Economic downturn impact' : 'Social program expansion');
  }
  if (causes.length === 0) causes.push('Requires further investigation');
  return causes;
}

// ---- Correlation Analysis ----
export function computeCorrelationMatrix(
  measureIds: string[],
  data: Record<string, number[]>, // measureId → values across geoIds
  method: 'pearson' | 'spearman' = 'pearson',
): CorrelationMatrix {
  const n = measureIds.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const pValues: number[][] = Array.from({ length: n }, () => Array(n).fill(1));
  const significantPairs: CorrelationPair[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    pValues[i][i] = 0;
    for (let j = i + 1; j < n; j++) {
      const xs = data[measureIds[i]] ?? [];
      const ys = data[measureIds[j]] ?? [];
      const minLen = Math.min(xs.length, ys.length);
      if (minLen < 3) {
        matrix[i][j] = 0;
        matrix[j][i] = 0;
        continue;
      }

      let r: number;
      if (method === 'spearman') {
        const rankedX = rankArray(xs.slice(0, minLen));
        const rankedY = rankArray(ys.slice(0, minLen));
        r = pearsonR(rankedX, rankedY);
      } else {
        r = pearsonR(xs.slice(0, minLen), ys.slice(0, minLen));
      }

      matrix[i][j] = Math.round(r * 1000) / 1000;
      matrix[j][i] = matrix[i][j];

      // Approximate p-value from correlation
      const t = r * Math.sqrt((minLen - 2) / (1 - r * r + 0.0001));
      const p = approxPValue(Math.abs(t), minLen - 2);
      pValues[i][j] = Math.round(p * 10000) / 10000;
      pValues[j][i] = pValues[i][j];

      if (p < 0.05 && Math.abs(r) > 0.3) {
        significantPairs.push({
          measureA: measureIds[i],
          measureB: measureIds[j],
          coefficient: matrix[i][j],
          pValue: pValues[i][j],
          direction: r > 0 ? 'positive' : 'negative',
          strength: Math.abs(r) >= 0.8 ? 'very_strong' : Math.abs(r) >= 0.6 ? 'strong' : Math.abs(r) >= 0.4 ? 'moderate' : 'weak',
        });
      }
    }
  }

  return {
    id: `corr-${Date.now()}`,
    geoIds: [],
    measures: measureIds,
    matrix,
    pValues,
    significantPairs: significantPairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)),
    method,
    generatedAt: new Date().toISOString(),
  };
}

function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = mean(xs);
  const meanY = mean(ys);
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den > 0 ? num / den : 0;
}

function rankArray(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  for (let k = 0; k < sorted.length; k++) {
    ranks[sorted[k].i] = k + 1;
  }
  return ranks;
}

// ---- Spatial Clustering (simplified Getis-Ord G*) ----
export function detectSpatialClusters(
  geoData: Array<{ geoId: string; lat: number; lng: number; value: number; population: number }>,
  cancerSite: CancerSite,
  measure: string,
  distanceThresholdKm: number = 80,
): SpatialAnalysis {
  const clusters: SpatialCluster[] = [];
  const globalMean = mean(geoData.map(g => g.value));
  const globalStd = stdDev(geoData.map(g => g.value));

  // For each point, compute local G* statistic
  const gStars: Array<{ geoId: string; gStar: number; neighbors: string[] }> = [];

  for (const focal of geoData) {
    const neighbors = geoData.filter(
      g => g.geoId !== focal.geoId && haversineKm(focal.lat, focal.lng, g.lat, g.lng) <= distanceThresholdKm
    );

    if (neighbors.length < 2) continue;

    const localValues = [focal.value, ...neighbors.map(n => n.value)];
    const localMean = mean(localValues);
    const gStar = globalStd > 0 ? (localMean - globalMean) / (globalStd / Math.sqrt(localValues.length)) : 0;

    gStars.push({ geoId: focal.geoId, gStar, neighbors: neighbors.map(n => n.geoId) });
  }

  // Identify significant clusters (|G*| > 1.96)
  const hotspots = gStars.filter(g => g.gStar > 1.96);
  const coldspots = gStars.filter(g => g.gStar < -1.96);

  // Merge nearby hotspots into cluster groups
  const processedHot = new Set<string>();
  for (const hs of hotspots) {
    if (processedHot.has(hs.geoId)) continue;
    const clusterGeos = [hs.geoId, ...hs.neighbors.filter(n => hotspots.some(h => h.geoId === n))];
    clusterGeos.forEach(g => processedHot.add(g));
    const points = geoData.filter(g => clusterGeos.includes(g.geoId));
    if (points.length < 2) continue;

    clusters.push({
      id: `cluster-hot-${clusters.length}`,
      type: 'hotspot',
      geoIds: clusterGeos,
      centroid: [mean(points.map(p => p.lng)), mean(points.map(p => p.lat))],
      radius: distanceThresholdKm,
      measure,
      statistic: Math.round(hs.gStar * 100) / 100,
      pValue: approxPValue(Math.abs(hs.gStar), geoData.length - 2),
      category: 'high_high',
      population: points.reduce((sum, p) => sum + p.population, 0),
    });
  }

  const processedCold = new Set<string>();
  for (const cs of coldspots) {
    if (processedCold.has(cs.geoId)) continue;
    const clusterGeos = [cs.geoId, ...cs.neighbors.filter(n => coldspots.some(c => c.geoId === n))];
    clusterGeos.forEach(g => processedCold.add(g));
    const points = geoData.filter(g => clusterGeos.includes(g.geoId));
    if (points.length < 2) continue;

    clusters.push({
      id: `cluster-cold-${clusters.length}`,
      type: 'coldspot',
      geoIds: clusterGeos,
      centroid: [mean(points.map(p => p.lng)), mean(points.map(p => p.lat))],
      radius: distanceThresholdKm,
      measure,
      statistic: Math.round(cs.gStar * 100) / 100,
      pValue: approxPValue(Math.abs(cs.gStar), geoData.length - 2),
      category: 'low_low',
      population: points.reduce((sum, p) => sum + p.population, 0),
    });
  }

  // Global Moran's I approximation
  const allGStars = gStars.map(g => g.gStar);
  const globalMoransI = allGStars.length > 0 ? mean(allGStars.map(g => g * g)) - 1 : 0;
  const globalPValue = approxPValue(Math.abs(globalMoransI) * Math.sqrt(allGStars.length), allGStars.length - 1);

  return {
    id: `spatial-${cancerSite}-${measure}-${Date.now()}`,
    cancerSite,
    measure,
    clusters,
    globalMoransI: Math.round(globalMoransI * 1000) / 1000,
    globalPValue: Math.round(globalPValue * 10000) / 10000,
    spatialAutocorrelation: globalPValue < 0.05 ? (globalMoransI > 0 ? 'clustered' : 'dispersed') : 'random',
    generatedAt: new Date().toISOString(),
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Cohort Analysis ----
export function defineCohort(
  name: string,
  description: string,
  criteria: CohortCriterion[],
  allGeoRisk: Array<{ geoId: string; riskStates: RiskState[]; population: number }>,
): CohortDefinition {
  const matched = allGeoRisk.filter(geo => {
    return criteria.every(c => matchesCriterion(c, geo));
  });

  return {
    id: `cohort-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    criteria,
    geoIds: matched.map(g => g.geoId),
    matchedCount: matched.length,
    totalPopulation: matched.reduce((sum, g) => sum + g.population, 0),
    createdAt: new Date().toISOString(),
  };
}

function matchesCriterion(
  criterion: CohortCriterion,
  geo: { geoId: string; riskStates: RiskState[]; population: number },
): boolean {
  switch (criterion.field) {
    case 'risk_tier': {
      return geo.riskStates.some(rs => rs.tier === criterion.value);
    }
    case 'cancer_site': {
      return geo.riskStates.some(rs => rs.cancerSite === criterion.value);
    }
    case 'percentile_range': {
      const [lo, hi] = criterion.value as [number, number];
      return geo.riskStates.some(rs => rs.percentile >= lo && rs.percentile <= hi);
    }
    case 'population_size': {
      if (criterion.operator === 'above') return geo.population > (criterion.value as number);
      if (criterion.operator === 'below') return geo.population < (criterion.value as number);
      return true;
    }
    default:
      return true;
  }
}

export function compareCohorts(
  cohortA: CohortDefinition,
  cohortB: CohortDefinition,
  measureData: Record<string, Record<string, number>>, // measureId → { geoId → value }
): CohortComparison {
  const measureIds = Object.keys(measureData);
  const metrics: CohortMetric[] = [];
  const significanceTests: SignificanceTest[] = [];

  for (const measureId of measureIds) {
    const data = measureData[measureId];
    const aValues = cohortA.geoIds.map(g => data[g]).filter((v): v is number => v !== undefined);
    const bValues = cohortB.geoIds.map(g => data[g]).filter((v): v is number => v !== undefined);

    if (aValues.length < 2 || bValues.length < 2) continue;

    const aMean = mean(aValues);
    const bMean = mean(bValues);

    metrics.push({
      measureId,
      measureName: measureId,
      cohortAMean: Math.round(aMean * 100) / 100,
      cohortAMedian: Math.round(median(aValues) * 100) / 100,
      cohortBMean: Math.round(bMean * 100) / 100,
      cohortBMedian: Math.round(median(bValues) * 100) / 100,
      difference: Math.round((aMean - bMean) * 100) / 100,
      percentDifference: bMean !== 0 ? Math.round(((aMean - bMean) / bMean) * 10000) / 100 : 0,
    });

    // Welch's t-test
    const aStd = stdDev(aValues);
    const bStd = stdDev(bValues);
    const seA = aStd / Math.sqrt(aValues.length);
    const seB = bStd / Math.sqrt(bValues.length);
    const seDiff = Math.sqrt(seA * seA + seB * seB);
    const tStat = seDiff > 0 ? (aMean - bMean) / seDiff : 0;
    const dfWelch = seDiff > 0
      ? (seA ** 2 + seB ** 2) ** 2 / ((seA ** 4) / (aValues.length - 1) + (seB ** 4) / (bValues.length - 1))
      : 1;
    const pVal = approxPValue(Math.abs(tStat), Math.round(dfWelch));
    const pooledStd = Math.sqrt(((aValues.length - 1) * aStd ** 2 + (bValues.length - 1) * bStd ** 2) / (aValues.length + bValues.length - 2));
    const effectSize = pooledStd > 0 ? Math.abs(aMean - bMean) / pooledStd : 0;

    significanceTests.push({
      measureId,
      testType: 'welch_t',
      statistic: Math.round(tStat * 1000) / 1000,
      pValue: Math.round(pVal * 10000) / 10000,
      significant: pVal < 0.05,
      effectSize: Math.round(effectSize * 1000) / 1000,
    });
  }

  return {
    id: `cohort-comp-${Date.now()}`,
    cohortA,
    cohortB,
    metrics,
    significanceTests: significanceTests.sort((a, b) => a.pValue - b.pValue),
    generatedAt: new Date().toISOString(),
  };
}

// ---- Data Quality Assessment ----
export function assessDataQuality(
  geoId: string,
  exposureValues: ExposureValue[],
  currentYear: number = 2024,
): DataQualityReport {
  const byMeasure = new Map<string, ExposureValue[]>();
  for (const ev of exposureValues) {
    const existing = byMeasure.get(ev.measureId) ?? [];
    existing.push(ev);
    byMeasure.set(ev.measureId, existing);
  }

  const metrics: DataQualityMetric[] = [];
  for (const [measureId, values] of byMeasure) {
    const latestYear = Math.max(...values.map(v => v.year));
    const recencyScore = Math.max(0, 100 - (currentYear - latestYear) * 15);
    const suppressedCount = values.filter(v => v.suppressed).length;
    const completeness = values.length > 0 ? ((values.length - suppressedCount) / Math.max(5, values.length)) * 100 : 0;
    const issues: string[] = [];
    if (currentYear - latestYear > 3) issues.push(`Data is ${currentYear - latestYear} years old`);
    if (suppressedCount > 0) issues.push(`${suppressedCount} suppressed value(s)`);
    if (values.length < 3) issues.push('Limited temporal coverage');

    metrics.push({
      measureId,
      measureName: measureId,
      completeness: Math.round(Math.min(100, completeness)),
      recency: Math.round(recencyScore),
      granularity: 'county',
      suppressed: suppressedCount > 0,
      confidence: recencyScore > 70 && completeness > 80 ? 'high' : recencyScore > 40 ? 'moderate' : 'low',
      issues,
    });
  }

  const overallScore = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + (m.completeness + m.recency) / 2, 0) / metrics.length)
    : 0;

  return {
    geoId,
    measures: metrics,
    overallScore,
    lastAssessed: new Date().toISOString(),
  };
}
