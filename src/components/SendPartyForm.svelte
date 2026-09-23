<script>
  let { players, onSend = () => {}, onCancel = () => {} } = $props()

  // One entry per player, seeded once: the panel is closed and reopened to refresh it.
  // svelte-ignore state_referenced_locally
  let entries = $state(players.map((p) => ({ id: p.id, name: p.name, selected: true, initiative: '' })))

  const chosen = $derived(entries.filter((e) => e.selected))
  const isValid = $derived(chosen.length > 0 && chosen.every((e) => e.initiative !== '' && e.initiative !== null))

  function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) return
    onSend(chosen.map((e) => ({ id: e.id, initiative: Number(e.initiative) })))
  }
</script>

<form class="party-form" onsubmit={handleSubmit}>
  <p class="hint">Enter each player's initiative roll.</p>
  <ul class="players">
    {#each entries as entry (entry.id)}
      <li class="player">
        <label class="pick">
          <input type="checkbox" bind:checked={entry.selected} />
          <span class="name">{entry.name}</span>
        </label>
        <input
          class="initiative"
          type="number"
          inputmode="numeric"
          aria-label="Initiative for {entry.name}"
          placeholder="Init"
          disabled={!entry.selected}
          bind:value={entry.initiative}
        />
      </li>
    {/each}
  </ul>
  <div class="actions">
    <button type="button" class="cancel" onclick={() => onCancel()}>Cancel</button>
    <button type="submit" class="send" disabled={!isValid}>Send party</button>
  </div>
</form>

<style>
  .party-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 8px 0;
    padding: 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .players {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .player {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pick {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    min-height: var(--control);
  }
  .pick input {
    width: 20px;
    height: 20px;
    accent-color: var(--player-border);
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .initiative {
    width: 5rem;
    height: var(--control);
    padding: 0 8px;
    font: inherit;
    text-align: center;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .initiative:disabled {
    opacity: 0.4;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    border-radius: 8px;
  }
  .cancel {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
  }
  .send {
    color: var(--bg);
    background: var(--accent);
    border: none;
  }
  .send:disabled {
    opacity: 0.4;
  }
</style>
