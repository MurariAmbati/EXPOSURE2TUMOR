// ============================================================
// Exposure2Tumor — Geospatial Data Layer Service
// Fetches and transforms multiscale geospatial data
// ============================================================

import { apiService } from './api';
import { clinicalDb } from './database';
import type {
  CancerSite,
  ExposureValue,
  CancerBurden,
  GeoIdentifier,
  GeographyLevel,
} from '../types';

class GeoDataService {
  // ---- Cancer Burden (State Cancer Profiles / USCS) ----
  async getCancerBurden(
    geoId: string,
    site: CancerSite,
    year?: number
  ): Promise<CancerBurden | null> {
    const cacheKey = `burden_${geoId}_${site}_${year ?? 'latest'}`;
    const cached = await clinicalDb.getCachedGeoData(cacheKey);
    if (cached) return cached as CancerBurden;

    try {
      const siteCodeMap: Partial<Record<CancerSite, string>> = {
        lung: '047',
        breast: '055',
        colorectal: '020',
        melanoma: '053',
        liver: '035',
        prostate: '066',
        cervical: '057',
      };

      const cancerCode = siteCodeMap[site] ?? '001';
      const stateCode = geoId.substring(0, 2);

      const [incData, mortData]: [any, any] = await Promise.all([
        apiService.getCancerProfile({
          area: stateCode,
          cancer: cancerCode,
          type: 'incidence',
        }),
        apiService.getCancerProfile({
          area: stateCode,
          cancer: cancerCode,
          type: 'mortality',
        }),
      ]);

      const burden: CancerBurden = {
        geoId,
        cancerSite: site,
        year: year ?? 2022,
        incidenceRate: incData?.data?.[0]?.rate ?? 0,
        mortalityRate: mortData?.data?.[0]?.rate ?? 0,
        ageAdjusted: true,
        source: {
          id: 'scp',
          name: 'State Cancer Profiles',
          abbreviation: 'SCP',
          url: 'https://statecancerprofiles.cancer.gov/',
          description: '',
          publisher: 'NCI / CDC',
          vintage: '2018-2022',
          releaseDate: '2025',
          geographyLevels: ['national', 'state', 'county'],
          updateFrequency: 'Annual',
          limitations: [],
          citation: '',
        },
        percentileNational: 50,
        trend: 'stable',
      };

      await clinicalDb.cacheGeoData(cacheKey, burden, 'scp', 'county', 168);
      return burden;
    } catch {
      return null;
    }
  }

  // ---- PLACES Behavioral / Screening Data ----
  async getPlacesMeasures(
    geoId: string,
    measures: string[]
  ): Promise<ExposureValue[]> {
    const values: ExposureValue[] = [];

    for (const measure of measures) {
      const cacheKey = `places_${geoId}_${measure}`;
      const cached = await clinicalDb.getCachedGeoData(cacheKey);
      if (cached) {
        values.push(cached as ExposureValue);
        continue;
      }

      try {
        const data: any = await apiService.getPlacesData({
          measure,
          geographicLevel: 'county',
          countyFips: geoId,
        });

        if (data && data.length > 0) {
          const val: ExposureValue = {
            measureId: `behavioral_${measure}`,
            geoId,
            year: 2023,
            value: parseFloat(data[0].data_value) || 0,
            percentile: parseFloat(data[0].data_value) || 50,
            confidence: data[0].low_confidence_limit && data[0].high_confidence_limit
              ? [parseFloat(data[0].low_confidence_limit), parseFloat(data[0].high_confidence_limit)]
              : undefined,
          };
          values.push(val);
          await clinicalDb.cacheGeoData(cacheKey, val, 'places', 'county', 168);
        }
      } catch {
        // Continue with available data
      }
    }

    return values;
  }

  // ---- EJScreen Environmental Data ----
  async getEnvironmentalBurden(
    latitude: number,
    longitude: number,
    geoId: string
  ): Promise<ExposureValue[]> {
    const cacheKey = `ejscreen_${geoId}`;
    const cached = await clinicalDb.getCachedGeoData(cacheKey);
    if (cached) return cached as ExposureValue[];

    try {
      const data: any = await apiService.getEJScreenData({
        geometry: `${longitude},${latitude}`,
      });

      const values: ExposureValue[] = [];

      if (data) {
        const ejMeasures: Record<string, string> = {
          'PM25': 'environmental_pm25',
          'OZONE': 'environmental_ozone',
          'DSLPM': 'environmental_diesel_pm',
          'CANCER': 'environmental_cancer_risk',
          'RESP': 'environmental_respiratory_hazard',
          'PTRAF': 'environmental_traffic_proximity',
          'PWDIS': 'environmental_wastewater_discharge',
          'PNPL': 'environmental_superfund_proximity',
          'PRMP': 'environmental_rmp_proximity',
          'PTSDF': 'environmental_hazwaste_proximity',
        };

        for (const [key, measureId] of Object.entries(ejMeasures)) {
          if (data[key] !== undefined) {
            values.push({
              measureId,
              geoId,
              year: 2024,
              value: parseFloat(data[key]) || 0,
              percentile: parseFloat(data[`${key}_PER`]) || 50,
            });
          }
        }
      }

      if (values.length > 0) {
        await clinicalDb.cacheGeoData(cacheKey, values, 'ejscreen', 'blockgroup', 168);
      }
      return values;
    } catch {
      return [];
    }
  }

  // ---- SVI Social Vulnerability ----
  async getSocialVulnerability(geoId: string): Promise<ExposureValue[]> {
    const cacheKey = `svi_${geoId}`;
    const cached = await clinicalDb.getCachedGeoData(cacheKey);
    if (cached) return cached as ExposureValue[];

    try {
      const stateCode = geoId.substring(0, 2);
      const data: any = await apiService.getACSData({
        variables: [
          'B17001_002E', // below poverty
          'B17001_001E', // total for poverty
          'B25003_003E', // renters
          'B25003_001E', // total housing
          'B08301_001E', // total commuters
          'B08301_010E', // public transport
          'B27010_001E', // insurance universe
          'B27010_017E', // no insurance 19-34
        ],
        forGeo: `county:${geoId.substring(2)}`,
        inGeo: `state:${stateCode}`,
      });

      const values: ExposureValue[] = [];

      if (data && data.length > 1) {
        const row = data[1]; // first row is headers
        const povertyRate = row[1] > 0 ? (row[0] / row[1]) * 100 : 0;
        const renterRate = row[3] > 0 ? (row[2] / row[3]) * 100 : 0;

        values.push(
          {
            measureId: 'social_structural_poverty_rate',
            geoId,
            year: 2023,
            value: povertyRate,
            percentile: Math.min(100, povertyRate * 3.5),
          },
          {
            measureId: 'social_structural_renter_rate',
            geoId,
            year: 2023,
            value: renterRate,
            percentile: Math.min(100, renterRate * 1.5),
          }
        );
      }

      if (values.length > 0) {
        await clinicalDb.cacheGeoData(cacheKey, values, 'acs', 'county', 720);
      }
      return values;
    } catch {
      return [];
    }
  }

  // ---- Food Environment ----
  async getFoodEnvironment(geoId: string): Promise<ExposureValue[]> {
    // USDA data is typically downloaded — use cached/bundled for v1
    return [
      {
        measureId: 'food_environment_access_low',
        geoId,
        year: 2019,
        value: 0,
        percentile: 50,
        note: 'Placeholder — connect USDA FARA download',
      },
      {
        measureId: 'food_environment_desert_pct',
        geoId,
        year: 2019,
        value: 0,
        percentile: 50,
        note: 'Placeholder — connect USDA FEA download',
      },
    ];
  }

  // ---- Occupational Context (ACS) ----
  async getOccupationalContext(geoId: string): Promise<ExposureValue[]> {
    const cacheKey = `occupation_${geoId}`;
    const cached = await clinicalDb.getCachedGeoData(cacheKey);
    if (cached) return cached as ExposureValue[];

    try {
      const stateCode = geoId.substring(0, 2);
      const data: any = await apiService.getACSData({
        variables: [
          'C24010_001E', // total employed
          'C24010_007E', // natural resources / construction / maintenance
          'C24010_012E', // production / transportation
        ],
        forGeo: `county:${geoId.substring(2)}`,
        inGeo: `state:${stateCode}`,
      });

      const values: ExposureValue[] = [];

      if (data && data.length > 1) {
        const row = data[1].map(Number);
        const totalEmployed = row[0];
        const manualPct = totalEmployed > 0 ? ((row[1] + row[2]) / totalEmployed) * 100 : 0;

        values.push({
          measureId: 'occupational_manual_pct',
          geoId,
          year: 2023,
          value: manualPct,
          percentile: Math.min(100, manualPct * 2),
        });
      }

      if (values.length > 0) {
        await clinicalDb.cacheGeoData(cacheKey, values, 'acs', 'county', 720);
      }
      return values;
    } catch {
      return [];
    }
  }

  // ---- UV / Climate Data ----
  async getClimateUV(latitude: number, longitude: number, geoId: string): Promise<ExposureValue[]> {
    const cacheKey = `climate_uv_${geoId}`;
    const cached = await clinicalDb.getCachedGeoData(cacheKey);
    if (cached) return cached as ExposureValue[];

    try {
      const data: any = await apiService.getNASAPowerData({
        latitude,
        longitude,
        parameters: ['ALLSKY_SFC_UV_INDEX', 'ALLSKY_SFC_SW_DWN'],
        startDate: '2023-01',
        endDate: '2023-12',
      });

      const values: ExposureValue[] = [];

      if (data?.properties?.parameter) {
        const uvIndex = data.properties.parameter['ALLSKY_SFC_UV_INDEX'];
        const solarRad = data.properties.parameter['ALLSKY_SFC_SW_DWN'];

        if (uvIndex) {
          const avgUV = Object.values(uvIndex).reduce((sum: number, v: any) => sum + (v || 0), 0) / 12;
          values.push({
            measureId: 'climate_uv_annual_avg',
            geoId,
            year: 2023,
            value: avgUV as number,
            percentile: Math.min(100, (avgUV as number) * 12),
          });
        }

        if (solarRad) {
          const avgSolar = Object.values(solarRad).reduce((sum: number, v: any) => sum + (v || 0), 0) / 12;
          values.push({
            measureId: 'climate_uv_solar_radiation',
            geoId,
            year: 2023,
            value: avgSolar as number,
            percentile: Math.min(100, (avgSolar as number) * 15),
          });
        }
      }

      if (values.length > 0) {
        await clinicalDb.cacheGeoData(cacheKey, values, 'nasa_power', 'county', 720);
      }
      return values;
    } catch {
      return [];
    }
  }

  // ---- Aggregate All Exposure Data for a Geography ----
  async getAllExposureData(
    geo: GeoIdentifier,
    site: CancerSite
  ): Promise<ExposureValue[]> {
    const allValues: ExposureValue[] = [];

    const placesMeasures = [
      'CSMOKING', 'OBESITY', 'LPA', 'BINGE', 'MAMMOUSE', 'COLON_SCREEN',
      'ACCESS2', 'CHECKUP', 'DENTAL', 'MHLTH', 'PHLTH',
    ];

    const results = await Promise.allSettled([
      this.getPlacesMeasures(geo.fips, placesMeasures),
      this.getEnvironmentalBurden(geo.latitude, geo.longitude, geo.fips),
      this.getSocialVulnerability(geo.fips),
      this.getFoodEnvironment(geo.fips),
      this.getOccupationalContext(geo.fips),
      this.getClimateUV(geo.latitude, geo.longitude, geo.fips),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allValues.push(...result.value);
      }
    }

    return allValues;
  }
}

export const geoDataService = new GeoDataService();
