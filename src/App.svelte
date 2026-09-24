<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Globe from './lib/Globe.svelte';
  import Footer from './lib/Footer.svelte';
  import { resolveUserLocation, type GeoLocation } from './lib/geo';
  import { setupHashRouter, parseRoomFromHash } from './lib/router';
  import { createMeshRoom, type MeshRoomHandler, type RemotePeer } from './lib/mesh';

  let location = $state<GeoLocation | null>(null);
  let isLoadingLocation = $state(true);
  let autoRotate = $state(true);
  let currentRoom = $state<string>('global');
  let peers = $state<RemotePeer[]>([]);

  let meshHandler: MeshRoomHandler | null = null;
  let routerDestroy: (() => void) | null = null;

  function joinCurrentRoom(roomId: string) {
    if (meshHandler) {
      meshHandler.leave();
      meshHandler = null;
    }
    peers = [];

    meshHandler = createMeshRoom(roomId, location, {
      onPeersChange: (updatedPeers) => {
        peers = [...updatedPeers];
      },
    });
  }

  onMount(async () => {
    // 1. Initial room from URL hash
    currentRoom = parseRoomFromHash(window.location.hash);

    // 2. Setup dynamic hash router listener
    const router = setupHashRouter((newRoom) => {
      if (newRoom !== currentRoom) {
        currentRoom = newRoom;
        joinCurrentRoom(currentRoom);
      }
    });
    routerDestroy = router.destroy;

    // 3. Connect to initial mesh room
    joinCurrentRoom(currentRoom);

    // 4. Resolve client geolocation
    try {
      location = await resolveUserLocation();
      if (meshHandler && location) {
        meshHandler.broadcastMetadata(location);
      }
    } finally {
      isLoadingLocation = false;
    }
  });

  onDestroy(() => {
    if (routerDestroy) {
      routerDestroy();
      routerDestroy = null;
    }
    if (meshHandler) {
      meshHandler.leave();
      meshHandler = null;
    }
  });

  function toggleAutoRotate() {
    autoRotate = !autoRotate;
  }
</script>

<div class="shell">
  <header class="header">
    <div class="brand">
      <div class="logo-mark">
        <span class="pulsing-core"></span>
      </div>
      <div class="brand-text">
        <h1 class="title">mesh-globe</h1>
        <span class="subtitle">Decentralized P2P Mesh</span>
      </div>
    </div>

    <div class="header-controls">
      {#if location}
        <div class="location-badge" title="Coarsened city-level coordinates with privacy jitter">
          <span class="location-dot"></span>
          <span class="location-text">
            {location.city ? `${location.city}, ` : ''}{location.country || 'Local Node'}
          </span>
        </div>
      {:else if isLoadingLocation}
        <div class="location-badge loading">
          <span class="loading-spinner"></span>
          <span class="location-text">Locating...</span>
        </div>
      {/if}

      <div class="room-pill" title="Current mesh room derived from URL hash">
        <span class="room-prefix">#</span>
        <span class="room-name">{currentRoom}</span>
      </div>

      <div class="peers-pill" title="Active WebRTC peers in this room">
        <span class="peers-icon">●</span>
        <span class="peers-count">{peers.length} {peers.length === 1 ? 'peer' : 'peers'}</span>
      </div>

      <button
        class="control-btn"
        class:active={autoRotate}
        onclick={toggleAutoRotate}
        title="Toggle Globe Auto-Rotation"
        aria-label="Toggle Globe Auto-Rotation"
      >
        <span class="btn-icon">↻</span>
        <span class="btn-text">Rotate</span>
      </button>
    </div>
  </header>

  <main class="canvas-viewport" id="globe-container">
    <Globe {location} {peers} bind:autoRotate />
  </main>

  <Footer />
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle at 50% 50%, #0d1527 0%, #050811 100%);
  }

  .header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    z-index: 40;
    pointer-events: none;
  }

  .brand,
  .header-controls {
    pointer-events: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-mark {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulsing-core {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 10px #38bdf8;
    animation: pulse 2s infinite ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.15);
      opacity: 1;
    }
  }

  .title {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #f8fafc;
  }

  .subtitle {
    font-size: 0.7rem;
    color: #94a3b8;
    display: block;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .location-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #e2e8f0;
  }

  .location-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 6px #38bdf8;
  }

  .loading-spinner {
    width: 8px;
    height: 8px;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .room-pill {
    display: flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    font-size: 0.8rem;
    font-family: var(--font-mono);
  }

  .room-prefix {
    color: #38bdf8;
    margin-right: 0.2rem;
    font-weight: 600;
  }

  .room-name {
    color: #e2e8f0;
  }

  .peers-pill {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #cbd5e1;
  }

  .peers-icon {
    color: #a855f7;
    font-size: 0.7rem;
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    color: #94a3b8;
    font-size: 0.75rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .control-btn.active {
    color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.4);
    background: rgba(56, 189, 248, 0.1);
  }

  .btn-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .canvas-viewport {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
