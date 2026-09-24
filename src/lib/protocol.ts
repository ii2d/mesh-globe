export interface PeerMetadata {
  [key: string]: string | number | undefined;
  type: 'meta';
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface PingMessage {
  [key: string]: string | number | undefined;
  type: 'ping';
  id: string;
  t: number;
}

export interface PongMessage {
  [key: string]: string | number | undefined;
  type: 'pong';
  id: string;
  t: number;
}

export type NetworkMessage = PeerMetadata | PingMessage | PongMessage;

export function serializePeerMetadata(meta: PeerMetadata): PeerMetadata {
  return {
    type: 'meta',
    lat: meta.lat,
    lng: meta.lng,
    city: meta.city,
    country: meta.country,
    countryCode: meta.countryCode,
  };
}

export function parsePeerMetadata(payload: unknown): PeerMetadata | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (candidate.type !== 'meta') {
    return null;
  }

  const lat = Number(candidate.lat);
  const lng = Number(candidate.lng);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    type: 'meta',
    lat,
    lng,
    city: typeof candidate.city === 'string' ? candidate.city : undefined,
    country: typeof candidate.country === 'string' ? candidate.country : undefined,
    countryCode: typeof candidate.countryCode === 'string' ? candidate.countryCode : undefined,
  };
}
