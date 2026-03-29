// ============================================================
// Exposure2Tumor — Custom Hooks
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { geoDataService, computeRiskStates, computeExposureRibbon, locationService } from '../services';
import type { CancerSite, GeoIdentifier, ExposureValue, RiskState, ExposureRibbonData } from '../types';

// ---- Debounce Hook ----
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---- Location Hook ----
export function useCurrentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        if (mounted && loc) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { location, loading, error };
}

// ---- Geography Lookup Hook ----
export function useGeoLookup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoIdentifier[]>([]);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const geos = await locationService.searchGeography(query);
      setResults(geos);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupCoords = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const geo = await locationService.getGeoIdentifierFromCoords(lat, lng);
      setResults(geo ? [geo] : []);
      return geo;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, lookupCoords, results, loading };
}

// ---- Exposure Data Hook ----
export function useExposureData(geo: GeoIdentifier | null, site: CancerSite) {
  const [exposureValues, setExposureValues] = useState<ExposureValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!geo) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const values = await geoDataService.getAllExposureData(geo, site);
        if (!cancelled) setExposureValues(values);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [geo?.fips, site]);

  return { exposureValues, loading, error };
}

// ---- Risk States Hook ----
export function useRiskStates(geo: GeoIdentifier | null, site: CancerSite) {
  const [riskStates, setRiskStates] = useState<RiskState[]>([]);
  const { exposureValues, loading: expLoading } = useExposureData(geo, site);

  useEffect(() => {
    if (!geo || exposureValues.length === 0) return;
    const states = computeRiskStates(geo.fips, site, new Date().getFullYear(), exposureValues);
    setRiskStates(states);
  }, [geo?.fips, site, exposureValues]);

  return { riskStates, loading: expLoading, exposureValues };
}

// ---- Exposure Ribbon Hook ----
export function useExposureRibbon(geo: GeoIdentifier | null, site: CancerSite) {
  const [ribbon, setRibbon] = useState<ExposureRibbonData | null>(null);
  const { exposureValues, loading } = useExposureData(geo, site);

  useEffect(() => {
    if (!geo || exposureValues.length === 0) return;
    const ribbonData = computeExposureRibbon(geo.fips, geo.name, site, exposureValues);
    setRibbon(ribbonData);
  }, [geo?.fips, site, exposureValues]);

  return { ribbon, loading };
}

// ---- Timer / Polling Hook ----
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
