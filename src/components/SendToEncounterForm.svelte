<script>
  import { rollInitiative } from '../lib/dice.js'

  let { creatureName, isPlayer = true, onSend = () => {}, onCancel = () => {} } = $props()

  let initiative = $state(0)
  let bonus = $state(0)

  function handleSubmit(event) {
    event.preventDefault()
    onSend(Number(initiative))
  }

  function roll() {
    initiative = rollInitiative(Number(bonus))
  }
</script>

<form class="send-form" onsubmit={handleSubmit}>
  <span class="prompt">Send <strong>{creatureName}</strong> →</span>
  <label class="field">
    <span>Initiative</span>
    <input type="number" bind:value={initiative} />
  </label>
  {#if !isPlayer}
    <button type="button" class="roll" aria-label="Roll" title="Roll a d20 + bonus for initiative" onclick={roll}>🎲 Roll</button>
    <label class="field">
      <span>Bonus</span>
      <input type="number" bind:value={bonus} />
    </label>
  {/if}
  <div class="actions">
    <button type="submit" class="send">Send</button>
    <button type="button" class="cancel" onclick={() => onCancel()}>Cancel</button>
  </div>
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
  .roll {
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    white-space: nowrap;
  }
  .actions {
    display: flex;
    gap: 8px;
    /* Keep Send + Cancel together, stuck to the right edge of their row. */
    margin-left: auto;
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
