import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppVersion } from './version';

describe('getAppVersion', () => {
  beforeEach(() => {
    vi.stubGlobal('__APP_VERSION__', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns fallback version "dev" when global __APP_VERSION__ is undefined', () => {
    expect(getAppVersion()).toBe('dev');
  });

  it('returns the injected build version when __APP_VERSION__ is defined', () => {
    vi.stubGlobal('__APP_VERSION__', 'v1.0.0-58746de');
    expect(getAppVersion()).toBe('v1.0.0-58746de');
  });
});
