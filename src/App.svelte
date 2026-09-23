<script>
  import CreatureList from './components/CreatureList.svelte'
  import AddCreatureRow from './components/AddCreatureRow.svelte'
  import CatalogPage from './components/CatalogPage.svelte'
  import InstallButton from './components/InstallButton.svelte'
  import AwakeToggle from './components/AwakeToggle.svelte'
  import HpSheet from './components/HpSheet.svelte'
  import TurnBar from './components/TurnBar.svelte'
  import Toast from './components/Toast.svelte'
  import ConfirmDialog from './components/ConfirmDialog.svelte'
  import UpdateBanner from './components/UpdateBanner.svelte'
  import {
    createCreature,
    damage,
    heal,
    addDeathSave,
    revive,
    toggleCondition,
    addTempHp,
    setInitiative,
    setCa,
    rename,
    setMaxHp,
    removeCreature,
  } from './lib/creatures.js'
  import { conditionLabel } from './lib/conditions.js'
  import { nextTurn, previousTurn } from './lib/turns.js'
  import { record, undo, describeHpChange } from './lib/history.js'
  import { createCatalogCreature, setBaseHp, spawnFromCatalog, spawnGroup } from './lib/catalog.js'
  import { loadState, saveState, loadCatalog, saveCatalog, loadPrefs, savePrefs } from './lib/storage.js'
  import { createWakeLock } from './lib/wakeLock.js'
  import { watchForUpdate, applyUpdate } from './lib/version.js'

  const TOAST_MS = 5000
  const DEATH_SAVE_LABELS = { success: 'success', failure: 'failure', nat1: 'natural 1', nat20: 'natural 20' }

  const initial = loadState()
  let creatures = $state(initial.creatures)
  let activeCreatureId = $state(initial.activeCreatureId)
  let round = $state(initial.round)
  let catalog = $state(loadCatalog())
  let view = $state('encounter')
  let history = $state([])
  let toast = $state(null)
  let hpTargetId = $state(null)
  let pendingConfirm = $state(null)
  let prefs = $state(loadPrefs())
  let screenAwake = $state(false)
  let updateNotice = $state('none')
  let toastId = 0
  let toastTimer

  $effect(() => saveState({ creatures, activeCreatureId, round }))
  $effect(() => saveCatalog(catalog))
  $effect(() => savePrefs(prefs))

  // Keep the screen on while combat is running (someone holds the turn).
  const wakeLock = createWakeLock({ onChange: (held) => (screenAwake = held) })
  $effect(() => {
    wakeLock.update(prefs.keepAwake && activeCreatureId !== null)
  })
  $effect(() => () => wakeLock.destroy())
  $effect(() => () => clearTimeout(toastTimer))

  $effect(() => watchForUpdate({ current: __APP_VERSION__, onAvailable: () => updateNotice === 'none' && (updateNotice = 'available') }))

  function dismissUpdate() {
    updateNotice = 'dismissed'
    document.getElementById(`tab-${view}`)?.focus()
  }

  const activeName = $derived(creatures.find((c) => c.id === activeCreatureId)?.name ?? null)
  const hpTarget = $derived(creatures.find((c) => c.id === hpTargetId) ?? null)

  function notify(message, undoable = true) {
    clearTimeout(toastTimer)
    toast = message ? { message, undoable, id: ++toastId } : null
    if (toast) toastTimer = setTimeout(() => (toast = null), TOAST_MS)
  }

  /** Snapshots the encounter so the change made by `apply` can be undone. */
  function commit(label, apply) {
    history = record(history, { ...$state.snapshot({ creatures, activeCreatureId, round }), label })
    apply()
    notify(label)
  }

  function undoLast() {
    const { history: rest, entry } = undo(history)
    if (!entry) return
    history = rest
    creatures = entry.creatures
    activeCreatureId = entry.activeCreatureId
    round = entry.round
    notify(entry.label && `Undone: ${entry.label}`, false)
  }

  /** Applies a pure change to one creature, labelling it from its before/after state. */
  function change(id, apply, describe) {
    const before = creatures.find((c) => c.id === id)
    if (!before) return
    const after = apply(before)
    commit(describe(before, after), () => (creatures = creatures.map((c) => (c.id === id ? after : c))))
  }

  /** @param {import('./lib/types.js').CreatureInput & { saveToCatalog?: boolean }} data */
  function addCreature({ saveToCatalog, ...spec }) {
    const creature = createCreature(spec)
    commit(`${creature.name} added`, () => (creatures = [...creatures, creature]))
    if (saveToCatalog) addToCatalog({ ...spec, hp: creature.maxHp })
  }
  const handleDeathSave = (id, kind) =>
    change(
      id,
      (c) => addDeathSave(c, kind),
      (c) => `${c.name} death save: ${DEATH_SAVE_LABELS[kind]}`,
    )
  const handleRevive = (id) => change(id, revive, (c) => `${c.name} revived`)
  const handleToggleCondition = (id, key) =>
    change(
      id,
      (c) => toggleCondition(c, key),
      (c, after) => `${c.name} ${conditionLabel(key)} ${after.conditions.includes(key) ? 'on' : 'off'}`,
    )
  const handleSetInitiative = (id, value) =>
    change(
      id,
      (c) => setInitiative(c, value),
      (c, after) => `${c.name} initiative ${after.initiative}`,
    )
  const handleSetCa = (id, value) =>
    change(
      id,
      (c) => setCa(c, value),
      (c, after) => `${c.name} AC ${after.ca}`,
    )
  const handleEdit = (id, { name, maxHp }) =>
    change(
      id,
      (c) => setMaxHp(rename(c, name), maxHp),
      (c) => `${c.name} edited`,
    )

  function applyHp(apply) {
    change(hpTargetId, apply, describeHpChange)
    hpTargetId = null
  }

  const advanceTurn = () => commit(null, () => ({ activeCreatureId, round } = nextTurn(creatures, { activeCreatureId, round })))
  const rewindTurn = () => commit(null, () => ({ activeCreatureId, round } = previousTurn(creatures, { activeCreatureId, round })))

  // Arrow keys move between the two tabs (WAI-ARIA tabs pattern).
  const TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight'])
  function onTabKey(event) {
    if (!TAB_KEYS.has(event.key)) return
    view = view === 'encounter' ? 'catalog' : 'encounter'
    document.getElementById(`tab-${view}`)?.focus()
  }

  /** Asks through the in-app dialog, then runs `action` if the user confirms. */
  function askThen(question, action) {
    pendingConfirm = { ...question, action }
  }

  function answerConfirm() {
    const { action } = pendingConfirm
    pendingConfirm = null
    action()
  }

  // No confirmation: removal is one tap away from Undo.
  function removeFromEncounter(id) {
    const creature = creatures.find((c) => c.id === id)
    if (!creature) return
    commit(`${creature.name} removed`, () => ({ creatures, activeCreatureId } = removeCreature(creatures, activeCreatureId, id)))
  }

  function clearEncounter() {
    const question = {
      title: 'Start a new encounter?',
      message: 'Every combatant, the round and the turn order will be cleared.',
      confirmLabel: 'Clear encounter',
    }
    askThen(question, () =>
      commit('Encounter cleared', () => {
        creatures = []
        activeCreatureId = null
        round = 1
      }),
    )
  }

  const addToCatalog = (data) => (catalog = [...catalog, createCatalogCreature(data)])
  function removeFromCatalog(id) {
    const creature = catalog.find((c) => c.id === id)
    if (!creature) return
    const question = { title: `Delete ${creature.name}?`, message: 'It will be removed from the catalog for good.', confirmLabel: 'Delete' }
    askThen(question, () => (catalog = catalog.filter((c) => c.id !== id)))
  }
  const setCatalogHp = (id, value) => (catalog = catalog.map((c) => (c.id === id ? setBaseHp(c, value) : c)))
  const setCatalogCa = (id, value) => (catalog = catalog.map((c) => (c.id === id ? setCa(c, value) : c)))

  function clearCatalog() {
    const question = {
      title: 'Delete the whole catalog?',
      message: `All ${catalog.length} saved creatures will be removed for good.`,
      confirmLabel: 'Delete all',
    }
    askThen(question, () => (catalog = []))
  }

  function sendFromCatalog(id, initiative, count = 1) {
    const source = catalog.find((c) => c.id === id)
    if (!source) return
    const group = spawnGroup(source, initiative, count, creatures)
    const who = group.length > 1 ? `${source.name} ×${group.length}` : group[0].name
    commit(`${who} sent to encounter`, () => (creatures = [...creatures, ...group]))
  }

  function sendParty(entries) {
    const spawned = entries.flatMap(({ id, initiative }) => {
      const source = catalog.find((c) => c.id === id)
      return source ? [spawnFromCatalog(source, initiative)] : []
    })
    commit(`Party sent to encounter (${spawned.length})`, () => (creatures = [...creatures, ...spawned]))
  }

  const editCatalog = (id, { name, maxHp }) => (catalog = catalog.map((c) => (c.id === id ? setBaseHp(rename(c, name), maxHp) : c)))
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
        <button
          class="new-encounter"
          aria-label="New encounter"
          title="Clear all and start fresh"
          onclick={clearEncounter}
          disabled={creatures.length === 0}
        >
          New<span class="long">&nbsp;encounter</span>
        </button>
      {/if}
      {#if wakeLock.supported}
        <AwakeToggle enabled={prefs.keepAwake} held={screenAwake} onToggle={() => (prefs = { ...prefs, keepAwake: !prefs.keepAwake })} />
      {/if}
    </div>
  </header>

  <div class="tabs" role="tablist" aria-label="Pages" tabindex="-1" onkeydown={onTabKey}>
    <button
      id="tab-encounter"
      class="tab"
      class:active={view === 'encounter'}
      role="tab"
      aria-selected={view === 'encounter'}
      tabindex={view === 'encounter' ? 0 : -1}
      aria-controls="view-panel"
      onclick={() => (view = 'encounter')}
    >
      Encounter
      {#if creatures.length > 0}<span class="tab-count">{creatures.length}</span>{/if}
    </button>
    <button
      id="tab-catalog"
      class="tab"
      class:active={view === 'catalog'}
      role="tab"
      aria-selected={view === 'catalog'}
      tabindex={view === 'catalog' ? 0 : -1}
      aria-controls="view-panel"
      onclick={() => (view = 'catalog')}
    >
      Catalog
    </button>
  </div>

  <div class="panel" id="view-panel" role="tabpanel" aria-labelledby="tab-{view}">
    {#if view === 'encounter'}
      <CreatureList
        {creatures}
        {activeCreatureId}
        onDeathSave={handleDeathSave}
        onRevive={handleRevive}
        onToggleCondition={handleToggleCondition}
        onSetInitiative={handleSetInitiative}
        onSetCa={handleSetCa}
        onEdit={handleEdit}
        onRemove={removeFromEncounter}
        onAdjustHp={(id) => (hpTargetId = id)}
      />

      <AddCreatureRow onAdd={addCreature} offerSaveToCatalog />

      {#if hpTarget}
        <HpSheet
          creature={hpTarget}
          onDamage={(amount) => applyHp((c) => damage(c, amount))}
          onHeal={(amount) => applyHp((c) => heal(c, amount))}
          onAddTemp={(amount) => applyHp((c) => addTempHp(c, amount))}
          onClose={() => (hpTargetId = null)}
        />
      {/if}
    {:else}
      <CatalogPage
        {catalog}
        onAdd={addToCatalog}
        onRemove={removeFromCatalog}
        onSetHp={setCatalogHp}
        onSetCa={setCatalogCa}
        onSend={sendFromCatalog}
        onClear={clearCatalog}
        onEdit={editCatalog}
        onSendParty={sendParty}
        encounter={creatures}
      />
    {/if}
  </div>

  {#if pendingConfirm}
    <ConfirmDialog
      title={pendingConfirm.title}
      message={pendingConfirm.message}
      confirmLabel={pendingConfirm.confirmLabel}
      onConfirm={answerConfirm}
      onCancel={() => (pendingConfirm = null)}
    />
  {/if}

  <div class="dock" class:bare={view !== 'encounter'}>
    {#if toast}
      <div class="toast-slot">
        {#key toast.id}
          <Toast message={toast.message} undoable={toast.undoable} onUndo={undoLast} />
        {/key}
      </div>
    {/if}
    <UpdateBanner available={updateNotice === 'available'} onReload={() => applyUpdate()} onDismiss={dismissUpdate} />
    {#if view === 'encounter'}
      <TurnBar
        {round}
        {activeName}
        canUndo={history.length > 0}
        hasCreatures={creatures.length > 0}
        onPrevious={rewindTurn}
        onNext={advanceTurn}
        onUndo={undoLast}
      />
    {/if}
  </div>
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
    /* Top inset clears the (translucent) status bar in standalone / landscape. */
    padding: max(8px, env(safe-area-inset-top)) 12px 8px;
    border-bottom: 1px solid var(--border);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    /* Shrink instead of pushing overflow so the title can truncate. */
    min-width: 0;
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
    /* Keep the title on one line so the header height matches across views;
       truncate rather than wrap on very narrow screens. */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .panel {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .tabs {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .tab {
    flex: 1;
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .tab-count {
    display: inline-block;
    min-width: 1.4em;
    margin-left: 6px;
    padding: 0 6px;
    font-size: 0.8rem;
    line-height: 1.4;
    border-radius: 999px;
    color: var(--bg);
    background: var(--text-muted);
  }
  .tab.active .tab-count {
    color: var(--accent);
    background: var(--bg);
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
  .new-encounter {
    flex: 0 0 auto;
    height: var(--control);
    padding: 0 12px;
    white-space: nowrap;
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
  /* Turn controls stay within thumb reach at the bottom of the screen. */
  .dock {
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  .toast-slot {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: calc(100% + 8px);
  }
  /* Without the turn bar underneath, keep the toast clear of the home indicator. */
  .dock.bare .toast-slot {
    bottom: calc(100% + max(8px, env(safe-area-inset-bottom)));
  }
  /* Without the turn bar underneath, keep the update banner clear of the home indicator. */
  .dock.bare :global(.update-banner) {
    margin-bottom: max(8px, env(safe-area-inset-bottom));
  }
  .new-encounter:disabled {
    opacity: 0.4;
  }
  /* Narrow phones: just "New" so the title keeps its room (the accessible name stays
     "New encounter"). */
  @media (max-width: 420px) {
    .new-encounter .long {
      display: none;
    }
  }

  /* Tablet and up: keep the two tabs from stretching edge-to-edge. */
  @media (min-width: 768px) {
    .tabs {
      justify-content: center;
    }
    .tab {
      flex: 0 1 220px;
    }
  }

  /* Landscape phone: reclaim vertical space by slimming the chrome. */
  @media (orientation: landscape) and (max-height: 500px) {
    header {
      padding-top: max(6px, env(safe-area-inset-top));
      padding-bottom: 6px;
    }
    h1 {
      font-size: 1.15rem;
    }
    .tabs {
      padding: 6px 12px;
    }
  }
</style>
