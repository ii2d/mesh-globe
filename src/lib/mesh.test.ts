import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebCryptoSupported } from './mesh';

describe('isWebCryptoSupported', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      crypto: {
        subtle: {
          digest: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when window.crypto.subtle is present', () => {
    expect(isWebCryptoSupported()).toBe(true);
  });

  it('returns false when window.crypto.subtle is undefined', () => {
    vi.stubGlobal('window', {
      crypto: {},
    });
    expect(isWebCryptoSupported()).toBe(false);
  });

  it('returns false when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(isWebCryptoSupported()).toBe(false);
  });
});
