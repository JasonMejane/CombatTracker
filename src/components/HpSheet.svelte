<script>
  import HpBar from './HpBar.svelte'
  import { healthState } from '../lib/creatures.js'

  let { creature, onDamage = () => {}, onHeal = () => {}, onAddTemp = () => {}, onClose = () => {} } = $props()

  const MAX_DIGITS = 4
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  let entry = $state('')
  const amount = $derived(Number(entry))

  function press(digit) {
    if (entry.length < MAX_DIGITS) entry = `${entry}${digit}`.replace(/^0+/, '')
  }

  const backspace = () => (entry = entry.slice(0, -1))

  const KEY_ACTIONS = {
    Backspace: backspace,
    Escape: () => onClose(),
  }

  function onKey(event) {
    if (/^\d$/.test(event.key)) press(event.key)
    KEY_ACTIONS[event.key]?.()
  }

  function focusOnMount(node) {
    node.focus()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="backdrop" role="presentation" onclick={() => onClose()}></div>

<div class="sheet" role="dialog" aria-modal="true" aria-label="Adjust HP for {creature.name}" tabindex="-1" use:focusOnMount>
  <div class="head">
    <span class="name">{creature.name}</span>
    <button class="close" aria-label="Close" onclick={() => onClose()}>✕</button>
  </div>
  <div class="hp-line">
    <HpBar current={creature.currentHp} max={creature.maxHp} temp={creature.tempHp} variant={healthState(creature)} />
  </div>

  <output class="display" aria-label="Amount">{entry || '0'}</output>

  <div class="keypad">
    {#each digits as digit (digit)}
      <button class="key" onclick={() => press(digit)}>{digit}</button>
    {/each}
    <button class="key minor" aria-label="Clear" onclick={() => (entry = '')}>C</button>
    <button class="key" onclick={() => press('0')}>0</button>
    <button class="key minor" aria-label="Delete digit" onclick={backspace}>⌫</button>
  </div>

  <div class="actions">
    <button class="action damage" disabled={!amount} onclick={() => onDamage(amount)}>− Damage</button>
    <button class="action heal" disabled={!amount} onclick={() => onHeal(amount)}>+ Heal</button>
    <button class="action temp" disabled={!amount} onclick={() => onAddTemp(amount)}>Temp HP</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.55);
  }
  .sheet {
    position: fixed;
    left: 50%;
    bottom: 0;
    z-index: 21;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(100%, 420px);
    max-height: 100svh;
    overflow-y: auto;
    padding: 16px 16px max(16px, env(safe-area-inset-bottom));
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
    outline: none;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .close {
    width: var(--control);
    height: var(--control);
    padding: 0;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .hp-line {
    display: flex;
  }
  .display {
    padding: 6px 12px;
    font-size: 2rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .key {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .key.minor {
    font-size: 1.1rem;
    color: var(--text-muted);
  }
  .actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .action {
    height: 52px;
    font-weight: 800;
    border: none;
    border-radius: 10px;
  }
  .action:disabled {
    opacity: 0.4;
  }
  .damage {
    color: var(--text);
    background: var(--enemy-border);
  }
  .heal {
    color: var(--text);
    background: var(--player-border);
  }
  .temp {
    color: var(--bg);
    background: var(--accent);
  }

  /* Landscape phone: keypad and actions side by side so the sheet fits. */
  @media (orientation: landscape) and (max-height: 500px) {
    .sheet {
      width: min(100%, 640px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      padding-top: 10px;
    }
    .head,
    .hp-line {
      grid-column: 1 / -1;
    }
    .display {
      grid-column: 2;
      grid-row: 3;
      align-self: start;
    }
    .keypad {
      grid-column: 1;
      grid-row: 3 / span 2;
    }
    .actions {
      grid-column: 2;
      grid-row: 4;
      align-self: end;
    }
    .key,
    .action {
      height: 42px;
    }
  }
</style>
