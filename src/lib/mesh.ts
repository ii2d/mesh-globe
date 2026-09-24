import { joinRoom, type Room } from 'trystero/nostr';
import { parsePeerMetadata, serializePeerMetadata, type PeerMetadata } from './protocol';
import type { GeoLocation } from './geo';

export interface RemotePeer {
  id: string;
  metadata?: PeerMetadata;
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
