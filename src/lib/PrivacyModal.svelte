<script lang="ts">
  interface Props {
    isOpen?: boolean;
    isGhostMode?: boolean;
    onClose: () => void;
    onToggleGhostMode: () => void;
  }

  let { isOpen = false, isGhostMode = false, onClose, onToggleGhostMode }: Props = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={onClose} role="presentation">
    <div
      class="modal-card"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <div class="modal-title-group">
          <span class="shield-icon">🛡️</span>
          <h2 id="privacy-modal-title" class="modal-title">Privacy & Security</h2>
        </div>
        <button class="close-btn" onclick={onClose} aria-label="Close dialog">✕</button>
      </header>

      <div class="modal-body">
        <!-- Ghost / Incognito Mode Feature -->
        <div class="ghost-card" class:active={isGhostMode}>
          <div class="ghost-info">
            <div class="ghost-header">
              <span class="ghost-icon">👻</span>
              <span class="ghost-title">Ghost / Incognito Mode</span>
              {#if isGhostMode}
                <span class="active-badge">Active</span>
              {/if}
            </div>
            <p class="ghost-desc">
              Masks your real IP location. Generates an anonymous random global coordinate so your
              approximate city is hidden from connected peers.
            </p>
          </div>
          <button
            class="toggle-switch"
            class:on={isGhostMode}
            onclick={onToggleGhostMode}
            role="switch"
            aria-checked={isGhostMode}
            aria-label="Toggle Ghost Mode"
          >
            <span class="switch-handle"></span>
          </button>
        </div>

        <!-- Privacy Architecture Points -->
        <div class="privacy-points">
          <div class="point-item">
            <div class="point-icon">⚡</div>
            <div class="point-content">
              <h3>100% Serverless & Zero Storage</h3>
              <p>
                No user accounts, tracking cookies, analytics scripts, or central databases. The
                application runs entirely in-memory in your browser.
              </p>
            </div>
          </div>

          <div class="point-item">
            <div class="point-icon">📍</div>
            <div class="point-content">
              <h3>City-Level Coarsening & Privacy Jitter</h3>
              <p>
                Your exact physical location is never accessed. IP lookups are approximated at city
                level with an automatic <strong>5–10 km randomized offset</strong> before broadcasting.
              </p>
            </div>
          </div>

          <div class="point-item">
            <div class="point-icon">🌐</div>
            <div class="point-content">
              <h3>Direct WebRTC Data Channels</h3>
              <p>
                Browser-to-browser telemetry only exchanges millisecond timestamps (ping/pong) and
                coarse coordinates. No microphone, camera, or files are ever requested.
              </p>
            </div>
          </div>

          <div class="point-item">
            <div class="point-icon">📡</div>
            <div class="point-content">
              <h3>Public Nostr Signaling</h3>
              <p>
                Ephemeral WebRTC handshakes are routed through public Nostr relays without custom
                coordination infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 7, 18, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-card {
    width: 100%;
    max-width: 480px;
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 16px;
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.6),
      0 0 30px rgba(56, 189, 248, 0.15);
    backdrop-filter: blur(20px);
    overflow: hidden;
    animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scaleUp {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .shield-icon {
    font-size: 1.15rem;
  }

  .modal-title {
    font-size: 1rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
  }

  .modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-height: 80vh;
    overflow-y: auto;
  }

  .ghost-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1.1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .ghost-card.active {
    background: rgba(14, 165, 233, 0.12);
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
  }

  .ghost-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ghost-header {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .ghost-icon {
    font-size: 1.1rem;
  }

  .ghost-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: #f8fafc;
  }

  .active-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.1rem 0.4rem;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.5);
    color: #4ade80;
    border-radius: 9999px;
  }

  .ghost-desc {
    margin: 0;
    font-size: 0.74rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .toggle-switch {
    width: 44px;
    height: 24px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;
    padding: 2px;
  }

  .toggle-switch.on {
    background: #0284c7;
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
  }

  .switch-handle {
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .toggle-switch.on .switch-handle {
    transform: translateX(20px);
  }

  .privacy-points {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .point-item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }

  .point-icon {
    font-size: 1.15rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
  }

  .point-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .point-content h3 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .point-content p {
    margin: 0;
    font-size: 0.74rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0.5rem;
      align-items: flex-end;
    }

    .modal-card {
      max-height: 85dvh;
      border-radius: 16px 16px 12px 12px;
    }

    .modal-header {
      padding: 0.9rem 1.1rem;
    }

    .modal-body {
      padding: 1.1rem;
    }
  }
</style>
