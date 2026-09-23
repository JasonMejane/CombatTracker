<script>
  let { enabled = true, held = false, onToggle = () => {} } = $props()

  const title = $derived(
    !enabled
      ? 'Screen may sleep during combat — tap to keep it on'
      : held
        ? 'The screen is being kept on — tap to allow sleep'
        : 'Keeps the screen on during combat — tap to allow sleep',
  )
</script>

<button class="awake" class:held class:off={!enabled} aria-label="Keep screen on" aria-pressed={enabled} {title} onclick={() => onToggle()}>
  <span aria-hidden="true">☀</span>
</button>

<style>
  .awake {
    display: grid;
    place-items: center;
    width: var(--control);
    height: var(--control);
    padding: 0;
    font-size: 1.2rem;
    line-height: 1;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .awake.held {
    color: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 10px -3px var(--active-glow);
  }
  .awake.off {
    opacity: 0.45;
    text-decoration: line-through;
  }
</style>
