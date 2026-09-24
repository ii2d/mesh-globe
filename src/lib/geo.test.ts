import { describe, it, expect, vi } from 'vitest';
import { applyCoordinateJitter, resolveUserLocation, DEFAULT_LOCATION } from './geo';

describe('applyCoordinateJitter', () => {
  it('offsets coordinates by a bounded amount', () => {
    const lat = 37.7749;
    const lng = -122.4194;
    const jittered = applyCoordinateJitter(lat, lng, 8);

    // Delta should not be 0
    expect(jittered.lat).not.toBe(lat);
    expect(jittered.lng).not.toBe(lng);

    // Delta in latitude degrees (1 deg lat ~ 111 km, 8 km ~ 0.072 deg)
    const latDeltaKm = Math.abs(jittered.lat - lat) * 111;
    expect(latDeltaKm).toBeLessThanOrEqual(15);
    expect(latDeltaKm).toBeGreaterThan(0);
  });

  it('clamps latitude within [-90, 90]', () => {
    const nearNorthPole = applyCoordinateJitter(89.99, 0, 10);
    expect(nearNorthPole.lat).toBeLessThanOrEqual(90);
    expect(nearNorthPole.lat).toBeGreaterThanOrEqual(-90);

    const nearSouthPole = applyCoordinateJitter(-89.99, 0, 10);
    expect(nearSouthPole.lat).toBeGreaterThanOrEqual(-90);
    expect(nearSouthPole.lat).toBeLessThanOrEqual(90);
  });

  it('wraps longitude within [-180, 180]', () => {
    const nearDateLine = applyCoordinateJitter(0, 179.99, 10);
    expect(nearDateLine.lng).toBeLessThanOrEqual(180);
    expect(nearDateLine.lng).toBeGreaterThanOrEqual(-180);
  });
});

describe('resolveUserLocation', () => {
  it('resolves location with coarsened coordinates on successful API response', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        country: 'United States',
        country_code: 'US',
      }),
    } as unknown as Response);

    const location = await resolveUserLocation(mockFetcher);

    expect(location.city).toBe('New York');
    expect(location.country).toBe('United States');
    expect(location.countryCode).toBe('US');
    // Coordinates should be valid numbers near NYC
    expect(location.lat).toBeCloseTo(40.71, 0.5);
    expect(location.lng).toBeCloseTo(-74.0, 0.5);
    // Coordinate jitter ensures privacy
    expect(location.lat).not.toBe(40.7128);
  });

  it('falls back to DEFAULT_LOCATION on network error', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network offline or blocked'));

    const location = await resolveUserLocation(mockFetcher);

    expect(location.lat).toBe(DEFAULT_LOCATION.lat);
    expect(location.lng).toBe(DEFAULT_LOCATION.lng);
    expect(location.isFallback).toBe(true);
  });

  it('falls back to DEFAULT_LOCATION on non-ok HTTP status', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as unknown as Response);

    const location = await resolveUserLocation(mockFetcher);

    expect(location.lat).toBe(DEFAULT_LOCATION.lat);
    expect(location.lng).toBe(DEFAULT_LOCATION.lng);
    expect(location.isFallback).toBe(true);
  });
});
