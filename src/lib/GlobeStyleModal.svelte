<script lang="ts">
  import { GLOBE_STYLES, type GlobeStyleId } from './globe-styles';

  interface Props {
    isOpen?: boolean;
    currentStyle?: GlobeStyleId;
    showBorders?: boolean;
    onSelectStyle: (style: GlobeStyleId) => void;
    onToggleBorders: () => void;
    onClose: () => void;
  }

  let {
    isOpen = false,
    currentStyle = 'night',
    showBorders = true,
    onSelectStyle,
    onToggleBorders,
    onClose,
  }: Props = $props();

  const styleList = Object.values(GLOBE_STYLES);

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
      aria-labelledby="style-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <div class="modal-title-group">
          <span class="palette-icon">🎨</span>
          <h2 id="style-modal-title" class="modal-title">Globe Appearance</h2>
        </div>
        <button class="close-btn" onclick={onClose} aria-label="Close dialog">✕</button>
      </header>

      <div class="modal-body">
        <!-- Style Presets Grid -->
        <div class="section">
          <span class="section-label">Map Theme Preset</span>
          <div class="style-grid">
            {#each styleList as style (style.id)}
              <button
                class="style-card"
                class:active={style.id === currentStyle}
                onclick={() => onSelectStyle(style.id)}
              >
                <div class="style-card-header">
                  <span class="style-icon">{style.icon}</span>
                  <span class="style-name">{style.name}</span>
                  {#if style.id === currentStyle}
                    <span class="active-badge">Active</span>
                  {/if}
                </div>
                <p class="style-desc">{style.description}</p>
                <div class="style-preview-swatch" style="--accent: {style.atmosphereColor}"></div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Geographic Layers & Borders -->
        <div class="section">
          <span class="section-label">Geographic Layers</span>
          <div class="layer-card">
            <div class="layer-info">
              <div class="layer-title-row">
                <span class="layer-icon">🗺️</span>
                <span class="layer-title">Country Borders & Names</span>
                {#if showBorders}
                  <span class="active-badge">Visible</span>
                {/if}
              </div>
              <p class="layer-desc">
                Render thin geopolitical boundary vectors on the globe. Hover over any country to
                illuminate its territory and view its name.
              </p>
            </div>
            <button
              class="toggle-switch"
              class:on={showBorders}
              onclick={onToggleBorders}
              role="switch"
              aria-checked={showBorders}
              aria-label="Toggle Country Borders"
            >
              <span class="toggle-thumb"></span>
            </button>
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
    background: rgba(4, 7, 18, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-card {
    background: #0d1527;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    max-height: calc(100dvh - 2rem);
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.6),
      0 0 30px rgba(56, 189, 248, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .palette-icon {
    font-size: 1.25rem;
  }

  .modal-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: -0.01em;
  }

  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
  }

  .modal-body {
    padding: 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .style-grid {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .style-card {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.75rem 0.95rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .style-card:hover {
    background: rgba(56, 189, 248, 0.06);
    border-color: rgba(56, 189, 248, 0.3);
    transform: translateY(-1px);
  }

  .style-card.active {
    background: rgba(56, 189, 248, 0.12);
    border-color: #38bdf8;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
  }

  .style-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .style-icon {
    font-size: 1.1rem;
  }

  .style-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .style-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.35;
    margin: 0;
  }

  .active-badge {
    margin-left: auto;
    font-size: 0.62rem;
    font-weight: 700;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    padding: 0.1rem 0.4rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .style-preview-swatch {
    position: absolute;
    right: 0;
    bottom: 0;
    top: 0;
    width: 4px;
    background: var(--accent);
    opacity: 0.7;
  }

  .layer-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
  }

  .layer-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .layer-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .layer-icon {
    font-size: 1.05rem;
  }

  .layer-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .layer-desc {
    font-size: 0.74rem;
    color: #94a3b8;
    line-height: 1.35;
    margin: 0;
  }

  .toggle-switch {
    width: 42px;
    height: 24px;
    border-radius: 9999px;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;
  }

  .toggle-switch.on {
    background: #0284c7;
    border-color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
  }

  .toggle-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .toggle-switch.on .toggle-thumb {
    transform: translateX(18px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(6px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
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
