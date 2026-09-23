<script>
  import { untrack } from 'svelte'

  let { current, max, temp = 0, variant = 'healthy' } = $props()

  const NOTED_STATES = new Set(['bloodied', 'critical'])

  const denom = $derived(Math.max(1, max, current + temp))
  const currentPercent = $derived(Math.round((current / denom) * 100))
  const tempPercent = $derived(Math.round((temp / denom) * 100))
  const valueText = $derived(
    [`${current} of ${max} HP`, temp > 0 && `${temp} temporary`, NOTED_STATES.has(variant) && variant].filter(Boolean).join(', '),
  )

  // Floats the change in effective HP (current + temp) each time it moves.
  let flash = $state(null)
  let flashId = 0
  let lastTotal = untrack(() => current + temp)

  $effect(() => {
    const total = current + temp
    if (total !== lastTotal) flash = { delta: total - lastTotal, id: ++flashId }
    lastTotal = total
  })
</script>

<div class="hp-bar" role="meter" aria-valuenow={current} aria-valuemin={0} aria-valuemax={max} aria-valuetext={valueText}>
  <div class="hp-fill {variant}" style="width: {currentPercent}%"></div>
  {#if temp > 0}
    <div class="hp-temp" style="left: {currentPercent}%; width: {tempPercent}%"></div>
  {/if}
  <span class="hp-text"
    >{current}/{max}{#if temp > 0}&nbsp;(+{temp}){/if}</span
  >
  {#if flash}
    {#key flash.id}
      <span class="hp-delta" class:gain={flash.delta > 0}>{flash.delta > 0 ? '+' : '−'}{Math.abs(flash.delta)}</span>
    {/key}
  {/if}
</div>

<style>
  .hp-bar {
    position: relative;
    flex: 1;
    min-width: 80px;
    height: 22px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .hp-fill {
    position: absolute;
    inset: 0 auto 0 0;
    transition:
      width 0.2s ease,
      background-color 0.2s ease;
  }
  .hp-fill.healthy {
    background: var(--hp-healthy);
  }
  .hp-fill.bloodied {
    background: var(--hp-bloodied);
  }
  .hp-fill.critical {
    background: var(--hp-critical);
  }
  .hp-fill.down {
    background: var(--down);
  }
  .hp-temp {
    position: absolute;
    top: 0;
    bottom: 0;
    background: repeating-linear-gradient(45deg, var(--accent), var(--accent) 4px, transparent 4px, transparent 8px);
    background-color: rgba(201, 162, 39, 0.35);
  }
  .hp-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }
  .hp-delta {
    position: absolute;
    top: 0;
    right: 6px;
    bottom: 0;
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 800;
    color: #ff8a80;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    animation: hp-delta 1.6s ease-out forwards;
  }
  .hp-delta.gain {
    color: #a5e3b4;
  }
  @keyframes hp-delta {
    0% {
      opacity: 0;
      transform: scale(1.6);
    }
    15% {
      opacity: 1;
      transform: scale(1);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes hp-delta-fade {
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hp-delta {
      animation-name: hp-delta-fade;
    }
  }
</style>
