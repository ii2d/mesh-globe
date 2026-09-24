import { describe, it, expect } from 'vitest';
import { createPeerStore, DEFAULT_MAX_PEERS } from './peer-store';
import type { RemotePeer } from './mesh';

describe('createPeerStore', () => {
  it('initializes with default soft cap of 25 peers', () => {
    const store = createPeerStore();
    expect(store.maxPeers).toBe(DEFAULT_MAX_PEERS);
    expect(store.maxPeers).toBe(25);
    expect(store.canAcceptPeer()).toBe(true);
    expect(store.isAtCapacity()).toBe(false);
  });

  it('accepts peers up to the maximum capacity limit', () => {
    const store = createPeerStore({ maxPeers: 3 });

    const p1: RemotePeer = { id: 'p1', joinedAt: 1 };
    const p2: RemotePeer = { id: 'p2', joinedAt: 2 };
    const p3: RemotePeer = { id: 'p3', joinedAt: 3 };
    const p4: RemotePeer = { id: 'p4', joinedAt: 4 };

    expect(store.addPeer(p1)).toBe(true);
    expect(store.addPeer(p2)).toBe(true);
    expect(store.addPeer(p3)).toBe(true);

    expect(store.isAtCapacity()).toBe(true);
    expect(store.canAcceptPeer()).toBe(false);

    // 4th peer should be rejected/throttled
    expect(store.addPeer(p4)).toBe(false);
    expect(store.getPeers().length).toBe(3);
  });

  it('allows new peer after a peer disconnects and is removed', () => {
    const store = createPeerStore({ maxPeers: 2 });
    store.addPeer({ id: 'p1', joinedAt: 1 });
    store.addPeer({ id: 'p2', joinedAt: 2 });

    expect(store.isAtCapacity()).toBe(true);

    // Disconnect p1
    expect(store.removePeer('p1')).toBe(true);
    expect(store.isAtCapacity()).toBe(false);
    expect(store.canAcceptPeer()).toBe(true);

    // Now p3 can join
    expect(store.addPeer({ id: 'p3', joinedAt: 3 })).toBe(true);
    expect(store.getPeers().map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('provides capacity status and ratio metrics', () => {
    const store = createPeerStore({ maxPeers: 10 });
    store.addPeer({ id: 'p1', joinedAt: 1 });
    store.addPeer({ id: 'p2', joinedAt: 2 });

    const status = store.getCapacityStatus();
    expect(status.count).toBe(2);
    expect(status.max).toBe(10);
    expect(status.isFull).toBe(false);
    expect(status.ratio).toBe(0.2);
  });

  it('handles clearing all peers on room departure', () => {
    const store = createPeerStore();
    store.addPeer({ id: 'p1', joinedAt: 1 });
    store.addPeer({ id: 'p2', joinedAt: 2 });

    store.clear();
    expect(store.getPeers().length).toBe(0);
    expect(store.isAtCapacity()).toBe(false);
  });
});
