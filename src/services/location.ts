// ============================================================
// Exposure2Tumor — Location & Geocoding Services
// ============================================================

import * as Location from 'expo-location';
import type { GeoIdentifier, GeographyLevel } from '../types';

class LocationService {
  private lastKnownLocation: Location.LocationObject | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    const granted = await this.requestPermissions();
    if (!granted) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    this.lastKnownLocation = location;
    return location;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const r = results[0];
      return [r.city, r.region].filter(Boolean).join(', ');
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  async getGeoIdentifierFromCoords(
    latitude: number,
    longitude: number
  ): Promise<GeoIdentifier | null> {
    try {
      // Use FCC Census Geocoder API to get FIPS from coordinates
      const response = await fetch(
        `https://geo.fcc.gov/api/census/area?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          fips: result.county_fips,
          level: 'county' as GeographyLevel,
          name: result.county_name,
          state: result.state_name,
          stateFips: result.state_fips,
          county: result.county_name,
          countyFips: result.county_fips,
          latitude,
          longitude,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async searchGeography(query: string): Promise<GeoIdentifier[]> {
    try {
      const response = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
      );
      const data = await response.json();

      const matches = data?.result?.addressMatches ?? [];
      return matches.map((match: any) => ({
        fips: match.geographies?.Counties?.[0]?.GEOID ?? '',
        level: 'county' as GeographyLevel,
        name: match.geographies?.Counties?.[0]?.NAME ?? match.matchedAddress,
        state: match.geographies?.States?.[0]?.NAME ?? '',
        stateFips: match.geographies?.States?.[0]?.STATE ?? '',
        county: match.geographies?.Counties?.[0]?.NAME ?? '',
        countyFips: match.geographies?.Counties?.[0]?.GEOID ?? '',
        latitude: match.coordinates.y,
        longitude: match.coordinates.x,
      }));
    } catch {
      return [];
    }
  }

  getLastKnownLocation() {
    return this.lastKnownLocation;
  }
}

export const locationService = new LocationService();
