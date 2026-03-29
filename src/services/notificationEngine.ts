// Exposure2Tumor — Notification & Watchlist Engine
// Alert generation, threshold monitoring, environmental event tracking

import type {
  WatchlistItem,
  WatchlistThreshold,
  Alert,
  EnvironmentalEvent,
  ExposureValue,
  ExposureFamily,
  CancerSite,
  GeoIdentifier,
  RiskState,
} from '../types';

// ---- Watchlist Engine ----
export function createWatchlistItem(
  geo: GeoIdentifier,
  cancerSite: CancerSite,
  measures: string[],
  thresholds: Array<{ measureId: string; operator: WatchlistThreshold['operator']; value: number }>,
): WatchlistItem {
  return {
    id: `watch-${geo.fips}-${cancerSite}-${Date.now()}`,
    geoId: geo.fips,
    geoName: geo.name,
    cancerSite,
    measures,
    thresholds: thresholds.map(t => ({
      ...t,
      measureName: t.measureId.replace(/_/g, ' '),
      currentValue: 0,
      triggered: false,
    })),
    status: 'normal',
    lastChecked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function evaluateWatchlistItem(
  item: WatchlistItem,
  currentValues: ExposureValue[],
  previousValues?: ExposureValue[],
): WatchlistItem {
  const updatedThresholds = item.thresholds.map(threshold => {
    const current = currentValues.find(v => v.measureId === threshold.measureId);
    if (!current) return { ...threshold, currentValue: 0, triggered: false };

    let triggered = false;
    switch (threshold.operator) {
      case 'above':
        triggered = current.value > threshold.value;
        break;
      case 'below':
        triggered = current.value < threshold.value;
        break;
      case 'change_exceeds': {
        const prev = previousValues?.find(v => v.measureId === threshold.measureId);
        if (prev) {
          triggered = Math.abs(current.value - prev.value) > threshold.value;
        }
        break;
      }
    }

    return {
      ...threshold,
      currentValue: current.value,
      triggered,
      triggeredAt: triggered ? new Date().toISOString() : threshold.triggeredAt,
    };
  });

  const anyTriggered = updatedThresholds.some(t => t.triggered);
  const previouslyTriggered = item.status === 'triggered';

  return {
    ...item,
    thresholds: updatedThresholds,
    status: anyTriggered ? 'triggered' : previouslyTriggered ? 'resolved' : 'normal',
    lastChecked: new Date().toISOString(),
  };
}

// ---- Alert Generation ----
export function generateAlertsFromRiskStates(
  riskStates: RiskState[],
  geo: GeoIdentifier,
): Alert[] {
  const alerts: Alert[] = [];

  for (const rs of riskStates) {
    // High burden alert
    if (rs.tier === 'very_high') {
      alerts.push({
        id: `alert-burden-${rs.category}-${rs.geoId}-${Date.now()}`,
        type: 'high_burden',
        severity: 'critical',
        title: `Very High ${formatCategory(rs.category)}`,
        description: `${geo.name} ranks in the ${rs.percentile}th percentile for ${formatCategory(rs.category)} (${rs.cancerSite}). Score: ${rs.score}/100.`,
        geoContext: geo,
        cancerSiteContext: rs.cancerSite,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    } else if (rs.tier === 'high') {
      alerts.push({
        id: `alert-burden-${rs.category}-${rs.geoId}-${Date.now()}`,
        type: 'high_burden',
        severity: 'warning',
        title: `Elevated ${formatCategory(rs.category)}`,
        description: `${geo.name} shows elevated ${formatCategory(rs.category)} for ${rs.cancerSite} at the ${rs.percentile}th percentile.`,
        geoContext: geo,
        cancerSiteContext: rs.cancerSite,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    // Trend alerts
    if (rs.trend === 'worsening') {
      alerts.push({
        id: `alert-trend-${rs.category}-${rs.geoId}-${Date.now()}`,
        type: 'trend_change',
        severity: rs.tier === 'high' || rs.tier === 'very_high' ? 'critical' : 'warning',
        title: `Worsening Trend: ${formatCategory(rs.category)}`,
        description: `${formatCategory(rs.category)} in ${geo.name} shows a worsening trend for ${rs.cancerSite}.`,
        geoContext: geo,
        cancerSiteContext: rs.cancerSite,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    // Screening gap alerts
    if (rs.category === 'preventive_access' && rs.percentile < 30) {
      alerts.push({
        id: `alert-screening-${rs.geoId}-${Date.now()}`,
        type: 'screening_gap',
        severity: 'warning',
        title: `Screening Access Gap`,
        description: `${geo.name} ranks at only the ${rs.percentile}th percentile for preventive access related to ${rs.cancerSite}. Screening utilization may be critically low.`,
        geoContext: geo,
        cancerSiteContext: rs.cancerSite,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  }

  return alerts;
}

// ---- Environmental Event Simulation ----
export function generateEnvironmentalEvents(
  geo: GeoIdentifier,
): EnvironmentalEvent[] {
  const events: EnvironmentalEvent[] = [];
  const lat = geo.latitude;
  const lng = geo.longitude;

  events.push({
    id: `env-aq-${geo.fips}-${Date.now()}`,
    type: 'air_quality_alert',
    title: 'Elevated PM2.5 Advisory',
    description: `Air quality monitoring stations near ${geo.name} report PM2.5 levels exceeding daily EPA standard. Sensitive groups advised to limit outdoor exposure.`,
    location: { latitude: lat, longitude: lng },
    affectedRadius: 30,
    affectedGeoIds: [geo.fips],
    severity: 'moderate',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    source: 'EPA AirNow',
    url: 'https://www.airnow.gov',
    relatedExposures: ['environmental'],
    cancerRelevance: [
      { site: 'lung', mechanism: 'PM2.5 particulate inhalation → oxidative stress → carcinogenesis', latencyYears: [10, 30] },
    ],
  });

  events.push({
    id: `env-tri-${geo.fips}-${Date.now()}`,
    type: 'industrial_release',
    title: 'TRI Facility Annual Report Update',
    description: `Updated Toxics Release Inventory data available for facilities within 25km of ${geo.name}. Review for carcinogenic compound releases.`,
    location: { latitude: lat + 0.05, longitude: lng - 0.03 },
    affectedRadius: 25,
    affectedGeoIds: [geo.fips],
    severity: 'low',
    startDate: new Date().toISOString(),
    source: 'EPA TRI',
    url: 'https://www.epa.gov/toxics-release-inventory-tri-program',
    relatedExposures: ['environmental', 'occupational'],
    cancerRelevance: [
      { site: 'lung', mechanism: 'Volatile organic compound inhalation', latencyYears: [5, 25] },
      { site: 'liver', mechanism: 'Hepatotoxic compound exposure', latencyYears: [10, 30] },
      { site: 'bladder', mechanism: 'Aromatic amine exposure pathway', latencyYears: [15, 40] },
    ],
  });

  events.push({
    id: `env-water-${geo.fips}-${Date.now()}`,
    type: 'water_contamination',
    title: 'Water Quality Advisory',
    description: `Routine water testing in ${geo.name} area detected trace contaminants. Monitoring ongoing; current levels below EPA MCLs.`,
    location: { latitude: lat - 0.02, longitude: lng + 0.04 },
    affectedRadius: 15,
    affectedGeoIds: [geo.fips],
    severity: 'low',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    source: 'EPA SDWIS',
    url: 'https://www.epa.gov/ground-water-and-drinking-water',
    relatedExposures: ['environmental'],
    cancerRelevance: [
      { site: 'bladder', mechanism: 'Disinfection byproduct chronic exposure', latencyYears: [20, 40] },
      { site: 'kidney', mechanism: 'Heavy metal nephrotoxicity and carcinogenesis', latencyYears: [15, 35] },
    ],
  });

  return events;
}

// ---- Notification Priority Scoring ----
export function scoreAlertPriority(alert: Alert): number {
  let score = 0;
  if (alert.severity === 'critical') score += 100;
  else if (alert.severity === 'warning') score += 60;
  else score += 20;

  if (alert.type === 'high_burden') score += 30;
  if (alert.type === 'trend_change') score += 25;
  if (alert.type === 'screening_gap') score += 20;
  if (alert.type === 'environmental_event') score += 35;

  if (!alert.readAt) score += 15;
  if (!alert.dismissed) score += 10;

  return score;
}

export function prioritizeAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => scoreAlertPriority(b) - scoreAlertPriority(a));
}

// ---- Helper ----
function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
