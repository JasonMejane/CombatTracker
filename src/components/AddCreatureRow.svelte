<script>
  import AddCreatureForm from './AddCreatureForm.svelte'

  let { onAdd = () => {}, showInitiative = true } = $props()

  let open = $state(false)

  function handleAdd(data) {
    onAdd(data)
    open = false
  }
</script>

<div class="add-creature-row">
  <button class="add-toggle" aria-expanded={open} onclick={() => (open = !open)}>
    <span class="plus">＋</span> Add creature
  </button>

  {#if open}
    <AddCreatureForm onAdd={handleAdd} {showInitiative} />
  {/if}
</div>

<style>
  .add-creature-row {
    display: flex;
    flex-direction: column;
  }
  .add-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    margin: 0 12px 12px;
    padding: 12px 16px;
    font-weight: 700;
    color: var(--accent);
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: 10px;
  }
  .add-toggle:hover {
    background: var(--surface);
  }
  .plus {
    font-size: 1.2rem;
    line-height: 1;
  }
</style>
