<script lang="ts">
  import Footer from './lib/Footer.svelte';

  const roomName = $state('global');
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
      <div class="room-pill">
        <span class="room-prefix">#</span>
        <span class="room-name">{roomName}</span>
      </div>
    </div>
  </header>

  <main class="canvas-viewport" id="globe-container">
    <div class="viewport-placeholder">
      <div class="grid-backdrop"></div>
      <p class="placeholder-caption">3D Globe Visualization Engine</p>
      <span class="placeholder-sub">Ready for Ticket #2 Integration</span>
    </div>
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

  .room-pill {
    display: flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
    background: rgba(15, 23, 42, 0.8);
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

  .canvas-viewport {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .viewport-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 10;
  }

  .grid-backdrop {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .placeholder-caption {
    font-size: 1rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .placeholder-sub {
    font-size: 0.8rem;
    color: #64748b;
  }
</style>
