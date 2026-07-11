<script>
  import CreatureRow from './CreatureRow.svelte'
  import { sortByInitiative } from '../lib/creatures.js'

  let {
    creatures,
    activeCreatureId = null,
    onDamage = () => {},
    onHeal = () => {},
    onDeathSave = () => {},
    onRevive = () => {},
    onToggleCondition = () => {},
    onAddTemp = () => {},
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
          onDamage={(amount) => onDamage(creature.id, amount)}
          onHeal={(amount) => onHeal(creature.id, amount)}
          onDeathSave={(kind) => onDeathSave(creature.id, kind)}
          onRevive={() => onRevive(creature.id)}
          onToggleCondition={(key) => onToggleCondition(creature.id, key)}
          onAddTemp={(value) => onAddTemp(creature.id, value)}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .creature-list {
    list-style: none;
    margin: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--text-muted);
  }
</style>
