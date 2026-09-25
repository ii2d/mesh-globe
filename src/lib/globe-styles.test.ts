import { describe, it, expect } from 'vitest';
import { GLOBE_STYLES, getGlobeStyle, DEFAULT_STYLE_ID } from './globe-styles';

describe('globe-styles', () => {
  it('defines all required preset styles', () => {
    expect(GLOBE_STYLES.night).toBeDefined();
    expect(GLOBE_STYLES.satellite).toBeDefined();
    expect(GLOBE_STYLES.cyber).toBeDefined();
  });

  it('provides correct default style', () => {
    expect(DEFAULT_STYLE_ID).toBe('night');
    const style = getGlobeStyle('night');
    expect(style.id).toBe('night');
    expect(style.atmosphereColor).toBe('#38bdf8');
  });

  it('falls back to default style on unknown style id', () => {
    // @ts-expect-error Testing fallback
    const style = getGlobeStyle('unknown-style');
    expect(style.id).toBe('night');
  });

  it('ensures each style specifies valid image urls and colors', () => {
    for (const style of Object.values(GLOBE_STYLES)) {
      expect(style.globeImageUrl).toBeTruthy();
      expect(style.atmosphereColor).toBeTruthy();
      expect(style.borderStrokeColor).toBeTruthy();
      expect(style.hoverFillColor).toBeTruthy();
      expect(style.atmosphereAltitude).toBeGreaterThan(0);
    }
  });
});
