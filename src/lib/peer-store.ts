import type { RemotePeer } from './mesh';

export const DEFAULT_MAX_PEERS = 25;

export interface CapacityStatus {
  count: number;
  max: number;
  isFull: boolean;
  ratio: number;
}

export interface PeerStore {
  readonly maxPeers: number;
  canAcceptPeer: () => boolean;
  isAtCapacity: () => boolean;
  addPeer: (peer: RemotePeer) => boolean;
  updatePeer: (peerId: string, updater: (peer: RemotePeer) => void) => boolean;
  removePeer: (peerId: string) => boolean;
  getPeer: (peerId: string) => RemotePeer | undefined;
  getPeers: () => RemotePeer[];
  getCapacityStatus: () => CapacityStatus;
  clear: () => void;
}

export function createPeerStore(options: { maxPeers?: number } = {}): PeerStore {
  const maxPeers = options.maxPeers ?? DEFAULT_MAX_PEERS;
  const peers = new Map<string, RemotePeer>();

  return {
    get maxPeers() {
      return maxPeers;
    },

    canAcceptPeer(): boolean {
      return peers.size < maxPeers;
    },

    isAtCapacity(): boolean {
      return peers.size >= maxPeers;
    },

    addPeer(peer: RemotePeer): boolean {
      if (peers.has(peer.id)) {
        peers.set(peer.id, peer);
        return true;
      }
      if (peers.size >= maxPeers) {
        return false;
      }
      peers.set(peer.id, peer);
      return true;
    },

    updatePeer(peerId: string, updater: (peer: RemotePeer) => void): boolean {
      const peer = peers.get(peerId);
      if (!peer) return false;
      updater(peer);
      return true;
    },

    removePeer(peerId: string): boolean {
      return peers.delete(peerId);
    },

    getPeer(peerId: string): RemotePeer | undefined {
      return peers.get(peerId);
    },

    getPeers(): RemotePeer[] {
      return Array.from(peers.values());
    },

    getCapacityStatus(): CapacityStatus {
      const count = peers.size;
      return {
        count,
        max: maxPeers,
        isFull: count >= maxPeers,
        ratio: maxPeers > 0 ? Number((count / maxPeers).toFixed(2)) : 0,
      };
    },

    clear(): void {
      peers.clear();
    },
  };
}
