import { describe, it, expect } from 'vitest';
import { getCountryFlagEmoji, formatLatencyBadge, summarizeMeshNetwork } from './telemetry';
import type { RemotePeer } from './mesh';

describe('getCountryFlagEmoji', () => {
  it('converts 2-letter ISO country codes to Unicode flag emoji', () => {
    expect(getCountryFlagEmoji('US')).toBe('🇺🇸');
    expect(getCountryFlagEmoji('us')).toBe('🇺🇸');
    expect(getCountryFlagEmoji('JP')).toBe('🇯🇵');
    expect(getCountryFlagEmoji('GB')).toBe('🇬🇧');
  });

  it('falls back to globe emoji for unknown, invalid, or missing codes', () => {
    expect(getCountryFlagEmoji(undefined)).toBe('🌐');
    expect(getCountryFlagEmoji('')).toBe('🌐');
    expect(getCountryFlagEmoji('XX')).toBe('🌐');
    expect(getCountryFlagEmoji('XYZ')).toBe('🌐');
  });
});

describe('formatLatencyBadge', () => {
  it('formats measured latency with unit and color', () => {
    const badge = formatLatencyBadge(45.4);
    expect(badge.text).toBe('45 ms');
    expect(badge.tier).toBe('optimal');
    expect(badge.color).toBe('#22c55e');
  });

  it('prefers EMA RTT over raw RTT if present', () => {
    const badge = formatLatencyBadge(120, 300);
    expect(badge.text).toBe('120 ms');
    expect(badge.tier).toBe('acceptable');
    expect(badge.color).toBe('#eab308');
  });

  it('handles unmeasured latency gracefully', () => {
    const badge = formatLatencyBadge(undefined, undefined);
    expect(badge.text).toBe('—');
    expect(badge.tier).toBe('unknown');
    expect(badge.color).toBe('#94a3b8');
  });
});

describe('summarizeMeshNetwork', () => {
  it('aggregates peer counts and computes average latency', () => {
    const peers: RemotePeer[] = [
      { id: 'p1', joinedAt: 1, emaRtt: 40 },
      { id: 'p2', joinedAt: 2, emaRtt: 160 },
      { id: 'p3', joinedAt: 3, emaRtt: 300 },
      { id: 'p4', joinedAt: 4 }, // unmeasured
    ];

    const summary = summarizeMeshNetwork(peers);
    expect(summary.total).toBe(4);
    expect(summary.optimal).toBe(1);
    expect(summary.acceptable).toBe(1);
    expect(summary.degraded).toBe(1);
    // Average of 40, 160, 300 is 500 / 3 = 167
    expect(summary.avgRtt).toBe(167);
  });

  it('handles empty network', () => {
    const summary = summarizeMeshNetwork([]);
    expect(summary.total).toBe(0);
    expect(summary.avgRtt).toBeNull();
  });
});
