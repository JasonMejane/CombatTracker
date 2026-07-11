<script>
  let { current, max, temp = 0, variant = 'player' } = $props()

  const denom = $derived(Math.max(1, max, current + temp))
  const currentPercent = $derived(Math.round((current / denom) * 100))
  const tempPercent = $derived(Math.round((temp / denom) * 100))
</script>

<div class="hp-bar">
  <div class="hp-fill {variant}" style="width: {currentPercent}%"></div>
  {#if temp > 0}
    <div class="hp-temp" style="left: {currentPercent}%; width: {tempPercent}%"></div>
  {/if}
  <span class="hp-text">{current}/{max}{#if temp > 0}&nbsp;(+{temp}){/if}</span>
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
    transition: width 0.2s ease;
  }
  .hp-fill.player {
    background: var(--player-border);
  }
  .hp-fill.enemy {
    background: var(--enemy-border);
  }
  .hp-fill.down {
    background: var(--down);
  }
  .hp-temp {
    position: absolute;
    top: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      var(--accent),
      var(--accent) 4px,
      transparent 4px,
      transparent 8px
    );
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
</style>
