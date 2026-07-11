<script>
  let { onAdd } = $props()

  let name = $state('')
  let hp = $state('')
  let maxHp = $state('')
  let initiative = $state('')
  let isPlayer = $state(true)

  const isValid = $derived(name.trim() !== '' && hp !== '' && initiative !== '')

  function reset() {
    name = ''
    hp = ''
    maxHp = ''
    initiative = ''
    isPlayer = true
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) return
    const creature = { name: name.trim(), hp: Number(hp), initiative: Number(initiative), isPlayer }
    if (maxHp !== '') creature.maxHp = Number(maxHp)
    onAdd(creature)
    reset()
  }
</script>

<form class="add-form" onsubmit={handleSubmit}>
  <div class="field name">
    <label for="name">Name</label>
    <input id="name" type="text" bind:value={name} autocomplete="off" />
  </div>

  <div class="field">
    <label for="hp">HP</label>
    <input id="hp" type="number" min="1" bind:value={hp} />
  </div>

  <div class="field">
    <label for="maxHp">Max HP</label>
    <input id="maxHp" type="number" min="1" placeholder="= HP" bind:value={maxHp} />
  </div>

  <div class="field">
    <label for="initiative">Initiative</label>
    <input id="initiative" type="number" bind:value={initiative} />
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
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    align-items: end;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field.name {
    grid-column: 1 / -1;
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
    grid-column: 1 / -1;
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
    grid-column: 1 / -1;
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
</style>
