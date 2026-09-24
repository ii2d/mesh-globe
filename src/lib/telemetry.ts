import type { RemotePeer } from './mesh';
import { getLatencyColor, getLatencyTier, type LatencyTier } from './latency';

/**
 * Converts a 2-letter ISO country code into a Unicode flag emoji.
 * Falls back to 🌐 for invalid, missing, or unknown country codes.
 */
export function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return '🌐';
  }

  const code = countryCode.toUpperCase();
  if (code === 'XX' || !/^[A-Z]{2}$/.test(code)) {
    return '🌐';
  }

  // Regional Indicator Symbol Letter A is 127462 (0x1F1E6), 'A'.charCodeAt(0) is 65
  const firstChar = 127397 + code.charCodeAt(0);
  const secondChar = 127397 + code.charCodeAt(1);

  return String.fromCodePoint(firstChar, secondChar);
}

export interface LatencyBadge {
  text: string;
  color: string;
  tier: LatencyTier | 'unknown';
}

/**
 * Formats peer latency readout and color badge.
 */
export function formatLatencyBadge(emaRtt?: number, rtt?: number): LatencyBadge {
  const value = emaRtt ?? rtt;

  if (value === undefined || isNaN(value)) {
    return {
      text: '—',
      color: '#94a3b8',
      tier: 'unknown',
    };
  }

  const rounded = Math.round(value);
  const tier = getLatencyTier(rounded);
  const color = getLatencyColor(rounded);

  return {
    text: `${rounded} ms`,
    color,
    tier,
  };
}

export interface MeshSummary {
  total: number;
  optimal: number;
  acceptable: number;
  degraded: number;
  avgRtt: number | null;
}

/**
 * Aggregates connectivity and latency metrics across active mesh peers.
 */
export function summarizeMeshNetwork(peers: RemotePeer[]): MeshSummary {
  let optimal = 0;
  let acceptable = 0;
  let degraded = 0;
  let sumRtt = 0;
  let measuredCount = 0;

  for (const peer of peers) {
    const rtt = peer.emaRtt ?? peer.rtt;
    if (rtt !== undefined && !isNaN(rtt)) {
      measuredCount++;
      sumRtt += rtt;
      const tier = getLatencyTier(rtt);
      if (tier === 'optimal') optimal++;
      else if (tier === 'acceptable') acceptable++;
      else if (tier === 'degraded') degraded++;
    }
  }

  const avgRtt = measuredCount > 0 ? Math.round(sumRtt / measuredCount) : null;

  return {
    total: peers.length,
    optimal,
    acceptable,
    degraded,
    avgRtt,
  };
}
