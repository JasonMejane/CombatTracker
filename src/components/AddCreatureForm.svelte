<script>
  import { rollInitiative } from '../lib/dice.js'

  let { onAdd, showInitiative = true, offerSaveToCatalog = false } = $props()

  let name = $state('')
  let hp = $state('')
  let maxHp = $state('')
  let ca = $state('')
  let initiative = $state('')
  let isPlayer = $state(true)
  let bonus = $state(0)
  let saveToCatalog = $state(false)

  const isValid = $derived(name.trim() !== '' && hp !== '' && (!showInitiative || initiative !== ''))

  function reset() {
    name = ''
    hp = ''
    maxHp = ''
    ca = ''
    initiative = ''
    isPlayer = true
    bonus = 0
    saveToCatalog = false
  }

  const roll = () => (initiative = String(rollInitiative(Number(bonus))))

  function buildCreature() {
    return {
      name: name.trim(),
      hp: Number(hp),
      isPlayer,
      ...(showInitiative ? { initiative: Number(initiative) } : {}),
      ...(maxHp !== '' ? { maxHp: Number(maxHp) } : {}),
      ...(ca !== '' ? { ca: Number(ca) } : {}),
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) return
    onAdd(saveToCatalog ? { ...buildCreature(), saveToCatalog: true } : buildCreature())
    reset()
  }
</script>

<form class="add-form" onsubmit={handleSubmit}>
  <fieldset class="side">
    <legend class="visually-hidden">Side</legend>
    <label class="side-option player"><input type="radio" bind:group={isPlayer} value={true} /> Player</label>
    <label class="side-option enemy"><input type="radio" bind:group={isPlayer} value={false} /> Enemy</label>
  </fieldset>

  <div class="field name">
    <label for="name">Name</label>
    <input id="name" type="text" bind:value={name} autocomplete="off" />
  </div>

  <div class="stats">
    <div class="field">
      <label for="hp">HP</label>
      <input id="hp" type="number" min="1" bind:value={hp} />
    </div>

    <div class="field">
      <label for="maxHp">Max HP</label>
      <input id="maxHp" type="number" min="1" placeholder="= HP" bind:value={maxHp} />
    </div>

    <div class="field">
      <label for="ca">AC</label>
      <input id="ca" type="number" min="0" placeholder="10" bind:value={ca} />
    </div>

    {#if showInitiative}
      <div class="field">
        <label for="initiative">Initiative</label>
        <div class="with-roll">
          <input id="initiative" type="number" bind:value={initiative} />
          {#if !isPlayer}
            <button type="button" class="roll" aria-label="Roll" title="Roll a d20 + bonus" onclick={roll}>🎲</button>
          {/if}
        </div>
      </div>
      {#if !isPlayer}
        <div class="field">
          <label for="bonus">Init bonus</label>
          <input id="bonus" type="number" bind:value={bonus} />
        </div>
      {/if}
    {/if}
  </div>

  {#if offerSaveToCatalog}
    <label class="save"><input type="checkbox" bind:checked={saveToCatalog} /> Also save to catalog</label>
  {/if}

  <button type="submit" disabled={!isValid}>Add</button>
</form>

<style>
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 8px 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }
  /* Numeric fields spread evenly across the width (auto-fit collapses spare tracks
     here because there are no full-width siblings inside .stats) and wrap 2-up on
     small phones. */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    align-items: end;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  label {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  input[type='text'],
  input[type='number'] {
    height: var(--control);
    padding: 0 10px;
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  input[type='number'] {
    width: 100%;
  }
  /* Side is a two-button segmented toggle coloured like the rows it creates. */
  .side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: none;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .side-option {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--control);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
  }
  .side-option input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .side-option:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .side-option.player:has(input:checked) {
    color: var(--text);
    background: var(--player);
    border-color: var(--player-border);
  }
  .side-option.enemy:has(input:checked) {
    color: var(--text);
    background: var(--enemy);
    border-color: var(--enemy-border);
  }
  .with-roll {
    display: flex;
    gap: 6px;
  }
  .with-roll input {
    flex: 1;
    min-width: 0;
  }
  .roll {
    flex: 0 0 auto;
    width: var(--control);
    height: var(--control);
    padding: 0;
    font-size: 1.1rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .save {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: var(--chip);
    font-size: 0.9rem;
    color: var(--text);
  }
  .save input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
  }
  button[type='submit'] {
    height: var(--control);
    padding: 0 12px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent);
    border: none;
    border-radius: 8px;
  }
  button[type='submit']:disabled {
    opacity: 0.4;
  }

  /* Landscape phone: tighten the form so it eats less vertical space. */
  @media (orientation: landscape) and (max-height: 500px) {
    .add-form {
      gap: 6px;
      padding: 8px 12px;
    }
    .stats {
      gap: 6px;
    }
  }
</style>
