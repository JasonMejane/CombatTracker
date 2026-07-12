<script>
  import AddCreatureForm from './AddCreatureForm.svelte'
  import CatalogRow from './CatalogRow.svelte'
  import { sortByName, filterBySide } from '../lib/catalog.js'

  let {
    catalog,
    onAdd = () => {},
    onRemove = () => {},
    onSetHp = () => {},
    onSetCa = () => {},
    onSend = () => {},
    onClear = () => {},
  } = $props()

  let side = $state('all')

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'player', label: 'Players' },
    { key: 'enemy', label: 'Enemies' },
  ]

  const visible = $derived(sortByName(filterBySide(catalog, side)))
</script>

<section class="catalog">
  <div class="filters" role="group" aria-label="Filter by side">
    {#each filters as filter (filter.key)}
      <button class="filter" class:active={side === filter.key} onclick={() => (side = filter.key)}>
        {filter.label}
      </button>
    {/each}
  </div>

  {#if visible.length === 0}
    <p class="empty">The catalog is empty — add a creature below.</p>
  {:else}
    <ul class="catalog-list">
      {#each visible as creature (creature.id)}
        <li>
          <CatalogRow
            {creature}
            onRemove={() => onRemove(creature.id)}
            onSetHp={(value) => onSetHp(creature.id, value)}
            onSetCa={(value) => onSetCa(creature.id, value)}
            onSend={(initiative) => onSend(creature.id, initiative)}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <AddCreatureForm {onAdd} showInitiative={false} />

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
    padding: 12px 16px 0;
  }
  .filter {
    padding: 8px 14px;
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
  .catalog-list {
    list-style: none;
    margin: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
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
    padding: 12px 16px max(20px, env(safe-area-inset-bottom));
  }
  .delete-all {
    padding: 10px 14px;
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
      padding-top: 8px;
    }
    .catalog-footer {
      padding-top: 8px;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
    }
  }
</style>
