<script>
  import { isDown, deathState, healthState } from '../lib/creatures.js'
  import { conditionEmoji, conditionLabel } from '../lib/conditions.js'
  import HpBar from './HpBar.svelte'
  import ConditionPicker from './ConditionPicker.svelte'
  import EditCreatureForm from './EditCreatureForm.svelte'

  let {
    creature,
    isActive = false,
    onDeathSave = () => {},
    onRevive = () => {},
    onToggleCondition = () => {},
    onSetInitiative = () => {},
    onSetCa = () => {},
    onEdit = () => {},
    onRemove = () => {},
    onAdjustHp = () => {},
  } = $props()

  let showConditions = $state(false)
  let editing = $state(false)
  let editingInitiative = $state(false)
  let initiativeDraft = $state(0)
  let editingCa = $state(false)
  let caDraft = $state(0)
  let rowElement = $state()

  $effect(() => {
    if (isActive) rowElement?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  })

  function startEditInitiative() {
    initiativeDraft = creature.initiative
    editingInitiative = true
  }

  function commitInitiative() {
    if (!editingInitiative) return
    editingInitiative = false
    onSetInitiative(Number(initiativeDraft))
  }

  function onInitiativeKey(event) {
    if (event.key === 'Enter') commitInitiative()
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

  function focusOnMount(node) {
    node.focus()
    node.select()
  }

  function saveEdit(changes) {
    editing = false
    onEdit(changes)
  }

  const deathStatus = $derived(deathState(creature))
  const downed = $derived(isDown(creature))
  const greyed = $derived(downed && !creature.isPlayer)
  const showDeathSaves = $derived(downed && creature.isPlayer)
  const showHpControls = $derived(deathStatus !== 'dead')
  const showRevive = $derived(deathStatus === 'dead' || greyed)
  const hpVariant = $derived(healthState(creature))
  const counted = (n, one, many) => `${n} ${n === 1 ? one : many}`
  const tally = $derived(
    `${counted(creature.deathSaves.successes, 'success', 'successes')}, ${counted(creature.deathSaves.failures, 'failure', 'failures')}`,
  )

  const pips = [1, 2, 3]
</script>

<div class="row-wrap">
  <div
    bind:this={rowElement}
    aria-current={isActive ? 'true' : undefined}
    class="creature-row"
    class:player={creature.isPlayer}
    class:enemy={!creature.isPlayer}
    class:active={isActive}
    class:down={greyed}
  >
    <div class="top">
      {#if editingInitiative}
        <input
          class="initiative-input"
          type="number"
          aria-label="Initiative"
          bind:value={initiativeDraft}
          onblur={commitInitiative}
          onkeydown={onInitiativeKey}
          use:focusOnMount
        />
      {:else}
        <button class="initiative" title="Edit initiative" onclick={startEditInitiative}>{creature.initiative}</button>
      {/if}
      <span class="name">{creature.name}</span>

      {#if editingCa}
        <input class="ca-input" type="number" aria-label="AC" bind:value={caDraft} onblur={commitCa} onkeydown={onCaKey} use:focusOnMount />
      {:else}
        <button class="ca" title="Edit armor class" onclick={startEditCa}>AC {creature.ca}</button>
      {/if}

      <button class="edit-toggle" aria-label="Edit {creature.name}" aria-expanded={editing} onclick={() => (editing = !editing)}>✎</button>
    </div>

    <div class="status">
      {#if showDeathSaves}
        <div class="death-saves" data-testid="death-saves">
          {#if deathStatus === 'dead'}
            <span class="death-label">Dead</span>
          {:else if deathStatus === 'stable'}
            <span class="death-label">Stable</span>
          {/if}
          <span class="tally" role="img" aria-label={tally}>
            <span class="pips successes">
              {#each pips as n (n)}
                <span class="pip success" class:filled={creature.deathSaves.successes >= n}></span>
              {/each}
            </span>
            <span class="pips failures">
              {#each pips as n (n)}
                <span class="pip failure" class:filled={creature.deathSaves.failures >= n}></span>
              {/each}
            </span>
          </span>
          {#if deathStatus === 'dying'}
            <div class="save-buttons">
              <button class="save-btn success" aria-label="Add success" onclick={() => onDeathSave('success')}>✓</button>
              <button class="save-btn failure" aria-label="Add failure" onclick={() => onDeathSave('failure')}>✗</button>
              <button
                class="save-btn nat failure"
                aria-label="Natural 1"
                title="Natural 1: two failures"
                onclick={() => onDeathSave('nat1')}>1</button
              >
              <button
                class="save-btn nat success"
                aria-label="Natural 20"
                title="Natural 20: back up with 1 HP"
                onclick={() => onDeathSave('nat20')}>20</button
              >
            </div>
          {/if}
        </div>
        {#if showHpControls}
          <button class="hp-adjust" aria-label="Adjust HP for {creature.name}" onclick={() => onAdjustHp()}>±</button>
        {/if}
      {:else if showHpControls}
        <button class="hp-open" aria-label="Adjust HP for {creature.name}" title="Damage, heal or add temp HP" onclick={() => onAdjustHp()}>
          <HpBar current={creature.currentHp} max={creature.maxHp} temp={creature.tempHp} variant={hpVariant} />
          <span class="hp-adjust" aria-hidden="true">±</span>
        </button>
      {:else}
        <HpBar current={creature.currentHp} max={creature.maxHp} temp={creature.tempHp} variant={hpVariant} />
      {/if}
      <button
        class="cond-toggle"
        aria-label="Add condition"
        title="Add or remove conditions"
        aria-expanded={showConditions}
        onclick={() => (showConditions = !showConditions)}><span aria-hidden="true">🏷️</span></button
      >
      {#if showRevive}
        <button class="revive-btn" aria-label="Revive" onclick={() => onRevive()}>Revive</button>
      {/if}
    </div>

    {#if creature.conditions.length > 0}
      <div class="conditions-bar">
        {#each creature.conditions as key (key)}
          <button class="cond-chip" aria-label="Remove {conditionLabel(key)}" title="Tap to remove" onclick={() => onToggleCondition(key)}>
            <span class="cond-emoji" aria-hidden="true">{conditionEmoji(key)}</span>
            <span class="cond-label">{conditionLabel(key)}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if editing}
    <EditCreatureForm
      name={creature.name}
      maxHp={creature.maxHp}
      onSave={saveEdit}
      onCancel={() => (editing = false)}
      onRemove={() => onRemove()}
    />
  {/if}

  {#if showConditions}
    <ConditionPicker active={creature.conditions} onToggle={onToggleCondition} />
  {/if}
</div>

<style>
  .row-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  /* Name line, HP line, then a conditions line only when there are any. */
  .creature-row {
    /* Keep the row clear of the sticky turn bar when scrolled into view. */
    scroll-margin: 8px 0 80px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  /* Neutral card; the side is a coloured stripe so colour stays free for HP. */
  .player {
    border-left: 5px solid var(--player-border);
  }
  .enemy {
    border-left: 5px solid var(--enemy-border);
  }
  .active {
    position: relative;
    background: var(--surface-2);
    border-color: var(--accent);
    box-shadow:
      0 0 0 1px var(--accent),
      0 0 16px -2px var(--active-glow);
  }
  .active.player,
  .active.enemy {
    border-left-width: 5px;
  }
  .active.player {
    border-left-color: var(--player-border);
  }
  .active.enemy {
    border-left-color: var(--enemy-border);
  }
  /* A ▶ marker in the list gutter points at whoever is acting. */
  .active::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -11px;
    width: 7px;
    height: 12px;
    background: var(--accent);
    clip-path: polygon(0 0, 100% 50%, 0 100%);
    transform: translateY(-50%);
  }
  .active .name {
    font-size: 1.05rem;
    font-weight: 700;
  }
  .down {
    opacity: 0.55;
    filter: grayscale(0.8);
  }
  .top,
  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .conditions-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }
  /* Every button in the card is --control tall; icon buttons are square. */
  .initiative,
  .edit-toggle,
  .cond-toggle,
  .save-btn,
  .hp-adjust {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: var(--control);
    height: var(--control);
    padding: 0;
    border-radius: 8px;
  }
  .initiative {
    font: inherit;
    font-weight: 700;
    color: var(--accent);
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border);
  }
  .initiative-input,
  .ca-input {
    width: 4rem;
    height: var(--control);
    padding: 0 6px;
    font: inherit;
    font-weight: 700;
    text-align: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .initiative-input {
    color: var(--accent);
  }
  .ca-input {
    color: var(--text);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ca {
    flex: 0 0 auto;
    height: var(--control);
    padding: 0 8px;
    font-size: 0.8rem;
    font-weight: 700;
    font-family: inherit;
    color: var(--text);
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border);
    border-radius: 8px;
    white-space: nowrap;
  }
  .edit-toggle {
    font-size: 1rem;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid transparent;
  }
  .edit-toggle:hover,
  .edit-toggle[aria-expanded='true'] {
    color: var(--text);
    border-color: var(--border);
  }
  .cond-toggle {
    font-size: 1rem;
    background: transparent;
    border: 1px dashed var(--border);
  }
  .cond-toggle[aria-expanded='true'] {
    border-style: solid;
    border-color: var(--accent);
  }
  .cond-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: var(--chip);
    padding: 0 8px;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1;
    color: var(--text);
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border);
    border-radius: 999px;
  }
  .cond-emoji {
    font-size: 0.95rem;
  }
  .death-saves {
    flex: 1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
    min-width: 0;
  }
  .death-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }
  .tally {
    display: flex;
    gap: 10px;
  }
  .pips {
    display: flex;
    gap: 3px;
  }
  .pip {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--text-muted);
  }
  .pip.success.filled {
    background: var(--player-border);
    border-color: var(--player-border);
  }
  .pip.failure.filled {
    background: var(--enemy-border);
    border-color: var(--enemy-border);
  }
  .save-buttons {
    display: flex;
    gap: 6px;
    margin-left: auto;
  }
  .save-btn {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
  }
  .save-btn.nat {
    font-size: 0.85rem;
  }
  .save-btn.success {
    color: var(--player-border);
  }
  .save-btn.failure {
    color: var(--enemy-border);
  }
  /* The HP bar and its ± form one big tap target that opens the HP sheet. */
  .hp-open {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    height: var(--control);
    padding: 0;
    color: inherit;
    background: transparent;
    border: none;
    border-radius: 8px;
  }
  .hp-open :global(.hp-bar) {
    height: calc(var(--control) - 8px);
  }
  .hp-adjust {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--accent);
    background: var(--surface-2);
    border: 1px solid var(--border);
  }
  .revive-btn {
    height: var(--control);
    padding: 0 12px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent);
    border: none;
    border-radius: 8px;
  }
</style>
