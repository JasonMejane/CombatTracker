<script>
  let { message, undoable = true, onUndo = () => {} } = $props()
</script>

<div class="toast" role="status">
  <span class="message">{message}</span>
  {#if undoable}
    <button class="undo" onclick={() => onUndo()}>Undo</button>
  {/if}
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: calc(var(--control) + 8px);
    padding: 4px 4px 4px 12px;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }
  .message {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    line-height: 1.3;
  }
  .undo {
    height: var(--control);
    padding: 0 14px;
    font-weight: 800;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent);
    border-radius: 8px;
  }
</style>
