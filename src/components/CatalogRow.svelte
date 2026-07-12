<script>
  import SendToEncounterForm from './SendToEncounterForm.svelte'

  let { creature, onRemove = () => {}, onSetHp = () => {}, onSetCa = () => {}, onSend = () => {} } = $props()

  let editingHp = $state(false)
  let hpDraft = $state(0)
  let editingCa = $state(false)
  let caDraft = $state(0)
  let showSend = $state(false)

  function startEditHp() {
    hpDraft = creature.maxHp
    editingHp = true
  }

  function commitHp() {
    if (!editingHp) return
    editingHp = false
    onSetHp(Number(hpDraft))
  }

  function onHpKey(event) {
    if (event.key === 'Enter') commitHp()
  }

  function startEditCa() {
    caDraft = creature.ca
    editingCa = true
  }

  function commitCa() {
    if (!editingCa) return
    editingCa = false
    onSetCa(Number(caDraft))
  }

  function onCaKey(event) {
    if (event.key === 'Enter') commitCa()
  }

  function handleSend(initiative) {
    showSend = false
    onSend(initiative)
  }

  function focusOnMount(node) {
    node.focus()
    node.select()
  }
</script>

<div class="row-wrap">
  <div class="catalog-row" class:player={creature.isPlayer} class:enemy={!creature.isPlayer}>
    <span class="side" title={creature.isPlayer ? 'Player' : 'Enemy'}>
      {creature.isPlayer ? 'PC' : 'NPC'}
    </span>
    <div class="name-group">
      <span class="name">{creature.name}</span>
      {#if editingCa}
        <input class="ca-input" type="number" aria-label="CA" bind:value={caDraft} onblur={commitCa} onkeydown={onCaKey} use:focusOnMount />
      {:else}
        <button class="ca" title="Edit armor class" onclick={startEditCa}>CA {creature.ca}</button>
      {/if}
    </div>

    <span class="hp">
      {#if editingHp}
        <input
          class="hp-input"
          type="number"
          min="1"
          aria-label="HP"
          bind:value={hpDraft}
          onblur={commitHp}
          onkeydown={onHpKey}
          use:focusOnMount
        />
      {:else}
        <button class="hp-value" title="Edit HP" onclick={startEditHp}>{creature.maxHp}</button>
      {/if}
      <span class="hp-label">HP</span>
    </span>

    <div class="controls">
      <button class="send-btn" onclick={() => (showSend = true)}>Send to encounter</button>
      <button class="remove-btn" aria-label="Remove" onclick={() => onRemove()}>✕</button>
    </div>
  </div>

  {#if showSend}
    <SendToEncounterForm
      creatureName={creature.name}
      isPlayer={creature.isPlayer}
      onSend={handleSend}
      onCancel={() => (showSend = false)}
    />
  {/if}
</div>

<style>
  .row-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .catalog-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .player {
    background: var(--player);
    border-color: var(--player-border);
  }
  .enemy {
    background: var(--enemy);
    border-color: var(--enemy-border);
  }
  .side {
    min-width: 3ch;
    text-align: center;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }
  .name-group {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    /* Keep room for the name + CA badge so the group never collapses (which would
       overlap the HP badge); the controls wrap to a new line instead. */
    min-width: 7rem;
  }
  .name {
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ca {
    flex: 0 0 auto;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    padding: 4px 6px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .ca:hover {
    color: var(--text);
  }
  .ca-input {
    width: 4rem;
    padding: 4px 6px;
    font: inherit;
    font-weight: 700;
    text-align: center;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .hp {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hp-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .hp-value {
    font-weight: 700;
    color: var(--accent);
    padding: 4px 6px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  }
  .hp-value:hover {
    border-color: var(--border);
  }
  .hp-input {
    width: 5ch;
    padding: 4px 6px;
    font: inherit;
    font-weight: 700;
    text-align: center;
    color: var(--accent);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .send-btn {
    padding: 8px 12px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent);
    border: none;
    border-radius: 8px;
  }
  .remove-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    color: var(--enemy-border);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
</style>
