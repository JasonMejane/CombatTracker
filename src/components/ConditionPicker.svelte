<script>
  import { CONDITIONS } from '../lib/conditions.js'

  let { active = [], onToggle = () => {} } = $props()
</script>

<div class="condition-picker" role="group" aria-label="Conditions">
  {#each CONDITIONS as condition (condition.key)}
    <button
      type="button"
      class="condition"
      class:active={active.includes(condition.key)}
      aria-pressed={active.includes(condition.key)}
      aria-label={condition.label}
      title={condition.label}
      onclick={() => onToggle(condition.key)}
    >
      <span class="emoji">{condition.emoji}</span>
      <span class="label">{condition.label}</span>
    </button>
  {/each}
</div>

<style>
  .condition-picker {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
    gap: 6px;
    padding: 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .condition {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    opacity: 0.5;
    filter: grayscale(0.6);
  }
  .emoji {
    font-size: 1.3rem;
    line-height: 1;
  }
  .label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-align: center;
  }
  .condition.active {
    opacity: 1;
    filter: none;
    border-color: var(--accent);
    background: var(--surface);
  }
  .condition.active .label {
    color: var(--text);
  }
</style>
