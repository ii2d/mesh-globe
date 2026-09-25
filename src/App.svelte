<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Globe from './lib/Globe.svelte';
  import NetworkHud from './lib/NetworkHud.svelte';
  import Footer from './lib/Footer.svelte';
  import { resolveUserLocation, type GeoLocation } from './lib/geo';
  import { setupHashRouter, parseRoomFromHash } from './lib/router';
  import { createMeshRoom, type MeshRoomHandler, type RemotePeer } from './lib/mesh';
  import type { CapacityStatus } from './lib/peer-store';

  let location = $state<GeoLocation | null>(null);
  let isLoadingLocation = $state(true);
  let autoRotate = $state(true);
  let isHudCollapsed = $state(false);
  let currentRoom = $state<string>('global');
  let peers = $state<RemotePeer[]>([]);
  let capacity = $state<CapacityStatus | undefined>(undefined);
  let insecureWarning = $state<string | null>(null);

  let meshHandler: MeshRoomHandler | null = null;
  let routerDestroy: (() => void) | null = null;
  let globeComponent = $state<{ focusOnUser: () => void } | null>(null);

  function focusLocalNode() {
    globeComponent?.focusOnUser();
  }

  function joinCurrentRoom(roomId: string) {
    if (meshHandler) {
      meshHandler.leave();
      meshHandler = null;
    }
    peers = [];
    capacity = undefined;

    meshHandler = createMeshRoom(roomId, location, {
      onPeersChange: (updatedPeers, updatedCapacity) => {
        peers = [...updatedPeers];
        capacity = updatedCapacity;
      },
      onError: (err) => {
        insecureWarning = err.message;
      },
    });
    capacity = meshHandler.getCapacityStatus();
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

  function toggleHud() {
    isHudCollapsed = !isHudCollapsed;
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
        <button
          type="button"
          class="location-badge clickable"
          onclick={focusLocalNode}
          title="Click to focus on your node on the globe"
        >
          <span class="you-indicator">YOU</span>
          <span class="location-dot"></span>
          <span class="location-text">
            {location.city ? `${location.city}, ` : ''}{location.country || 'Local Node'}
            <span class="location-coords"
              >({location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°)</span
            >
          </span>
        </button>
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

      <button
        class="control-btn"
        class:active={!isHudCollapsed}
        onclick={toggleHud}
        title="Toggle Network HUD"
        aria-label="Toggle Network HUD"
      >
        <span class="btn-icon">📊</span>
        <span class="btn-text">HUD</span>
      </button>

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

  {#if insecureWarning}
    <div class="insecure-banner" role="alert">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">
        <strong>Insecure Origin:</strong> WebCrypto is disabled by your browser over non-localhost
        HTTP. Access via <code>localhost:5173</code> or <code>HTTPS</code> for P2P mesh connectivity.
      </span>
      <button
        class="dismiss-btn"
        onclick={() => (insecureWarning = null)}
        aria-label="Dismiss warning"
      >
        ✕
      </button>
    </div>
  {/if}

  <main class="canvas-viewport" id="globe-container">
    <Globe bind:this={globeComponent} {location} {peers} bind:autoRotate />
    <NetworkHud roomName={currentRoom} {peers} {capacity} bind:isCollapsed={isHudCollapsed} />
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
    font-family: inherit;
  }

  .location-badge.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .location-badge.clickable:hover {
    border-color: rgba(56, 189, 248, 0.5);
    background: rgba(15, 23, 42, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
  }

  .you-indicator {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #38bdf8;
    padding: 0.1rem 0.35rem;
    border-radius: 9999px;
  }

  .location-coords {
    color: #94a3b8;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    margin-left: 0.25rem;
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
    font-size: 0.85rem;
    line-height: 1;
  }

  .canvas-viewport {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .insecure-banner {
    position: absolute;
    top: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 1rem;
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(234, 179, 8, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 8px;
    color: #fef08a;
    font-size: 0.78rem;
    z-index: 50;
    max-width: 90vw;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .insecure-banner code {
    font-family: var(--font-mono);
    background: rgba(0, 0, 0, 0.3);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    color: #fff;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: #fef08a;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0 0.2rem;
    opacity: 0.7;
  }

  .dismiss-btn:hover {
    opacity: 1;
  }
</style>
