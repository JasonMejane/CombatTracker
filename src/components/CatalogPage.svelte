<script>
  import AddCreatureRow from './AddCreatureRow.svelte'
  import CatalogRow from './CatalogRow.svelte'
  import SendPartyForm from './SendPartyForm.svelte'
  import { sortByName, filterBySide, filterByName, playersNotInEncounter } from '../lib/catalog.js'

  let {
    catalog,
    encounter = [],
    onAdd = () => {},
    onRemove = () => {},
    onSetHp = () => {},
    onSetCa = () => {},
    onSend = () => {},
    onClear = () => {},
    onEdit = () => {},
    onSendParty = () => {},
  } = $props()

  let side = $state('all')
  let query = $state('')
  let showParty = $state(false)

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'player', label: 'Players' },
    { key: 'enemy', label: 'Enemies' },
  ]

  const visible = $derived(sortByName(filterByName(filterBySide(catalog, side), query)))
  const missingPlayers = $derived(playersNotInEncounter(catalog, encounter))
  const emptyMessage = $derived(catalog.length === 0 ? 'The catalog is empty — add a creature below.' : 'No creature matches this search.')

  function sendParty(entries) {
    showParty = false
    onSendParty(entries)
  }
</script>

<section class="catalog">
  <div class="filters" role="group" aria-label="Filter by side">
    {#each filters as filter (filter.key)}
      <button class="filter" class:active={side === filter.key} aria-pressed={side === filter.key} onclick={() => (side = filter.key)}>
        {filter.label}
      </button>
    {/each}
  </div>

  {#if catalog.length > 0}
    <div class="toolbar">
      <input class="search" type="search" aria-label="Search catalog" placeholder="Search…" autocomplete="off" bind:value={query} />
      {#if missingPlayers.length > 0}
        <button class="party-toggle" aria-expanded={showParty} onclick={() => (showParty = !showParty)}>Send party</button>
      {/if}
    </div>
  {/if}

  {#if showParty && missingPlayers.length > 0}
    <SendPartyForm players={missingPlayers} onSend={sendParty} onCancel={() => (showParty = false)} />
  {/if}

  {#if visible.length === 0}
    <p class="empty">{emptyMessage}</p>
  {:else}
    <ul class="catalog-list">
      {#each visible as creature (creature.id)}
        <li>
          <CatalogRow
            {creature}
            onRemove={() => onRemove(creature.id)}
            onSetHp={(value) => onSetHp(creature.id, value)}
            onSetCa={(value) => onSetCa(creature.id, value)}
            onSend={(initiative, count) => onSend(creature.id, initiative, count)}
            onEdit={(changes) => onEdit(creature.id, changes)}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <AddCreatureRow {onAdd} showInitiative={false} />

  <footer class="catalog-footer">
    <button class="delete-all" onclick={() => onClear()} disabled={catalog.length === 0}>Delete all</button>
  </footer>
</section>

<style>
  .catalog {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px 0;
  }
  .filter {
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .filter.active {
    color: var(--bg);
    background: var(--accent);
    border-color: var(--accent);
  }
  .toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 12px 0;
  }
  .search {
    flex: 1;
    min-width: 0;
    height: var(--control);
    padding: 0 12px;
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .party-toggle {
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    color: var(--player-border);
    background: transparent;
    border: 1px solid var(--player-border);
    border-radius: 8px;
    white-space: nowrap;
  }
  .party-toggle[aria-expanded='true'] {
    color: var(--text);
    background: var(--player);
  }
  .catalog-list {
    list-style: none;
    margin: 0;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .empty {
    flex: 1;
    padding: 32px 16px;
    text-align: center;
    color: var(--text-muted);
  }
  .catalog-footer {
    display: flex;
    justify-content: center;
    padding: 8px 12px max(12px, env(safe-area-inset-bottom));
    /* Absorb the spare height so the list + add-row hug the top and only this
       footer sits at the bottom of the screen. */
    margin-top: auto;
  }
  .delete-all {
    height: var(--control);
    padding: 0 14px;
    font-weight: 700;
    color: var(--enemy-border);
    background: transparent;
    border: 1px solid var(--enemy-border);
    border-radius: 8px;
  }
  .delete-all:hover:not(:disabled) {
    color: var(--text);
    background: var(--enemy);
  }
  .delete-all:disabled {
    opacity: 0.4;
  }

  /* Landscape phone: reclaim vertical space in the chrome. */
  @media (orientation: landscape) and (max-height: 500px) {
    .filters {
      padding-top: 6px;
    }
    .catalog-footer {
      padding-bottom: max(8px, env(safe-area-inset-bottom));
    }
  }
</style>
