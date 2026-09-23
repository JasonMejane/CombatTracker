<script>
  let { title, message = '', confirmLabel = 'Confirm', onConfirm = () => {}, onCancel = () => {} } = $props()

  function onKey(event) {
    if (event.key === 'Escape') onCancel()
  }

  function focusOnMount(node) {
    node.focus()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="backdrop" role="presentation" onclick={() => onCancel()}></div>

<div
  class="dialog"
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="confirm-title"
  aria-describedby={message ? 'confirm-message' : undefined}
>
  <h2 id="confirm-title">{title}</h2>
  {#if message}
    <p id="confirm-message">{message}</p>
  {/if}
  <div class="actions">
    <button class="cancel" use:focusOnMount onclick={() => onCancel()}>Cancel</button>
    <button class="confirm" onclick={() => onConfirm()}>{confirmLabel}</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgba(0, 0, 0, 0.6);
  }
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 31;
    width: min(calc(100% - 32px), 380px);
    padding: 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
    transform: translate(-50%, -50%);
  }
  h2 {
    margin: 0 0 6px;
    font-size: 1.1rem;
  }
  p {
    margin: 0;
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
  }
  button {
    height: var(--control);
    padding: 0 16px;
    font-weight: 700;
    border-radius: 8px;
  }
  .cancel {
    color: var(--text);
    background: transparent;
    border: 1px solid var(--border);
  }
  .confirm {
    color: var(--text);
    background: var(--enemy-border);
    border: none;
  }
</style>
