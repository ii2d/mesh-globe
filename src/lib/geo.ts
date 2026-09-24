export interface GeoLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  countryCode?: string;
  isFallback?: boolean;
}

export const DEFAULT_LOCATION: GeoLocation = {
  lat: 0,
  lng: 0,
  city: 'Unknown',
  country: 'Global Mesh',
  countryCode: 'XX',
  isFallback: true,
};

const KM_PER_LAT_DEGREE = 111.32;

/**
 * Applies a bounded random jitter to latitude and longitude (~5–10 km)
 * to ensure city-level coarsening and privacy protection on the public mesh.
 */
export function applyCoordinateJitter(
  lat: number,
  lng: number,
  jitterDistanceKm = 8,
): { lat: number; lng: number } {
  // Ensure non-zero random offset between 0.2 and 1.0 of jitterDistanceKm
  const signLat = Math.random() < 0.5 ? -1 : 1;
  const signLng = Math.random() < 0.5 ? -1 : 1;
  const fractionLat = 0.2 + Math.random() * 0.8;
  const fractionLng = 0.2 + Math.random() * 0.8;

  const latOffsetKm = signLat * fractionLat * jitterDistanceKm;
  const latDeltaDeg = latOffsetKm / KM_PER_LAT_DEGREE;

  let newLat = lat + latDeltaDeg;
  // Clamp latitude to [-90, 90]
  newLat = Math.max(-90, Math.min(90, newLat));

  const cosLat = Math.max(0.01, Math.cos((newLat * Math.PI) / 180));
  const lngOffsetKm = signLng * fractionLng * jitterDistanceKm;
  const lngDeltaDeg = lngOffsetKm / (KM_PER_LAT_DEGREE * cosLat);

  let newLng = lng + lngDeltaDeg;
  // Wrap longitude to [-180, 180]
  while (newLng > 180) newLng -= 360;
  while (newLng < -180) newLng += 360;

  return {
    lat: Number(newLat.toFixed(4)),
    lng: Number(newLng.toFixed(4)),
  };
}

/**
 * Resolves the client's approximate location via public IP geolocation,
 * coarsening coordinates and falling back gracefully on failure or blocking.
 */
export async function resolveUserLocation(fetcher: typeof fetch = fetch): Promise<GeoLocation> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetcher('https://ipwho.is/', {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return DEFAULT_LOCATION;
    }

    const data = await response.json();

    const rawLat = Number(data.latitude ?? data.lat);
    const rawLng = Number(data.longitude ?? data.lng ?? data.lon);

    if (isNaN(rawLat) || isNaN(rawLng)) {
      return DEFAULT_LOCATION;
    }

    const { lat, lng } = applyCoordinateJitter(rawLat, rawLng);

    return {
      lat,
      lng,
      city: data.city || undefined,
      country: data.country || undefined,
      countryCode: data.country_code || data.countryCode || undefined,
      isFallback: false,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}
