export type LatencyTier = 'optimal' | 'acceptable' | 'degraded';

export const LATENCY_THRESHOLDS = {
  optimal: {
    maxMs: 100,
    color: '#22c55e',
    label: 'Optimal',
  },
  acceptable: {
    maxMs: 250,
    color: '#eab308',
    label: 'Acceptable',
  },
  degraded: {
    maxMs: Infinity,
    color: '#ef4444',
    label: 'Degraded',
  },
} as const;

/**
 * Calculates Round-Trip Time from send time and receive time with clock skew tolerance.
 */
export function calculateRtt(sentTimestamp: number, receivedTimestamp: number): number {
  const rawRtt = receivedTimestamp - sentTimestamp;
  // If local timestamp is skewed backwards or jittered, clamp to minimum 1ms
  return Math.max(1, Math.round(rawRtt));
}

/**
 * Updates an Exponential Moving Average with a new latency sample.
 * @param currentEma The existing EMA value, or null/undefined if uninitialized
 * @param newSample The latest measured RTT
 * @param alpha Smoothing factor (0 < alpha <= 1). Default 0.25
 */
export function updateEma(
  currentEma: number | null | undefined,
  newSample: number,
  alpha = 0.25,
): number {
  if (currentEma === null || currentEma === undefined || isNaN(currentEma)) {
    return Math.round(newSample * 10) / 10;
  }
  const smoothed = alpha * newSample + (1 - alpha) * currentEma;
  return Math.round(smoothed * 10) / 10;
}

/**
 * Determines latency tier based on SPEC thresholds.
 */
export function getLatencyTier(rttMs: number): LatencyTier {
  if (rttMs < LATENCY_THRESHOLDS.optimal.maxMs) {
    return 'optimal';
  }
  if (rttMs <= LATENCY_THRESHOLDS.acceptable.maxMs) {
    return 'acceptable';
  }
  return 'degraded';
}

/**
 * Returns hex color code for the given round-trip latency.
 */
export function getLatencyColor(rttMs: number): string {
  const tier = getLatencyTier(rttMs);
  return LATENCY_THRESHOLDS[tier].color;
}

/**
 * Computes animated arc stroke dash speed for globe.gl.
 * Lower latency peers animate faster (e.g. 0.04), higher latency slower (e.g. 0.008).
 */
export function getArcStrokeSpeed(rttMs: number): number {
  // Map 20ms..500ms to 0.05..0.008
  const clamped = Math.max(20, Math.min(600, rttMs));
  const fraction = (clamped - 20) / (600 - 20); // 0 (fast) to 1 (slow)
  return Number((0.045 - fraction * 0.035).toFixed(4));
}
