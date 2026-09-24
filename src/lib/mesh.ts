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
  broadcastMetadata: (loc: GeoLocation) => void;
  leave: () => void;
}

export function createMeshRoom(
  roomId: string,
  localLocation: GeoLocation | null,
  options: {
    onPeerJoin?: (peer: RemotePeer) => void;
    onPeerLeave?: (peerId: string) => void;
    onPeerUpdate?: (peer: RemotePeer) => void;
    onPeersChange?: (peers: RemotePeer[]) => void;
  } = {},
): MeshRoomHandler {
  const peers = new Map<string, RemotePeer>();

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
    const peerList = Array.from(peers.values());
    options.onPeersChange?.(peerList);
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

  // Handle incoming peer join
  room.onPeerJoin = (peerId: string) => {
    const newPeer: RemotePeer = {
      id: peerId,
      joinedAt: Date.now(),
    };
    peers.set(peerId, newPeer);
    options.onPeerJoin?.(newPeer);
    notifyChange();

    // Send our metadata specifically to the newly joined peer
    sendLocalMetadata(peerId);
  };

  // Handle peer leave
  room.onPeerLeave = (peerId: string) => {
    peers.delete(peerId);
    options.onPeerLeave?.(peerId);
    notifyChange();
  };

  // Handle incoming metadata broadcast
  metaAction.onMessage = (data: unknown, context: { peerId: string }) => {
    const parsed = parsePeerMetadata(data);
    if (!parsed) return;

    const existing = peers.get(context.peerId);
    if (existing) {
      existing.metadata = parsed;
      options.onPeerUpdate?.(existing);
      notifyChange();
    } else {
      const newPeer: RemotePeer = {
        id: context.peerId,
        metadata: parsed,
        joinedAt: Date.now(),
      };
      peers.set(context.peerId, newPeer);
      options.onPeerJoin?.(newPeer);
      notifyChange();
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
      const peer = peers.get(context.peerId);
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

  // Dispatch ping packets every 2.5 seconds to all connected peers
  pingIntervalId = setInterval(() => {
    if (peers.size === 0) return;

    const now = performance.now();
    for (const [peerId, peer] of peers) {
      peer.lastPingTime = now;
      const ping: PingMessage = {
        type: 'ping',
        id: `${peerId}-${Math.random().toString(36).slice(2, 8)}`,
        t: now,
      };
      pingAction.send(ping as never, { target: peerId }).catch(() => {});
    }
  }, 2500);

  // If local location is already known, broadcast initially
  if (localLocation) {
    sendLocalMetadata();
  }

  return {
    roomId,
    getPeers: () => Array.from(peers.values()),
    broadcastMetadata: (loc: GeoLocation) => {
      localLocation = loc;
      sendLocalMetadata();
    },
    leave: () => {
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
      peers.clear();
      notifyChange();
      try {
        room.leave().catch(() => {});
      } catch {
        // Safe room cleanup
      }
    },
  };
}
