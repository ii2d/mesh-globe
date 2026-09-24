import { describe, it, expect } from 'vitest';
import { parseRoomFromHash, formatRoomHash } from './router';

describe('parseRoomFromHash', () => {
  it('defaults to "global" when hash is empty, "#", or whitespace', () => {
    expect(parseRoomFromHash('')).toBe('global');
    expect(parseRoomFromHash('#')).toBe('global');
    expect(parseRoomFromHash('   ')).toBe('global');
    expect(parseRoomFromHash('#   ')).toBe('global');
  });

  it('extracts and sanitizes room name from valid hash', () => {
    expect(parseRoomFromHash('#team-tokyo')).toBe('team-tokyo');
    expect(parseRoomFromHash('team-tokyo')).toBe('team-tokyo');
    expect(parseRoomFromHash('#Dev-Room-1')).toBe('dev-room-1');
  });

  it('strips illegal characters and falls back to "global" if nothing valid remains', () => {
    expect(parseRoomFromHash('#room!@#$%^&*()_+')).toBe('room_');
    expect(parseRoomFromHash('#$$$')).toBe('global');
  });
});

describe('formatRoomHash', () => {
  it('formats room as URL hash prefix', () => {
    expect(formatRoomHash('global')).toBe('#global');
    expect(formatRoomHash('team-1')).toBe('#team-1');
  });
});
