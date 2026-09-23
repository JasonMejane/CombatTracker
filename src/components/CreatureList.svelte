<script>
  import CreatureRow from './CreatureRow.svelte'
  import { sortByInitiative } from '../lib/creatures.js'

  let {
    creatures,
    activeCreatureId = null,
    onDeathSave = () => {},
    onRevive = () => {},
    onToggleCondition = () => {},
    onSetInitiative = () => {},
    onSetCa = () => {},
    onEdit = () => {},
    onRemove = () => {},
    onAdjustHp = () => {},
  } = $props()

  const ordered = $derived(sortByInitiative(creatures))
</script>

{#if ordered.length === 0}
  <p class="empty">No combatants yet — add one below.</p>
{:else}
  <ul class="creature-list">
    {#each ordered as creature (creature.id)}
      <li>
        <CreatureRow
          {creature}
          isActive={creature.id === activeCreatureId}
          onDeathSave={(kind) => onDeathSave(creature.id, kind)}
          onRevive={() => onRevive(creature.id)}
          onToggleCondition={(key) => onToggleCondition(creature.id, key)}
          onSetInitiative={(value) => onSetInitiative(creature.id, value)}
          onSetCa={(value) => onSetCa(creature.id, value)}
          onEdit={(changes) => onEdit(creature.id, changes)}
          onRemove={() => onRemove(creature.id)}
          onAdjustHp={() => onAdjustHp(creature.id)}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .creature-list {
    list-style: none;
    margin: 0;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--text-muted);
  }
</style>
