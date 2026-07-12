<script>
  let { onAdd, showInitiative = true } = $props()

  let name = $state('')
  let hp = $state('')
  let maxHp = $state('')
  let ca = $state('')
  let initiative = $state('')
  let isPlayer = $state(true)

  const isValid = $derived(name.trim() !== '' && hp !== '' && (!showInitiative || initiative !== ''))

  function reset() {
    name = ''
    hp = ''
    maxHp = ''
    ca = ''
    initiative = ''
    isPlayer = true
  }

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
    onAdd(buildCreature())
    reset()
  }
</script>

<form class="add-form" onsubmit={handleSubmit}>
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
      <label for="ca">CA</label>
      <input id="ca" type="number" min="0" placeholder="10" bind:value={ca} />
    </div>

    {#if showInitiative}
      <div class="field">
        <label for="initiative">Initiative</label>
        <input id="initiative" type="number" bind:value={initiative} />
      </div>
    {/if}
  </div>

  <fieldset class="side">
    <legend>Side</legend>
    <label><input type="radio" bind:group={isPlayer} value={true} /> Player</label>
    <label><input type="radio" bind:group={isPlayer} value={false} /> Enemy</label>
  </fieldset>

  <button type="submit" disabled={!isValid}>Add</button>
</form>

<style>
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 12px 12px;
    padding: 12px 16px;
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
    gap: 10px;
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
    padding: 10px;
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  input[type='number'] {
    width: 100%;
  }
  .side {
    display: flex;
    gap: 16px;
    align-items: center;
    margin: 0;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .side legend {
    padding: 0 6px;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .side label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text);
  }
  button[type='submit'] {
    padding: 12px;
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
      padding: 8px 16px;
    }
    .stats {
      gap: 8px;
    }
    input[type='text'],
    input[type='number'] {
      padding: 8px 10px;
    }
    button[type='submit'] {
      padding: 8px 12px;
    }
  }
</style>
