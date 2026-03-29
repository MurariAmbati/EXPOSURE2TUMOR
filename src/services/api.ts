// ============================================================
// Exposure2Tumor — API Service Layer
// Centralized data fetching from public health APIs
// ============================================================

const API_TIMEOUT = 30000;

interface FetchOptions {
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiService {
  private baseHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  private buildUrl(baseUrl: string, params?: Record<string, string | number>): string {
    if (!params) return baseUrl;
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value));
    }
    return `${baseUrl}?${searchParams.toString()}`;
  }

  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const fullUrl = this.buildUrl(url, options?.params);
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { ...this.baseHeaders, ...options?.headers },
        signal: options?.signal ?? controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---- CDC PLACES API ----
  async getPlacesData(params: {
    measure: string;
    geographicLevel: string;
    stateAbbr?: string;
    countyFips?: string;
  }) {
    const baseUrl = 'https://data.cdc.gov/resource/swc5-untb.json';
    return this.get(baseUrl, {
      params: {
        measure: params.measure,
        data_value_type: 'Age-adjusted prevalence',
        ...(params.stateAbbr && { stateabbr: params.stateAbbr }),
        ...(params.countyFips && { countyfips: params.countyFips }),
        '$limit': 5000,
      },
    });
  }

  // ---- State Cancer Profiles ----
  async getCancerProfile(params: {
    area: string;
    cancer: string;
    type: 'incidence' | 'mortality';
    race?: string;
    sex?: string;
  }) {
    const baseUrl = 'https://statecancerprofiles.cancer.gov/data-topics/data.json';
    return this.get(baseUrl, {
      params: {
        areatype: 'county',
        area: params.area,
        cancer: params.cancer,
        type: params.type,
        race: params.race ?? '00',
        sex: params.sex ?? '0',
        stage: '999',
        year: '0',
        age: '001',
      },
    });
  }

  // ---- EPA EJScreen ----
  async getEJScreenData(params: {
    geometry: string;
    distance?: number;
  }) {
    const baseUrl = 'https://ejscreen.epa.gov/mapper/ejscreenRESTbroker1.aspx';
    return this.get(baseUrl, {
      params: {
        geometry: params.geometry,
        distance: params.distance ?? 1,
        unit: 'miles',
        namestr: '',
      },
    });
  }

  // ---- Census ACS ----
  async getACSData(params: {
    variables: string[];
    forGeo: string;
    inGeo?: string;
    year?: number;
  }) {
    const year = params.year ?? 2023;
    const baseUrl = `https://api.census.gov/data/${year}/acs/acs5`;
    return this.get(baseUrl, {
      params: {
        get: params.variables.join(','),
        for: params.forGeo,
        ...(params.inGeo && { in: params.inGeo }),
      },
    });
  }

  // ---- CDC Tracking API ----
  async getCDCTrackingData(params: {
    measureId: string;
    stateId?: string;
    temporalType?: string;
    isSmoothed?: number;
  }) {
    const baseUrl = 'https://ephtracking.cdc.gov/apigateway/api/v1/getCoreHolder';
    return this.get(baseUrl, {
      params: {
        measureId: params.measureId,
        ...(params.stateId && { stateId: params.stateId }),
        temporalColumnName: params.temporalType ?? 'Year',
        isSmoothed: params.isSmoothed ?? 0,
      },
    });
  }

  // ---- NASA POWER (UV/Climate) ----
  async getNASAPowerData(params: {
    latitude: number;
    longitude: number;
    parameters: string[];
    startDate: string;
    endDate: string;
  }) {
    const baseUrl = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
    return this.get(baseUrl, {
      params: {
        parameters: params.parameters.join(','),
        community: 'RE',
        longitude: params.longitude,
        latitude: params.latitude,
        start: params.startDate.replace(/-/g, ''),
        end: params.endDate.replace(/-/g, ''),
        format: 'JSON',
      },
    });
  }
}

export const apiService = new ApiService();
