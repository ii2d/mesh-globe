import { joinRoom, type Room } from 'trystero/nostr';
import {
  parsePeerMetadata,
  serializePeerMetadata,
  type PeerMetadata,
  type PingMessage,
  type PongMessage,
} from './protocol';
import type { GeoLocation } from './geo';
import { calculateRtt, updateEma } from './latency';
import { createPeerStore, type CapacityStatus, DEFAULT_MAX_PEERS } from './peer-store';

export interface RemotePeer {
  id: string;
  metadata?: PeerMetadata;
  rtt?: number;
  emaRtt?: number;
  lastPingTime?: number;
  joinedAt: number;
}

export interface MeshRoomHandler {
  roomId: string;
  getPeers: () => RemotePeer[];
  getCapacityStatus: () => CapacityStatus;
  broadcastMetadata: (loc: GeoLocation) => void;
  leave: () => void;
}

export function createMeshRoom(
  roomId: string,
  localLocation: GeoLocation | null,
  options: {
    maxPeers?: number;
    onPeerJoin?: (peer: RemotePeer) => void;
    onPeerLeave?: (peerId: string) => void;
    onPeerUpdate?: (peer: RemotePeer) => void;
    onPeersChange?: (peers: RemotePeer[], capacity: CapacityStatus) => void;
  } = {},
): MeshRoomHandler {
  const peerStore = createPeerStore({ maxPeers: options.maxPeers ?? DEFAULT_MAX_PEERS });

  const room: Room = joinRoom(
    {
      appId: 'ii2d-mesh-globe',
    },
    roomId,
  );

  const metaAction = room.makeAction('meta');
  const pingAction = room.makeAction('ping');
  const pongAction = room.makeAction('pong');

  let pingIntervalId: ReturnType<typeof setInterval> | null = null;

  function notifyChange() {
    const peerList = peerStore.getPeers();
    const capacity = peerStore.getCapacityStatus();
    options.onPeersChange?.(peerList, capacity);
  }

  function sendLocalMetadata(targetPeerId?: string) {
    if (!localLocation) return;

    const meta: PeerMetadata = {
      type: 'meta',
      lat: localLocation.lat,
      lng: localLocation.lng,
      city: localLocation.city,
      country: localLocation.country,
      countryCode: localLocation.countryCode,
    };

    const payload = serializePeerMetadata(meta);

    if (targetPeerId) {
      metaAction.send(payload as never, { target: targetPeerId }).catch(() => {});
    } else {
      metaAction.send(payload as never).catch(() => {});
    }
  }

  // Handle incoming peer join with capacity enforcement
  room.onPeerJoin = (peerId: string) => {
    // If we have reached capacity, throttle/ignore new peer connection
    if (!peerStore.canAcceptPeer()) {
      return;
    }

    const newPeer: RemotePeer = {
      id: peerId,
      joinedAt: Date.now(),
    };
    const added = peerStore.addPeer(newPeer);
    if (!added) return;

    options.onPeerJoin?.(newPeer);
    notifyChange();

    // Send our metadata specifically to the newly joined peer
    sendLocalMetadata(peerId);
  };

  // Handle peer leave
  room.onPeerLeave = (peerId: string) => {
    peerStore.removePeer(peerId);
    options.onPeerLeave?.(peerId);
    notifyChange();
  };

  // Handle incoming metadata broadcast
  metaAction.onMessage = (data: unknown, context: { peerId: string }) => {
    const parsed = parsePeerMetadata(data);
    if (!parsed) return;

    const existing = peerStore.getPeer(context.peerId);
    if (existing) {
      existing.metadata = parsed;
      options.onPeerUpdate?.(existing);
      notifyChange();
    } else {
      if (!peerStore.canAcceptPeer()) return;

      const newPeer: RemotePeer = {
        id: context.peerId,
        metadata: parsed,
        joinedAt: Date.now(),
      };
      if (peerStore.addPeer(newPeer)) {
        options.onPeerJoin?.(newPeer);
        notifyChange();
      }
    }
  };

  // Handle ping: reply with pong containing the original timestamp
  pingAction.onMessage = (data: unknown, context: { peerId: string }) => {
    if (!data || typeof data !== 'object') return;
    const msg = data as Partial<PingMessage>;
    if (msg.type === 'ping' && typeof msg.t === 'number' && typeof msg.id === 'string') {
      const pong: PongMessage = {
        type: 'pong',
        id: msg.id,
        t: msg.t,
      };
      pongAction.send(pong as never, { target: context.peerId }).catch(() => {});
    }
  };

  // Handle pong: compute round-trip latency and apply EMA smoothing
  pongAction.onMessage = (data: unknown, context: { peerId: string }) => {
    if (!data || typeof data !== 'object') return;
    const msg = data as Partial<PongMessage>;
    if (msg.type === 'pong' && typeof msg.t === 'number') {
      const peer = peerStore.getPeer(context.peerId);
      if (peer) {
        const now = performance.now();
        const rtt = calculateRtt(msg.t, now);
        peer.rtt = rtt;
        peer.emaRtt = updateEma(peer.emaRtt, rtt);
        options.onPeerUpdate?.(peer);
        notifyChange();
      }
    }
  };

  // Dispatch ping packets every 2.5 seconds to all active peers
  pingIntervalId = setInterval(() => {
    const activePeers = peerStore.getPeers();
    if (activePeers.length === 0) return;

    const now = performance.now();
    for (const peer of activePeers) {
      peer.lastPingTime = now;
      const ping: PingMessage = {
        type: 'ping',
        id: `${peer.id}-${Math.random().toString(36).slice(2, 8)}`,
        t: now,
      };
      pingAction.send(ping as never, { target: peer.id }).catch(() => {});
    }
  }, 2500);

  // Tab unload listener for clean disconnection
  const unloadHandler = () => {
    cleanup();
  };
  window.addEventListener('beforeunload', unloadHandler);

  // If local location is already known, broadcast initially
  if (localLocation) {
    sendLocalMetadata();
  }

  function cleanup() {
    window.removeEventListener('beforeunload', unloadHandler);
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
    }
    peerStore.clear();
    notifyChange();
    try {
      room.leave().catch(() => {});
    } catch {
      // Safe cleanup
    }
  }

  return {
    roomId,
    getPeers: () => peerStore.getPeers(),
    getCapacityStatus: () => peerStore.getCapacityStatus(),
    broadcastMetadata: (loc: GeoLocation) => {
      localLocation = loc;
      sendLocalMetadata();
    },
    leave: cleanup,
  };
}
