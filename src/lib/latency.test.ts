import { describe, it, expect } from 'vitest';
import {
  calculateRtt,
  updateEma,
  getLatencyTier,
  getLatencyColor,
  getArcStrokeSpeed,
  LATENCY_THRESHOLDS,
} from './latency';

describe('calculateRtt', () => {
  it('computes positive round-trip time from send timestamp and receive time', () => {
    const sentTime = 1000;
    const now = 1085;
    const rtt = calculateRtt(sentTime, now);
    expect(rtt).toBe(85);
  });

  it('protects against negative RTT or clock skew anomalies', () => {
    const sentTime = 1000;
    const skewedNow = 950; // Local clock shifted backwards
    const rtt = calculateRtt(sentTime, skewedNow);
    expect(rtt).toBeGreaterThanOrEqual(1);
  });
});

describe('updateEma', () => {
  it('initializes with the first sample when current EMA is null or undefined', () => {
    expect(updateEma(null, 50)).toBe(50);
    expect(updateEma(undefined, 80)).toBe(80);
  });

  it('smooths values using exponential moving average formula', () => {
    // With alpha = 0.25: ema = 0.25 * 100 + 0.75 * 50 = 25 + 37.5 = 62.5
    const smoothed = updateEma(50, 100, 0.25);
    expect(smoothed).toBe(62.5);
  });

  it('dampens sudden spikes in network latency', () => {
    let ema = 40;
    // Sudden spike to 400ms
    ema = updateEma(ema, 400, 0.2);
    // 0.2 * 400 + 0.8 * 40 = 80 + 32 = 112
    expect(ema).toBe(112);
  });
});

describe('getLatencyTier & colors', () => {
  it('identifies optimal latency (< 100ms)', () => {
    expect(getLatencyTier(45)).toBe('optimal');
    expect(getLatencyColor(45)).toBe(LATENCY_THRESHOLDS.optimal.color);
  });

  it('identifies acceptable latency (100ms - 250ms)', () => {
    expect(getLatencyTier(100)).toBe('acceptable');
    expect(getLatencyTier(180)).toBe('acceptable');
    expect(getLatencyTier(250)).toBe('acceptable');
    expect(getLatencyColor(180)).toBe(LATENCY_THRESHOLDS.acceptable.color);
  });

  it('identifies degraded latency (> 250ms)', () => {
    expect(getLatencyTier(251)).toBe('degraded');
    expect(getLatencyTier(500)).toBe('degraded');
    expect(getLatencyColor(500)).toBe(LATENCY_THRESHOLDS.degraded.color);
  });
});

describe('getArcStrokeSpeed', () => {
  it('scales particle velocity inversely with latency (faster for lower RTT)', () => {
    const fastSpeed = getArcStrokeSpeed(30);
    const slowSpeed = getArcStrokeSpeed(400);
    expect(fastSpeed).toBeGreaterThan(slowSpeed);
  });
});
