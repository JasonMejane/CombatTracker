<script>
  import CreatureList from './components/CreatureList.svelte'
  import AddCreatureForm from './components/AddCreatureForm.svelte'
  import CatalogPage from './components/CatalogPage.svelte'
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
    setInitiative,
    setCa,
  } from './lib/creatures.js'
  import {
    createCatalogCreature,
    setBaseHp,
    spawnFromCatalog,
    uniqueEnemyName,
  } from './lib/catalog.js'
  import { loadState, saveState, loadCatalog, saveCatalog } from './lib/storage.js'

  const initial = loadState()
  let creatures = $state(initial.creatures)
  let activeCreatureId = $state(initial.activeCreatureId)
  let catalog = $state(loadCatalog())
  let view = $state('encounter')

  $effect(() => saveState({ creatures, activeCreatureId }))
  $effect(() => saveCatalog(catalog))

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
  const handleSetInitiative = (id, value) => update(id, (c) => setInitiative(c, value))
  const handleSetCa = (id, value) => update(id, (c) => setCa(c, value))
  const advanceTurn = () => (activeCreatureId = nextActiveId(creatures, activeCreatureId))

  function clearEncounter() {
    if (!confirm('Clear all combatants and start a fresh encounter?')) return
    creatures = []
    activeCreatureId = null
  }

  const addToCatalog = (data) => (catalog = [...catalog, createCatalogCreature(data)])
  const removeFromCatalog = (id) => (catalog = catalog.filter((c) => c.id !== id))
  const setCatalogHp = (id, value) =>
    (catalog = catalog.map((c) => (c.id === id ? setBaseHp(c, value) : c)))
  const setCatalogCa = (id, value) =>
    (catalog = catalog.map((c) => (c.id === id ? setCa(c, value) : c)))

  function sendFromCatalog(id, initiative) {
    const source = catalog.find((c) => c.id === id)
    if (!source) return
    const name = source.isPlayer ? source.name : uniqueEnemyName(creatures, source.name)
    creatures = [...creatures, spawnFromCatalog(source, initiative, name)]
    view = 'encounter'
  }
</script>

<main>
  <header>
    <div class="brand">
      <img src="/favicon.svg" alt="" class="logo" width="32" height="32" />
      <h1>Combat Tracker</h1>
    </div>
    <div class="header-actions">
      <InstallButton />
      {#if view === 'encounter'}
        <button class="next-turn" onclick={advanceTurn} disabled={creatures.length === 0}>
          Next turn
        </button>
      {/if}
    </div>
  </header>

  <nav class="tabs">
    <button class="tab" class:active={view === 'encounter'} onclick={() => (view = 'encounter')}>
      Encounter
    </button>
    <button class="tab" class:active={view === 'catalog'} onclick={() => (view = 'catalog')}>
      Catalog
    </button>
  </nav>

  {#if view === 'encounter'}
    <CreatureList
      {creatures}
      {activeCreatureId}
      onDamage={handleDamage}
      onHeal={handleHeal}
      onDeathSave={handleDeathSave}
      onRevive={handleRevive}
      onToggleCondition={handleToggleCondition}
      onAddTemp={handleAddTemp}
      onSetInitiative={handleSetInitiative}
      onSetCa={handleSetCa}
    />

    <AddCreatureForm onAdd={addCreature} />

    <footer class="encounter-footer">
      <button
        class="new-encounter"
        aria-label="New encounter"
        title="Clear all and start fresh"
        onclick={clearEncounter}
        disabled={creatures.length === 0}
      >
        New encounter
      </button>
    </footer>
  {:else}
    <CatalogPage
      {catalog}
      onAdd={addToCatalog}
      onRemove={removeFromCatalog}
      onSetHp={setCatalogHp}
      onSetCa={setCatalogCa}
      onSend={sendFromCatalog}
    />
  {/if}
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
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    display: block;
    border-radius: 6px;
  }
  h1 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--accent);
    letter-spacing: 0.5px;
  }
  .tabs {
    display: flex;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  .tab {
    flex: 1;
    padding: 10px 14px;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .tab.active {
    color: var(--bg);
    background: var(--accent);
    border-color: var(--accent);
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
  .encounter-footer {
    display: flex;
    justify-content: center;
    padding: 12px 16px 20px;
  }
  .new-encounter {
    padding: 10px 14px;
    font-weight: 700;
    color: var(--enemy-border);
    background: transparent;
    border: 1px solid var(--enemy-border);
    border-radius: 8px;
  }
  .new-encounter:hover:not(:disabled) {
    color: var(--text);
    background: var(--enemy);
  }
  .next-turn:disabled,
  .new-encounter:disabled {
    opacity: 0.4;
  }
  :global(.creature-list) {
    flex: 1;
  }
</style>
