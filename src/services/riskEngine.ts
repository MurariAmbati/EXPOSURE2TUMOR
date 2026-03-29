// ============================================================
// Exposure2Tumor — Risk State Computation Engine
// Computes latent cancer-risk states from exposure data
// ============================================================

import type {
  CancerSite,
  ExposureFamily,
  ExposureValue,
  RiskState,
  RiskStateCategory,
  RiskDriver,
  TrendDirection,
  ExposureRibbonData,
  ExposureRibbonSegment,
} from '../types';
import { CANCER_SITES, EXPOSURE_FAMILY_COLORS, EXPOSURE_FAMILY_LABELS } from '../config/cancerSites';
import { Colors } from '../theme';

// ---- Weights by cancer site and exposure family ----
const SITE_FAMILY_WEIGHTS: Record<CancerSite, Partial<Record<ExposureFamily, number>>> = {
  lung: {
    environmental: 0.30,
    behavioral: 0.35,
    screening_access: 0.15,
    social_structural: 0.12,
    occupational: 0.08,
  },
  breast: {
    environmental: 0.15,
    behavioral: 0.25,
    screening_access: 0.30,
    social_structural: 0.15,
    food_environment: 0.15,
  },
  colorectal: {
    behavioral: 0.25,
    screening_access: 0.30,
    food_environment: 0.20,
    social_structural: 0.25,
  },
  melanoma: {
    climate_uv: 0.35,
    occupational: 0.20,
    screening_access: 0.25,
    social_structural: 0.20,
  },
  liver: {
    behavioral: 0.35,
    environmental: 0.20,
    social_structural: 0.25,
    screening_access: 0.20,
  },
  cervical: {
    screening_access: 0.40,
    behavioral: 0.25,
    social_structural: 0.35,
  },
  prostate: {
    screening_access: 0.35,
    social_structural: 0.30,
    environmental: 0.15,
    behavioral: 0.20,
  },
  pancreatic: {
    behavioral: 0.35,
    social_structural: 0.30,
    environmental: 0.35,
  },
  kidney: {
    behavioral: 0.35,
    environmental: 0.30,
    social_structural: 0.35,
  },
  bladder: {
    behavioral: 0.40,
    environmental: 0.30,
    occupational: 0.30,
  },
  oral: {
    behavioral: 0.40,
    screening_access: 0.30,
    social_structural: 0.30,
  },
};

// ---- Tier Classification ----
function classifyTier(score: number): RiskState['tier'] {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'very_low';
}

function classifyTrend(values: number[]): TrendDirection {
  if (values.length < 3) return 'insufficient_data';
  const recent = values.slice(-3);
  const earlier = values.slice(0, 3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const delta = recentAvg - earlierAvg;
  if (Math.abs(delta) < 2) return 'stable';
  return delta > 0 ? 'worsening' : 'improving';
}

// ---- Compute a single risk state category ----
function computeCategoryScore(
  category: RiskStateCategory,
  exposureValues: ExposureValue[],
  cancerSite: CancerSite
): { score: number; percentile: number; drivers: RiskDriver[] } {
  const familyMap: Record<RiskStateCategory, ExposureFamily[]> = {
    environmental_burden: ['environmental'],
    behavioral_burden: ['behavioral'],
    preventive_access: ['screening_access'],
    structural_vulnerability: ['social_structural'],
    cumulative_cancer_pressure: ['environmental', 'behavioral', 'screening_access', 'social_structural', 'occupational', 'climate_uv', 'food_environment'],
    prevention_opportunity: ['screening_access', 'food_environment', 'social_structural'],
  };

  const relevantFamilies = familyMap[category];
  const values = exposureValues.filter(v => {
    // Match by measure family (encoded in measureId prefix)
    return relevantFamilies.some(f => v.measureId.startsWith(f));
  });

  if (values.length === 0) {
    return { score: 50, percentile: 50, drivers: [] };
  }

  const weights = SITE_FAMILY_WEIGHTS[cancerSite] ?? {};
  let totalWeight = 0;
  let weightedSum = 0;
  const drivers: RiskDriver[] = [];

  for (const val of values) {
    const family = val.measureId.split('_')[0] as ExposureFamily;
    const weight = weights[family] ?? 0.1;
    weightedSum += val.percentile * weight;
    totalWeight += weight;

    drivers.push({
      measureId: val.measureId,
      name: val.measureId.replace(/_/g, ' '),
      family,
      contribution: weight,
      value: val.value,
      percentile: val.percentile,
      direction: val.percentile > 60 ? 'increasing_risk' : val.percentile < 40 ? 'decreasing_risk' : 'neutral',
    });
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 50;
  const percentile = score; // simplified for v1

  // For prevention_opportunity, invert the score
  const finalScore = category === 'prevention_opportunity' ? 100 - score : score;

  drivers.sort((a, b) => b.contribution - a.contribution);

  return { score: finalScore, percentile: finalScore, drivers: drivers.slice(0, 5) };
}

// ---- Main Risk State Computation ----
export function computeRiskStates(
  geoId: string,
  cancerSite: CancerSite,
  year: number,
  exposureValues: ExposureValue[]
): RiskState[] {
  const categories: RiskStateCategory[] = [
    'environmental_burden',
    'behavioral_burden',
    'preventive_access',
    'structural_vulnerability',
    'cumulative_cancer_pressure',
    'prevention_opportunity',
  ];

  return categories.map(category => {
    const { score, percentile, drivers } = computeCategoryScore(category, exposureValues, cancerSite);
    const confidenceSpread = Math.max(5, 100 - exposureValues.length * 3);

    return {
      category,
      geoId,
      cancerSite,
      year,
      score: Math.round(score * 10) / 10,
      percentile: Math.round(percentile),
      tier: classifyTier(score),
      confidence: [
        Math.max(0, score - confidenceSpread / 2),
        Math.min(100, score + confidenceSpread / 2),
      ] as [number, number],
      topDrivers: drivers,
      trend: 'stable' as TrendDirection,
    };
  });
}

// ---- Exposure Ribbon Computation ----
export function computeExposureRibbon(
  geoId: string,
  geoName: string,
  cancerSite: CancerSite,
  exposureValues: ExposureValue[]
): ExposureRibbonData {
  const siteConfig = CANCER_SITES[cancerSite];
  const families = siteConfig.exposureFamilies;

  const segments: ExposureRibbonSegment[] = families.map(family => {
    const familyValues = exposureValues.filter(v => v.measureId.startsWith(family));
    const avgPercentile = familyValues.length > 0
      ? familyValues.reduce((sum, v) => sum + v.percentile, 0) / familyValues.length
      : 50;

    const years = familyValues.map(v => v.year);
    const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

    return {
      family,
      label: EXPOSURE_FAMILY_LABELS[family] ?? family,
      color: EXPOSURE_FAMILY_COLORS[family] ?? Colors.textMuted,
      percentile: Math.round(avgPercentile),
      direction: classifyTrend(familyValues.map(v => v.percentile)),
      uncertainty: [
        Math.max(0, avgPercentile - 10),
        Math.min(100, avgPercentile + 10),
      ] as [number, number],
      recency: maxYear,
      measures: familyValues,
    };
  });

  const overallScore = segments.length > 0
    ? segments.reduce((s, seg) => s + seg.percentile, 0) / segments.length
    : 50;

  return {
    geoId,
    geoName,
    cancerSite,
    segments,
    overallScore: Math.round(overallScore * 10) / 10,
    overallPercentile: Math.round(overallScore),
  };
}

// ---- Scenario Perturbation ----
interface ScenarioOutput {
  projectedRiskStates: RiskState[];
  overallScoreChange: number;
  affectedFamilies: ExposureFamily[];
  confidence: number;
}

export function applyScenario(
  baseRiskStates: RiskState[],
  adjustments: Array<{ family?: ExposureFamily; percentileShift?: number; measureId?: string; direction?: 'increase' | 'decrease'; magnitude?: number }>
): ScenarioOutput {
  // Normalize adjustments to internal format
  const normalizedAdj = adjustments.map((adj) => {
    if (adj.family && adj.percentileShift !== undefined) {
      return { family: adj.family, shift: adj.percentileShift };
    }
    // Convert ScenarioParameter-style to shift
    const shift = (adj.direction === 'decrease' ? -1 : 1) * (adj.magnitude ?? 10) * 0.3;
    const family: ExposureFamily = adj.measureId?.includes('smoking') || adj.measureId?.includes('physical') || adj.measureId?.includes('obesity')
      ? 'behavioral'
      : adj.measureId?.includes('pm25') || adj.measureId?.includes('radon') || adj.measureId?.includes('uv')
        ? 'environmental'
        : adj.measureId?.includes('poverty') || adj.measureId?.includes('uninsured')
          ? 'social_structural'
          : adj.measureId?.includes('mammography') || adj.measureId?.includes('screening')
            ? 'screening_access'
            : adj.measureId?.includes('food')
              ? 'food_environment'
              : 'behavioral';
    return { family, shift };
  });

  const affectedFamilies = [...new Set(normalizedAdj.map((a) => a.family))];

  const projected = baseRiskStates.map(state => {
    let adjustedScore = state.score;

    for (const adj of normalizedAdj) {
      const familyRelevance = state.topDrivers
        .filter(d => d.family === adj.family)
        .reduce((sum, d) => sum + d.contribution, 0);

      adjustedScore += adj.shift * familyRelevance;
    }

    adjustedScore = Math.max(0, Math.min(100, adjustedScore));

    return {
      ...state,
      score: Math.round(adjustedScore * 10) / 10,
      percentile: Math.round(adjustedScore),
      tier: classifyTier(adjustedScore),
      confidence: [
        Math.max(0, adjustedScore - 15),
        Math.min(100, adjustedScore + 15),
      ] as [number, number],
    };
  });

  const baseAvg = baseRiskStates.length > 0
    ? baseRiskStates.reduce((s, r) => s + r.score, 0) / baseRiskStates.length
    : 0;
  const projAvg = projected.length > 0
    ? projected.reduce((s, r) => s + r.score, 0) / projected.length
    : 0;

  return {
    projectedRiskStates: projected,
    overallScoreChange: Math.round((projAvg - baseAvg) * 10) / 10,
    affectedFamilies,
    confidence: 0.72,
  };
}
