<script lang="ts">
  import type { RemotePeer } from './mesh';
  import type { CapacityStatus } from './peer-store';
  import { getCountryFlagEmoji, formatLatencyBadge, summarizeMeshNetwork } from './telemetry';

  interface Props {
    roomName: string;
    peers: RemotePeer[];
    capacity?: CapacityStatus;
    isCollapsed?: boolean;
    onFocusPeer?: (peer: RemotePeer) => void;
    onOpenRoomModal?: () => void;
  }

  let {
    roomName,
    peers = [],
    capacity,
    isCollapsed = $bindable(false),
    onFocusPeer,
    onOpenRoomModal,
  }: Props = $props();

  const summary = $derived(summarizeMeshNetwork(peers));

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }
</script>

<aside class="network-hud" class:collapsed={isCollapsed} aria-label="Network Telemetry HUD">
  <div class="hud-header">
    <div class="header-left">
      <span class="hud-status-dot" class:active={peers.length > 0}></span>
      <h2 class="hud-title">Mesh Telemetry</h2>
      <button
        class="hud-room-btn"
        onclick={onOpenRoomModal}
        title="Manage or switch mesh room"
        aria-label="Manage mesh room #{roomName}"
      >
        <span class="hud-room">#{roomName}</span>
        <span class="room-edit-icon">✏️</span>
      </button>
    </div>

    <div class="header-right">
      {#if capacity?.isFull}
        <span class="cap-warning" title="25-peer soft cap reached. Further connections deferred."
          >Cap Reached</span
        >
      {/if}
      <button
        class="hud-toggle-btn"
        onclick={toggleCollapse}
        aria-label={isCollapsed ? 'Expand Telemetry HUD' : 'Collapse Telemetry HUD'}
        title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
      >
        <span class="toggle-icon">{isCollapsed ? '▲' : '▼'}</span>
      </button>
    </div>
  </div>

  {#if !isCollapsed}
    <div class="hud-body">
      <!-- Network Summary Stats -->
      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Active Peers</span>
            {#if capacity}
              <span class="stat-cap">/ {capacity.max} max</span>
            {/if}
          </div>
          <span class="stat-value">{summary.total}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Avg Latency</span>
          <span class="stat-value" class:dim={summary.avgRtt === null}>
            {summary.avgRtt !== null ? `${summary.avgRtt} ms` : '—'}
          </span>
        </div>
      </div>

      <!-- Latency Quality Breakdown Bar -->
      <div class="quality-tiers">
        <div class="tier-pill optimal" title="< 100ms">
          <span class="tier-dot"></span>
          <span class="tier-name">&lt;100ms</span>
          <span class="tier-count">{summary.optimal}</span>
        </div>
        <div class="tier-pill acceptable" title="100ms – 250ms">
          <span class="tier-dot"></span>
          <span class="tier-name">100-250ms</span>
          <span class="tier-count">{summary.acceptable}</span>
        </div>
        <div class="tier-pill degraded" title="> 250ms">
          <span class="tier-dot"></span>
          <span class="tier-name">&gt;250ms</span>
          <span class="tier-count">{summary.degraded}</span>
        </div>
      </div>

      <!-- Peer List -->
      <div class="peer-list-section">
        <div class="section-title">
          <span>Connected Nodes ({peers.length})</span>
          {#if peers.length > 0}
            <span class="click-hint">Click node to focus 📍</span>
          {/if}
        </div>

        {#if peers.length === 0}
          <div class="empty-peers">
            <span class="scanning-ring"></span>
            <p class="empty-text">Scanning Nostr relays...</p>
            <button class="invite-btn" onclick={onOpenRoomModal}>
              <span>🔗</span> Share Room Invite
            </button>
          </div>
        {:else}
          <div class="peer-scroll">
            {#each peers as peer (peer.id)}
              {@const badge = formatLatencyBadge(peer.emaRtt, peer.rtt)}
              {@const flag = getCountryFlagEmoji(peer.metadata?.countryCode)}
              <div
                class="peer-row clickable"
                onclick={() => onFocusPeer?.(peer)}
                title="Click to focus on this peer on the 3D globe"
                role="button"
                tabindex="0"
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onFocusPeer?.(peer);
                  }
                }}
              >
                <div class="peer-info">
                  <span class="peer-flag" role="img" aria-label="Country flag">{flag}</span>
                  <div class="peer-names">
                    <span class="peer-location">
                      {peer.metadata?.city ? `${peer.metadata.city}, ` : ''}{peer.metadata
                        ?.country || 'Connecting node...'}
                    </span>
                    <code class="peer-id">{peer.id.slice(0, 8)}</code>
                  </div>
                </div>

                <div
                  class="peer-latency-badge"
                  style="--badge-color: {badge.color}; color: {badge.color}; border-color: {badge.color}33;"
                >
                  <span class="badge-dot" style="background-color: {badge.color}"></span>
                  <span class="badge-text">{badge.text}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</aside>

<style>
  .network-hud {
    position: absolute;
    bottom: 2.75rem;
    left: 1.25rem;
    width: 320px;
    max-width: calc(100vw - 2.5rem);
    background: rgba(10, 15, 29, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    z-index: 35;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .network-hud.collapsed {
    width: auto;
    max-width: 320px;
  }

  .hud-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.9rem;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    user-select: none;
    gap: 0.5rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .cap-warning {
    font-size: 0.65rem;
    font-weight: 600;
    color: #eab308;
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(234, 179, 8, 0.3);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    letter-spacing: 0.02em;
  }

  .hud-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #64748b;
    transition: all 0.3s ease;
  }

  .hud-status-dot.active {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
  }

  .hud-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .hud-room-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 4px;
    transition: opacity 0.2s;
  }

  .hud-room-btn:hover {
    opacity: 0.85;
  }

  .hud-room {
    font-size: 0.75rem;
    font-family: var(--font-mono);
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid transparent;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .hud-room-btn:hover .hud-room {
    background: rgba(56, 189, 248, 0.2);
    border-color: rgba(56, 189, 248, 0.4);
  }

  .room-edit-icon {
    font-size: 0.65rem;
    opacity: 0.6;
    transition: transform 0.2s;
  }

  .hud-room-btn:hover .room-edit-icon {
    transform: scale(1.15);
    opacity: 1;
  }

  .hud-toggle-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    transition: color 0.2s;
  }

  .hud-toggle-btn:hover {
    color: #f8fafc;
  }

  .hud-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.5rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .stat-label {
    font-size: 0.68rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-cap {
    font-size: 0.62rem;
    color: #64748b;
    font-family: var(--font-mono);
  }

  .stat-value {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    font-family: var(--font-mono);
  }

  .stat-value.dim {
    color: #64748b;
  }

  .quality-tiers {
    display: flex;
    gap: 0.35rem;
    justify-content: space-between;
  }

  .tier-pill {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.45rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    font-size: 0.65rem;
    color: #cbd5e1;
    flex: 1;
    justify-content: space-between;
  }

  .tier-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .optimal .tier-dot {
    background: #22c55e;
    box-shadow: 0 0 5px #22c55e;
  }

  .acceptable .tier-dot {
    background: #eab308;
    box-shadow: 0 0 5px #eab308;
  }

  .degraded .tier-dot {
    background: #ef4444;
    box-shadow: 0 0 5px #ef4444;
  }

  .tier-count {
    font-weight: 600;
    font-family: var(--font-mono);
  }

  .peer-list-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.7rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .click-hint {
    font-size: 0.6rem;
    font-weight: 500;
    color: #38bdf8;
    text-transform: none;
    letter-spacing: normal;
  }

  .peer-scroll {
    max-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-right: 2px;
  }

  .peer-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .peer-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  .peer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.55rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }

  .peer-row.clickable {
    cursor: pointer;
  }

  .peer-row.clickable:hover {
    background: rgba(56, 189, 248, 0.08);
    border-color: rgba(56, 189, 248, 0.25);
    transform: translateX(2px);
  }

  .peer-row.clickable:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 1px;
  }

  .peer-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
  }

  .peer-flag {
    font-size: 1rem;
    line-height: 1;
  }

  .peer-names {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .peer-location {
    font-size: 0.72rem;
    color: #e2e8f0;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  .peer-id {
    font-size: 0.62rem;
    color: #64748b;
    font-family: var(--font-mono);
  }

  .peer-latency-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.45rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid;
    border-radius: 9999px;
    font-size: 0.68rem;
    font-family: var(--font-mono);
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .empty-peers {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.25rem 0.5rem;
    text-align: center;
    gap: 0.3rem;
    background: rgba(255, 255, 255, 0.01);
    border-radius: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.08);
  }

  .scanning-ring {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    margin-bottom: 0.25rem;
  }

  .empty-text {
    font-size: 0.75rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  .invite-btn {
    margin-top: 0.45rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 6px;
    color: #38bdf8;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .invite-btn:hover {
    background: rgba(56, 189, 248, 0.22);
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
    transform: translateY(-1px);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .network-hud {
      left: 0.75rem;
      right: 0.75rem;
      width: auto;
      max-width: none;
      bottom: 2.5rem;
    }
  }
</style>
