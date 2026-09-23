<script>
  let { name, maxHp, removeLabel = 'Remove from encounter', onSave = () => {}, onCancel = () => {}, onRemove = () => {} } = $props()

  // Drafts are seeded once from the props: the panel edits a snapshot.
  // svelte-ignore state_referenced_locally
  let nameDraft = $state(name)
  // svelte-ignore state_referenced_locally
  let maxHpDraft = $state(maxHp)

  const isValid = $derived(nameDraft.trim() !== '' && Number(maxHpDraft) >= 1)

  function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) return
    onSave({ name: nameDraft.trim(), maxHp: Number(maxHpDraft) })
  }
</script>

<form class="edit-form" onsubmit={handleSubmit}>
  <label class="field name">
    <span>Name</span>
    <input type="text" autocomplete="off" bind:value={nameDraft} />
  </label>
  <label class="field">
    <span>Max HP</span>
    <input type="number" inputmode="numeric" min="1" bind:value={maxHpDraft} />
  </label>
  <div class="actions">
    <button type="button" class="remove" aria-label={removeLabel} onclick={() => onRemove()}>{removeLabel.split(' ')[0]}</button>
    <button type="button" class="cancel" onclick={() => onCancel()}>Cancel</button>
    <button type="submit" class="save" disabled={!isValid}>Save</button>
  </div>
</form>

<style>
  .edit-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    padding: 8px 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .field.name {
    flex: 1 1 10rem;
  }
  .field input {
    height: var(--control);
    padding: 0 10px;
    font: inherit;
    font-size: 1rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .field input[type='number'] {
    width: 5.5rem;
  }
  .actions {
    display: flex;
    flex: 1 1 100%;
    gap: 8px;
  }
  button {
    height: var(--control);
    padding: 0 12px;
    font-weight: 700;
    border-radius: 8px;
  }
  .remove {
    /* Destructive action sits apart, on the far left. */
    margin-right: auto;
    color: var(--enemy-border);
    background: transparent;
    border: 1px solid var(--enemy-border);
  }
  .cancel {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
  }
  .save {
    color: var(--bg);
    background: var(--accent);
    border: none;
  }
  .save:disabled {
    opacity: 0.4;
  }
</style>
