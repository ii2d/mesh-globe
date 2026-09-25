<script lang="ts">
  import { getAppVersion } from './version';

  interface Props {
    onOpenPrivacy?: () => void;
  }

  let { onOpenPrivacy }: Props = $props();

  const version = getAppVersion();
</script>

<footer class="app-footer">
  <div class="footer-left">
    <span class="status-indicator"></span>
    <span class="status-text">Mesh Ready</span>
    <span class="divider">•</span>
    <button
      class="footer-privacy-btn"
      onclick={onOpenPrivacy}
      title="View P2P Privacy & Security details"
    >
      🛡️ Privacy & Security
    </button>
  </div>
  <div class="footer-center">
    <a href="https://github.com/ii2d/mesh-globe" target="_blank" rel="noreferrer" class="repo-link">
      ii2d/mesh-globe
    </a>
  </div>
  <div class="footer-right">
    <span class="version-label">Build</span>
    <code class="version-tag" data-testid="app-version">{version}</code>
  </div>
</footer>

<style>
  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: rgba(10, 15, 25, 0.85);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.75rem;
    color: #94a3b8;
    z-index: 50;
    user-select: none;
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .divider {
    color: rgba(255, 255, 255, 0.2);
    font-size: 0.65rem;
  }

  .footer-privacy-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 0.72rem;
    cursor: pointer;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .footer-privacy-btn:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
  }

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
  }

  .repo-link {
    color: #cbd5e1;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .repo-link:hover {
    color: #38bdf8;
  }

  .version-tag {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid rgba(56, 189, 248, 0.2);
  }

  @media (max-width: 640px) {
    .app-footer {
      padding: 0.4rem 0.75rem;
      padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
      font-size: 0.7rem;
    }

    .footer-center {
      display: none;
    }

    .version-label {
      display: none;
    }
  }
</style>
