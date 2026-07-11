<script>
  import { isDown, deathState } from '../lib/creatures.js'
  import { conditionEmoji, conditionLabel } from '../lib/conditions.js'
  import HpBar from './HpBar.svelte'
  import ConditionPicker from './ConditionPicker.svelte'

  let {
    creature,
    isActive = false,
    onDamage = () => {},
    onHeal = () => {},
    onDeathSave = () => {},
    onRevive = () => {},
    onToggleCondition = () => {},
    onAddTemp = () => {},
  } = $props()

  let amount = $state(1)
  let showConditions = $state(false)

  const state = $derived(deathState(creature))
  const downed = $derived(isDown(creature))
  const greyed = $derived(downed && !creature.isPlayer)
  const showDeathSaves = $derived(downed && creature.isPlayer)
  const hpVariant = $derived(greyed ? 'down' : creature.isPlayer ? 'player' : 'enemy')

  const pips = [1, 2, 3]

  function applyAmount(apply) {
    apply(Number(amount) || 0)
  }
</script>

<div class="row-wrap">
<div
  class="creature-row"
  class:player={creature.isPlayer}
  class:enemy={!creature.isPlayer}
  class:active={isActive}
  class:down={greyed}
>
  <span class="initiative">{creature.initiative}</span>
  <div class="name-group">
    <span class="name">{creature.name}</span>
    {#each creature.conditions as key (key)}
      <span class="cond-emoji" title={conditionLabel(key)}>{conditionEmoji(key)}</span>
    {/each}
    <button
      class="cond-toggle"
      aria-label="Add condition"
      aria-expanded={showConditions}
      onclick={() => (showConditions = !showConditions)}>+</button
    >
  </div>

  {#if showDeathSaves}
    <div class="death-saves" data-testid="death-saves">
      {#if state === 'dead'}
        <span class="death-label">Dead</span>
      {:else if state === 'stable'}
        <span class="death-label">Stable</span>
      {/if}
      <div class="pips successes">
        {#each pips as n}
          <span class="pip success" class:filled={creature.deathSaves.successes >= n}></span>
        {/each}
      </div>
      <div class="pips failures">
        {#each pips as n}
          <span class="pip failure" class:filled={creature.deathSaves.failures >= n}></span>
        {/each}
      </div>
    </div>
  {:else}
    <HpBar current={creature.currentHp} max={creature.maxHp} temp={creature.tempHp} variant={hpVariant} />
  {/if}

  <div class="controls">
    {#if showDeathSaves}
      <button class="save-btn success" aria-label="Add success" onclick={() => onDeathSave('success')}>✓</button>
      <button class="save-btn failure" aria-label="Add failure" onclick={() => onDeathSave('failure')}>✗</button>
    {:else}
      <input class="amount" type="number" min="1" aria-label="Amount" bind:value={amount} />
      <button class="hp-btn damage" aria-label="Damage" onclick={() => applyAmount(onDamage)}>−</button>
      <button class="hp-btn heal" aria-label="Heal" onclick={() => applyAmount(onHeal)}>+</button>
      <button class="hp-btn temp" aria-label="Add temp HP" title="Add temporary HP" onclick={() => applyAmount(onAddTemp)}>🛡</button>
    {/if}
    {#if downed}
      <button class="revive-btn" aria-label="Revive" onclick={onRevive}>Revive</button>
    {/if}
  </div>
</div>

{#if showConditions}
  <ConditionPicker active={creature.conditions} onToggle={onToggleCondition} />
{/if}
</div>

<style>
  .row-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .creature-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .player {
    background: var(--player);
    border-color: var(--player-border);
  }
  .enemy {
    background: var(--enemy);
    border-color: var(--enemy-border);
  }
  .active {
    outline: 2px solid var(--active-glow);
    box-shadow: 0 0 12px -2px var(--active-glow);
  }
  .down {
    background: var(--down);
    border-color: var(--border);
    opacity: 0.6;
    filter: grayscale(0.8);
  }
  .initiative {
    min-width: 2ch;
    text-align: center;
    font-weight: 700;
    color: var(--accent);
  }
  .name-group {
    flex: 0 1 auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }
  .name {
    font-weight: 600;
  }
  .cond-emoji {
    font-size: 1rem;
    line-height: 1;
  }
  .cond-toggle {
    width: 24px;
    height: 24px;
    font-size: 1rem;
    line-height: 1;
    color: var(--text-muted);
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: 6px;
  }
  .death-saves {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .death-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }
  .pips {
    display: flex;
    gap: 3px;
  }
  .pip {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--text-muted);
  }
  .pip.success.filled {
    background: var(--player-border);
    border-color: var(--player-border);
  }
  .pip.failure.filled {
    background: var(--enemy-border);
    border-color: var(--enemy-border);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .amount {
    width: 4ch;
    padding: 8px 6px;
    font: inherit;
    text-align: center;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .hp-btn,
  .save-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .hp-btn.heal,
  .save-btn.success {
    color: var(--player-border);
  }
  .hp-btn.damage,
  .save-btn.failure {
    color: var(--enemy-border);
  }
  .hp-btn.temp {
    color: var(--accent);
  }
  .revive-btn {
    padding: 8px 12px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent);
    border: none;
    border-radius: 8px;
  }
</style>
