<script>
  import CreatureList from './components/CreatureList.svelte'
  import AddCreatureForm from './components/AddCreatureForm.svelte'
  import InstallButton from './components/InstallButton.svelte'
  import {
    createCreature,
    damage,
    heal,
    addDeathSave,
    revive,
    nextActiveId,
    toggleCondition,
    addTempHp,
  } from './lib/creatures.js'
  import { loadState, saveState } from './lib/storage.js'

  const initial = loadState()
  let creatures = $state(initial.creatures)
  let activeCreatureId = $state(initial.activeCreatureId)

  $effect(() => saveState({ creatures, activeCreatureId }))

  function update(id, change) {
    creatures = creatures.map((c) => (c.id === id ? change(c) : c))
  }

  const addCreature = (data) => (creatures = [...creatures, createCreature(data)])
  const handleDamage = (id, amount) => update(id, (c) => damage(c, amount))
  const handleHeal = (id, amount) => update(id, (c) => heal(c, amount))
  const handleDeathSave = (id, kind) => update(id, (c) => addDeathSave(c, kind))
  const handleRevive = (id) => update(id, revive)
  const handleToggleCondition = (id, key) => update(id, (c) => toggleCondition(c, key))
  const handleAddTemp = (id, amount) => update(id, (c) => addTempHp(c, amount))
  const advanceTurn = () => (activeCreatureId = nextActiveId(creatures, activeCreatureId))

  function clearEncounter() {
    if (!confirm('Clear all combatants and start a fresh encounter?')) return
    creatures = []
    activeCreatureId = null
  }
</script>

<main>
  <header>
    <h1>Combat Tracker</h1>
    <div class="header-actions">
      <InstallButton />
      <button
        class="new-encounter"
        aria-label="New encounter"
        title="Clear all and start fresh"
        onclick={clearEncounter}
        disabled={creatures.length === 0}
      >
        New
      </button>
      <button class="next-turn" onclick={advanceTurn} disabled={creatures.length === 0}>
        Next turn
      </button>
    </div>
  </header>

  <CreatureList
    {creatures}
    {activeCreatureId}
    onDamage={handleDamage}
    onHeal={handleHeal}
    onDeathSave={handleDeathSave}
    onRevive={handleRevive}
    onToggleCondition={handleToggleCondition}
    onAddTemp={handleAddTemp}
  />

  <AddCreatureForm onAdd={addCreature} />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    min-height: 100svh;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  h1 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--accent);
    letter-spacing: 0.5px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .next-turn {
    padding: 10px 16px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent);
    border: none;
    border-radius: 8px;
  }
  .new-encounter {
    padding: 10px 14px;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .next-turn:disabled,
  .new-encounter:disabled {
    opacity: 0.4;
  }
  :global(.creature-list) {
    flex: 1;
  }
</style>
