<script>
  let { available, onReload, onDismiss } = $props()
  let reloading = $state(false)

  function reload() {
    reloading = true
    onReload()
  }
</script>

<!-- The live region stays mounted so screen readers announce the text when it appears. -->
<div class="update-region" aria-live="polite">
  {#if available}
    <div class="update-banner">
      <p class="message">
        <strong>A new version is available.</strong>
        <span class="hint">Your encounter and catalog are kept.</span>
      </p>
      <button class="reload" onclick={reload} disabled={reloading}>{reloading ? 'Reloading…' : 'Reload'}</button>
      <button class="dismiss" aria-label="Dismiss update notice" onclick={() => onDismiss()}>✕</button>
    </div>
  {/if}
</div>

<style>
  .update-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 12px 8px;
    padding: 4px 4px 4px 12px;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--accent);
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }
  .message {
    flex: 1;
    min-width: 0;
    margin: 0;
    line-height: 1.3;
  }
  .hint {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .reload {
    height: var(--control);
    padding: 0 14px;
    font-weight: 800;
    color: var(--bg);
    background: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 8px;
  }
  .reload:disabled {
    opacity: 0.6;
  }
  .dismiss {
    width: var(--control);
    height: var(--control);
    padding: 0;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
</style>
