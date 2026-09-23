<script>
  let {
    round,
    activeName = null,
    canUndo = false,
    hasCreatures = false,
    onPrevious = () => {},
    onNext = () => {},
    onUndo = () => {},
  } = $props()
</script>

<div class="turn-bar">
  <button class="icon" aria-label="Previous turn" title="Previous turn" disabled={!activeName} onclick={() => onPrevious()}>◀</button>
  <div class="status" aria-live="polite">
    <span class="round">Round {round}</span>
    <span class="who">{activeName ? `${activeName}'s turn` : 'Not started'}</span>
  </div>
  <button class="icon" aria-label="Undo last change" title="Undo last change" disabled={!canUndo} onclick={() => onUndo()}>↶</button>
  <button class="next" disabled={!hasCreatures} onclick={() => onNext()}>Next turn ▶</button>
</div>

<style>
  .turn-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px max(6px, env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
    box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.35);
  }
  .status {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }
  .round {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .who {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button {
    height: var(--control);
    border-radius: 8px;
    font-weight: 700;
  }
  button:disabled {
    opacity: 0.4;
  }
  .icon {
    flex: 0 0 var(--control);
    padding: 0;
    font-size: 1.1rem;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
  }
  .next {
    padding: 0 16px;
    color: var(--bg);
    background: var(--accent);
    border: none;
    white-space: nowrap;
  }
</style>
