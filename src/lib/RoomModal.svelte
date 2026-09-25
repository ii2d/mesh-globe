<script lang="ts">
  import { parseRoomFromHash } from './router';

  interface Props {
    isOpen?: boolean;
    currentRoom: string;
    onClose: () => void;
    onSelectRoom: (newRoom: string) => void;
  }

  let { isOpen = false, currentRoom, onClose, onSelectRoom }: Props = $props();

  let customInput = $state('');
  let copied = $state(false);
  let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const PRESET_ROOMS = ['global', 'lounge', 'team-mesh', 'devs', 'apac', 'emea', 'americas'];

  function copyInviteLink() {
    const inviteUrl = `${window.location.origin}${window.location.pathname}#${currentRoom}`;
    const handleSuccess = () => {
      copied = true;
      if (copyTimeoutId) clearTimeout(copyTimeoutId);
      copyTimeoutId = setTimeout(() => {
        copied = false;
      }, 2200);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(inviteUrl)
        .then(handleSuccess)
        .catch(() => {
          fallbackCopy(inviteUrl);
          handleSuccess();
        });
    } else {
      fallbackCopy(inviteUrl);
      handleSuccess();
    }
  }

  function fallbackCopy(text: string) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      // Ignore
    }
  }

  function handleJoinCustom() {
    const target = parseRoomFromHash(customInput);
    if (target) {
      onSelectRoom(target);
      customInput = '';
      onClose();
    }
  }

  function generateRandomRoom() {
    const prefixes = ['mesh', 'orbit', 'pulse', 'relay', 'nexus', 'cyber', 'vector'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const room = `${prefix}-${num}`;
    onSelectRoom(room);
    onClose();
  }

  function handleSelectPreset(preset: string) {
    onSelectRoom(preset);
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && customInput.trim()) {
      handleJoinCustom();
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
      aria-labelledby="room-modal-title"
      tabindex="-1"
    >
      <header class="modal-header">
        <div class="modal-title-group">
          <span class="room-icon">🌐</span>
          <h2 id="room-modal-title" class="modal-title">Mesh Room</h2>
        </div>
        <button class="close-btn" onclick={onClose} aria-label="Close dialog">✕</button>
      </header>

      <div class="modal-body">
        <!-- Current Room & Share Link -->
        <div class="current-room-box">
          <div class="room-meta">
            <span class="meta-label">Active Mesh Room</span>
            <span class="meta-room-name">#{currentRoom}</span>
          </div>

          <button class="share-btn" class:copied onclick={copyInviteLink}>
            {#if copied}
              <span class="btn-icon">✓</span>
              <span>Link Copied!</span>
            {:else}
              <span class="btn-icon">🔗</span>
              <span>Copy Invite Link</span>
            {/if}
          </button>
        </div>

        <!-- Create or Join Custom Room -->
        <div class="section">
          <label for="custom-room-input" class="section-label">Create or Join a Room</label>
          <div class="input-row">
            <div class="input-wrapper">
              <span class="input-prefix">#</span>
              <input
                id="custom-room-input"
                type="text"
                bind:value={customInput}
                placeholder="room-name"
                maxlength="32"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <button
              class="action-btn primary"
              disabled={!customInput.trim()}
              onclick={handleJoinCustom}
            >
              Join
            </button>
          </div>
        </div>

        <!-- Quick Random Generator -->
        <div class="random-row">
          <button class="action-btn secondary" onclick={generateRandomRoom}>
            <span>🎲</span>
            <span>Create Random Room</span>
          </button>
        </div>

        <!-- Preset Rooms -->
        <div class="section">
          <span class="section-label">Popular Mesh Rooms</span>
          <div class="preset-grid">
            {#each PRESET_ROOMS as preset (preset)}
              <button
                class="preset-chip"
                class:active={preset === currentRoom}
                onclick={() => handleSelectPreset(preset)}
              >
                <span class="chip-hash">#</span>{preset}
              </button>
            {/each}
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
    max-width: 440px;
    max-height: calc(100dvh - 2rem);
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.92);
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

  .room-icon {
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
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .current-room-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 10px;
    gap: 0.75rem;
  }

  .room-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .meta-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
  }

  .meta-room-name {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    color: #38bdf8;
  }

  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 8px;
    color: #38bdf8;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .share-btn:hover {
    background: rgba(56, 189, 248, 0.25);
    border-color: rgba(56, 189, 248, 0.6);
    color: #ffffff;
  }

  .share-btn.copied {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
    color: #4ade80;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
  }

  .input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 0 0.75rem;
    transition: border-color 0.2s ease;
  }

  .input-wrapper:focus-within {
    border-color: #38bdf8;
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3);
  }

  .input-prefix {
    color: #38bdf8;
    font-weight: 600;
    font-family: var(--font-mono);
    margin-right: 0.25rem;
  }

  .input-wrapper input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #f8fafc;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.55rem 0;
  }

  .input-wrapper input::placeholder {
    color: #64748b;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
  }

  .action-btn.primary {
    background: #0284c7;
    color: #ffffff;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: #0369a1;
  }

  .action-btn.primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-btn.secondary {
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .preset-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.3rem 0.65rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    font-size: 0.72rem;
    font-family: var(--font-mono);
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preset-chip:hover {
    background: rgba(56, 189, 248, 0.15);
    border-color: rgba(56, 189, 248, 0.4);
    color: #38bdf8;
  }

  .preset-chip.active {
    background: rgba(56, 189, 248, 0.25);
    border-color: #38bdf8;
    color: #38bdf8;
    font-weight: 600;
  }

  .chip-hash {
    opacity: 0.6;
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
