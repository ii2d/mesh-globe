export function parseRoomFromHash(hash: string): string {
  if (!hash) return 'global';

  // Strip leading hash character(s) and trim
  const cleaned = hash.replace(/^#+/, '').trim().toLowerCase();
  if (!cleaned) return 'global';

  // Allow alphanumeric, dashes, and underscores
  const sanitized = cleaned.replace(/[^a-z0-9_-]/g, '');
  return sanitized || 'global';
}

export function formatRoomHash(room: string): string {
  const sanitized = parseRoomFromHash(room);
  return `#${sanitized}`;
}

export function setupHashRouter(onRoomChange: (room: string) => void): {
  getRoom: () => string;
  setRoom: (room: string) => void;
  destroy: () => void;
} {
  const handler = () => {
    const room = parseRoomFromHash(window.location.hash);
    onRoomChange(room);
  };

  window.addEventListener('hashchange', handler);

  return {
    getRoom: () => parseRoomFromHash(window.location.hash),
    setRoom: (room: string) => {
      window.location.hash = formatRoomHash(room);
    },
    destroy: () => {
      window.removeEventListener('hashchange', handler);
    },
  };
}
