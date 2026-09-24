import { describe, it, expect } from 'vitest';
import { parsePeerMetadata, serializePeerMetadata, type PeerMetadata } from './protocol';

describe('protocol - PeerMetadata', () => {
  const validMeta: PeerMetadata = {
    type: 'meta',
    lat: 35.6762,
    lng: 139.6503,
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
  };

  it('serializes and parses valid metadata', () => {
    const serialized = serializePeerMetadata(validMeta);
    expect(serialized.type).toBe('meta');
    expect(serialized.lat).toBe(35.6762);

    const parsed = parsePeerMetadata(serialized);
    expect(parsed).toEqual(validMeta);
  });

  it('rejects payload with invalid type or structure', () => {
    expect(parsePeerMetadata(null)).toBeNull();
    expect(parsePeerMetadata(undefined)).toBeNull();
    expect(parsePeerMetadata('not-an-object')).toBeNull();
    expect(parsePeerMetadata({ type: 'ping' })).toBeNull();
  });

  it('rejects coordinates out of geographical range', () => {
    expect(parsePeerMetadata({ ...validMeta, lat: 91 })).toBeNull();
    expect(parsePeerMetadata({ ...validMeta, lat: -95 })).toBeNull();
    expect(parsePeerMetadata({ ...validMeta, lng: 181 })).toBeNull();
    expect(parsePeerMetadata({ ...validMeta, lng: -190 })).toBeNull();
    expect(parsePeerMetadata({ ...validMeta, lat: NaN })).toBeNull();
  });

  it('handles optional city and countryCode fields safely', () => {
    const minimal: PeerMetadata = {
      type: 'meta',
      lat: 0,
      lng: 0,
    };
    const parsed = parsePeerMetadata(minimal);
    expect(parsed).not.toBeNull();
    expect(parsed?.lat).toBe(0);
    expect(parsed?.lng).toBe(0);
  });
});
