<script>
  let { creatureName, onSend = () => {}, onCancel = () => {} } = $props()

  let initiative = $state(1)

  function handleSubmit(event) {
    event.preventDefault()
    onSend(Number(initiative))
  }
</script>

<form class="send-form" onsubmit={handleSubmit}>
  <span class="prompt">Send <strong>{creatureName}</strong> →</span>
  <label class="field">
    <span>Initiative</span>
    <input type="number" bind:value={initiative} />
  </label>
  <button type="submit" class="send">Send</button>
  <button type="button" class="cancel" onclick={onCancel}>Cancel</button>
</form>

<style>
  .send-form {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-2);
  }
  .prompt {
    color: var(--text-muted);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .field input {
    width: 4rem;
    padding: 8px 6px;
    font: inherit;
    text-align: center;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  button {
    padding: 8px 12px;
    font-weight: 700;
    border-radius: 8px;
  }
  .send {
    color: var(--bg);
    background: var(--accent);
    border: none;
  }
  .cancel {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
  }
</style>
