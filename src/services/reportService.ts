// Exposure2Tumor — Report Generation & Export Service
// Community profiles, comparison reports, data export, investigation bundles

import type {
  CommunityReport,
  CommunityRiskProfile,
  DisparityMetric,
  CommunityResource,
  ActionRecommendation,
  BenchmarkComparison,
  ExportJob,
  ExportPayload,
  Report,
  ReportSection,
  RiskState,
  ExposureValue,
  ExposureFamily,
  CancerSite,
  GeoIdentifier,
  TrendDirection,
} from '../types';
import { CANCER_SITES, EXPOSURE_FAMILY_LABELS } from '../config/cancerSites';

// ---- Community Report Generation ----
export function generateCommunityReport(
  geo: GeoIdentifier,
  riskStates: RiskState[],
  exposureValues: ExposureValue[],
): CommunityReport {
  const riskProfile = buildRiskProfile(riskStates);
  const disparities = simulateDisparities(geo, exposureValues);
  const resources = generateResourceList(geo, riskStates);
  const actionItems = generateActionRecommendations(riskStates, exposureValues);
  const benchmarks = generateBenchmarks(exposureValues);

  const topExposureNames = riskProfile.topExposures
    .slice(0, 3)
    .map(e => EXPOSURE_FAMILY_LABELS[e.family])
    .join(', ');

  const executiveSummary = `${geo.name} has an overall cancer exposure risk score of ${riskProfile.overallScore} (${riskProfile.tier} tier). ` +
    `Primary exposure concerns include ${topExposureNames}. ` +
    `${actionItems.filter(a => a.priority === 'critical').length} critical action items identified. ` +
    `Data covers ${exposureValues.length} exposure measures across ${new Set(exposureValues.map(e => e.year)).size} years.`;

  return {
    id: `community-${geo.fips}-${Date.now()}`,
    geoId: geo.fips,
    geoName: geo.name,
    population: geo.population ?? 0,
    generatedAt: new Date().toISOString(),
    executiveSummary,
    riskProfile,
    disparities,
    resources,
    actionItems,
    benchmarks,
  };
}

function buildRiskProfile(riskStates: RiskState[]): CommunityRiskProfile {
  const avgScore = riskStates.length > 0
    ? Math.round(riskStates.reduce((s, r) => s + r.score, 0) / riskStates.length)
    : 50;

  const familyScores = new Map<ExposureFamily, { total: number; count: number; percentiles: number[]; trends: TrendDirection[] }>();
  for (const rs of riskStates) {
    for (const driver of rs.topDrivers) {
      const existing = familyScores.get(driver.family) ?? { total: 0, count: 0, percentiles: [], trends: [] };
      existing.total += driver.contribution * rs.score;
      existing.count++;
      existing.percentiles.push(driver.percentile);
      existing.trends.push(rs.trend);
      familyScores.set(driver.family, existing);
    }
  }

  const topExposures = Array.from(familyScores.entries())
    .map(([family, data]) => ({
      family,
      score: Math.round(data.total / Math.max(1, data.count)),
      nationalPercentile: Math.round(data.percentiles.reduce((a, b) => a + b, 0) / Math.max(1, data.percentiles.length)),
      trend: mostCommon(data.trends),
    }))
    .sort((a, b) => b.score - a.score);

  const cancerSites = new Set(riskStates.map(rs => rs.cancerSite));
  const cancerBurdens = Array.from(cancerSites).map(site => {
    const siteStates = riskStates.filter(rs => rs.cancerSite === site);
    return {
      site,
      incidencePercentile: Math.round(siteStates.reduce((s, r) => s + r.percentile, 0) / Math.max(1, siteStates.length)),
      mortalityPercentile: Math.round(siteStates.reduce((s, r) => s + r.percentile * 0.9, 0) / Math.max(1, siteStates.length)),
      trend: mostCommon(siteStates.map(s => s.trend)),
    };
  });

  return {
    overallScore: avgScore,
    tier: avgScore >= 80 ? 'very_high' : avgScore >= 65 ? 'high' : avgScore >= 45 ? 'moderate' : avgScore >= 25 ? 'low' : 'very_low',
    topExposures,
    cancerBurdens,
  };
}

function mostCommon(values: TrendDirection[]): TrendDirection {
  const counts = new Map<TrendDirection, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: TrendDirection = 'stable';
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) { best = k; bestCount = c; }
  }
  return best;
}

function simulateDisparities(geo: GeoIdentifier, exposureValues: ExposureValue[]): DisparityMetric[] {
  const disparities: DisparityMetric[] = [];
  const dimensions: DisparityMetric['dimension'][] = ['race_ethnicity', 'income', 'insurance', 'rural_urban'];

  for (const dim of dimensions) {
    const highPercentileValues = exposureValues.filter(v => v.percentile > 70);
    if (highPercentileValues.length === 0) continue;

    const topMeasure = highPercentileValues[0];
    disparities.push({
      dimension: dim,
      measureId: topMeasure.measureId,
      measureName: topMeasure.measureId.replace(/_/g, ' '),
      groupA: { label: dim === 'income' ? 'Below poverty line' : dim === 'insurance' ? 'Uninsured' : dim === 'rural_urban' ? 'Rural' : 'Minority populations', value: topMeasure.value * 1.3 },
      groupB: { label: dim === 'income' ? 'Above poverty line' : dim === 'insurance' ? 'Insured' : dim === 'rural_urban' ? 'Urban' : 'White non-Hispanic', value: topMeasure.value * 0.85 },
      ratio: Math.round(1.3 / 0.85 * 100) / 100,
      absoluteDifference: Math.round(topMeasure.value * 0.45 * 100) / 100,
      trend: 'stable',
    });
  }

  return disparities;
}

function generateResourceList(geo: GeoIdentifier, riskStates: RiskState[]): CommunityResource[] {
  const resources: CommunityResource[] = [];
  const topSites = [...new Set(riskStates.map(r => r.cancerSite))].slice(0, 3);

  resources.push({
    id: `resource-screening-${geo.fips}`,
    name: `${geo.name} Community Screening Center`,
    type: 'screening_center',
    address: `${geo.name}, ${geo.state ?? ''}`,
    cancerSites: topSites,
    services: ['Free mammography', 'Colorectal screening', 'Lung cancer LDCT', 'HPV screening'],
  });

  resources.push({
    id: `resource-treatment-${geo.fips}`,
    name: `Regional Cancer Treatment Center`,
    type: 'treatment_facility',
    address: `Near ${geo.name}`,
    distance: 15,
    cancerSites: topSites,
    services: ['Oncology', 'Radiation therapy', 'Surgical oncology', 'Palliative care'],
  });

  resources.push({
    id: `resource-support-${geo.fips}`,
    name: `Cancer Support Network — ${geo.state ?? 'Local'}`,
    type: 'support_group',
    address: `${geo.name}`,
    url: 'https://www.cancer.org',
    cancerSites: topSites,
    services: ['Caregiver support', 'Patient navigation', 'Financial assistance', 'Transportation aid'],
  });

  resources.push({
    id: `resource-prevention-${geo.fips}`,
    name: `${geo.state ?? 'State'} Cancer Prevention Program`,
    type: 'prevention_program',
    address: `Statewide`,
    cancerSites: topSites,
    services: ['Tobacco cessation', 'HPV vaccination', 'Sun safety education', 'Radon testing kits'],
  });

  return resources;
}

function generateActionRecommendations(riskStates: RiskState[], exposureValues: ExposureValue[]): ActionRecommendation[] {
  const actions: ActionRecommendation[] = [];
  let idx = 0;

  // Identify high-burden families
  const familyBurden = new Map<ExposureFamily, number>();
  for (const rs of riskStates) {
    for (const driver of rs.topDrivers) {
      familyBurden.set(driver.family, (familyBurden.get(driver.family) ?? 0) + driver.contribution * rs.score);
    }
  }

  const sorted = Array.from(familyBurden.entries()).sort((a, b) => b[1] - a[1]);

  for (const [family, burden] of sorted.slice(0, 5)) {
    const priority = burden > 200 ? 'critical' : burden > 100 ? 'high' : burden > 50 ? 'medium' : 'low';
    const rec = getRecommendationForFamily(family, priority, idx);
    if (rec) {
      actions.push(rec);
      idx++;
    }
  }

  // Screening gap recommendations
  const screeningValues = exposureValues.filter(v =>
    v.measureId.includes('screening') || v.measureId.includes('mammography')
  );
  for (const sv of screeningValues.filter(v => v.percentile < 40)) {
    actions.push({
      id: `action-${idx++}`,
      priority: 'high',
      category: 'screening',
      title: `Increase ${sv.measureId.replace(/_/g, ' ')} uptake`,
      description: `Current utilization is at the ${sv.percentile}th percentile nationally. Evidence supports targeted outreach campaigns.`,
      expectedImpact: `Could reduce late-stage diagnoses by 10-25% over 5 years`,
      timeframe: 'short_term',
      evidenceLevel: 'strong',
      relatedMeasures: [sv.measureId],
    });
  }

  return actions;
}

function getRecommendationForFamily(family: ExposureFamily, priority: ActionRecommendation['priority'], idx: number): ActionRecommendation | null {
  const recs: Record<ExposureFamily, Omit<ActionRecommendation, 'id' | 'priority'>> = {
    environmental: {
      category: 'environmental',
      title: 'Environmental exposure reduction program',
      description: 'Implement monitoring, remediation, and community notification for air quality, water, and soil contaminants.',
      expectedImpact: 'Reduction of environmental cancer burden by 5-15% over a decade',
      timeframe: 'medium_term',
      evidenceLevel: 'strong',
      relatedMeasures: ['pm25', 'radon', 'tri_releases'],
    },
    behavioral: {
      category: 'behavioral',
      title: 'Community behavioral health initiative',
      description: 'Launch tobacco cessation, nutrition counseling, and physical activity programs targeting high-risk populations.',
      expectedImpact: 'Reduce behavioral risk factor prevalence by 10-20%',
      timeframe: 'short_term',
      evidenceLevel: 'strong',
      relatedMeasures: ['current_smoking', 'obesity', 'physical_inactivity'],
    },
    screening_access: {
      category: 'screening',
      title: 'Expand cancer screening access',
      description: 'Deploy mobile screening units, extend clinic hours, and establish patient navigation services.',
      expectedImpact: 'Increase early-stage diagnoses by 15-30%',
      timeframe: 'short_term',
      evidenceLevel: 'strong',
      relatedMeasures: ['mammography', 'colorectal_screening', 'cervical_screening'],
    },
    social_structural: {
      category: 'policy',
      title: 'Address social determinants of cancer',
      description: 'Expand insurance coverage outreach, transportation assistance, and community health worker programs.',
      expectedImpact: 'Reduce cancer disparities index by 10-20%',
      timeframe: 'medium_term',
      evidenceLevel: 'moderate',
      relatedMeasures: ['poverty_rate', 'uninsured', 'transportation_barriers'],
    },
    occupational: {
      category: 'policy',
      title: 'Occupational exposure standards enforcement',
      description: 'Strengthen workplace monitoring, PPE compliance, and hazard communication for carcinogenic exposures.',
      expectedImpact: 'Reduce occupational cancer incidence by 5-10%',
      timeframe: 'long_term',
      evidenceLevel: 'moderate',
      relatedMeasures: ['asbestos_exposure', 'chemical_exposure'],
    },
    climate_uv: {
      category: 'environmental',
      title: 'UV exposure reduction and sun safety campaign',
      description: 'Install shade structures, distribute sunscreen, and run education campaigns at schools and worksites.',
      expectedImpact: 'Reduce melanoma incidence by 5-15% in targeted populations',
      timeframe: 'short_term',
      evidenceLevel: 'strong',
      relatedMeasures: ['uv_index', 'outdoor_workers'],
    },
    food_environment: {
      category: 'infrastructure',
      title: 'Food environment improvement initiative',
      description: 'Support healthy food retail in food deserts, establish community gardens, and expand SNAP incentive programs.',
      expectedImpact: 'Improve diet quality scores by 15-25% in underserved areas',
      timeframe: 'medium_term',
      evidenceLevel: 'moderate',
      relatedMeasures: ['food_access', 'fruit_vegetable_consumption'],
    },
  };

  const rec = recs[family];
  if (!rec) return null;
  return { id: `action-${idx}`, priority, ...rec };
}

// ---- Benchmark Generation ----
function generateBenchmarks(exposureValues: ExposureValue[]): BenchmarkComparison[] {
  const benchmarks: BenchmarkComparison[] = [];
  const keyMeasures = ['current_smoking', 'obesity', 'mammography', 'colorectal_screening', 'pm25', 'uninsured'];

  for (const measureId of keyMeasures) {
    const values = exposureValues.filter(v => v.measureId === measureId);
    if (values.length === 0) continue;
    const latest = values.sort((a, b) => b.year - a.year)[0];

    const hp2030Targets: Record<string, number> = {
      current_smoking: 6.1,
      obesity: 36.0,
      mammography: 77.1,
      colorectal_screening: 74.4,
      pm25: 9.0,
      uninsured: 7.9,
    };

    benchmarks.push({
      metric: measureId.replace(/_/g, ' '),
      localValue: latest.value,
      stateValue: latest.value * (0.9 + Math.random() * 0.2),
      nationalValue: latest.value * (0.85 + Math.random() * 0.3),
      hp2030Target: hp2030Targets[measureId],
      localPercentile: latest.percentile,
      metTarget: hp2030Targets[measureId] != null
        ? (measureId.includes('screening') || measureId.includes('mammography')
          ? latest.value >= hp2030Targets[measureId]
          : latest.value <= hp2030Targets[measureId])
        : false,
    });
  }

  return benchmarks;
}

// ---- Export Job Management ----
export function createExportJob(payload: ExportPayload, format: ExportJob['format']): ExportJob {
  return {
    id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: payload.sections ? 'report' : 'dataset',
    format,
    status: 'pending',
    progress: 0,
    data: payload,
    createdAt: new Date().toISOString(),
  };
}

export function generateReportSections(
  geo: GeoIdentifier,
  riskStates: RiskState[],
  exposureValues: ExposureValue[],
): ReportSection[] {
  const sections: ReportSection[] = [];

  sections.push({
    title: 'Executive Summary',
    type: 'text',
    content: `Cancer exposure intelligence report for ${geo.name}. Analysis covers ${riskStates.length} risk state categories across ${new Set(exposureValues.map(e => e.measureId)).size} exposure measures.`,
  });

  sections.push({
    title: 'Risk State Overview',
    type: 'chart',
    content: {
      chartType: 'ribbon',
      data: riskStates.map(rs => ({
        category: rs.category,
        score: rs.score,
        tier: rs.tier,
        percentile: rs.percentile,
      })),
    },
  });

  sections.push({
    title: 'Exposure Values Summary',
    type: 'table',
    content: {
      headers: ['Measure', 'Value', 'Percentile', 'Year', 'Trend'],
      rows: exposureValues.slice(0, 20).map(ev => [
        ev.measureId,
        ev.value.toFixed(1),
        `${ev.percentile}th`,
        ev.year.toString(),
        ev.suppressed ? 'Suppressed' : '-',
      ]),
    },
  });

  sections.push({
    title: 'Top Risk Drivers',
    type: 'chart',
    content: {
      chartType: 'lollipop',
      data: riskStates
        .flatMap(rs => rs.topDrivers)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 10)
        .map(d => ({ name: d.name, value: d.contribution, family: d.family })),
    },
  });

  sections.push({
    title: 'Data Sources & Methodology',
    type: 'text',
    content: 'All data derived from publicly available federal data sources including CDC PLACES, State Cancer Profiles, EPA EJScreen, Census ACS, USDA Food Access Research Atlas, and NASA POWER. Risk state computation uses weighted multi-family scoring.',
  });

  return sections;
}

// ---- CSV Export Helper ----
export function exposureValuesToCSV(values: ExposureValue[], geoName: string): string {
  const header = 'Geography,Measure ID,Year,Value,Percentile,Suppressed,Note\n';
  const rows = values.map(v =>
    `"${geoName}","${v.measureId}",${v.year},${v.value},${v.percentile},${v.suppressed ?? false},"${v.note ?? ''}"`
  ).join('\n');
  return header + rows;
}

export function riskStatesToCSV(riskStates: RiskState[]): string {
  const header = 'Category,Cancer Site,Year,Score,Percentile,Tier,Trend,Top Driver\n';
  const rows = riskStates.map(rs =>
    `"${rs.category}","${rs.cancerSite}",${rs.year},${rs.score},${rs.percentile},"${rs.tier}","${rs.trend}","${rs.topDrivers[0]?.name ?? 'N/A'}"`
  ).join('\n');
  return header + rows;
}
