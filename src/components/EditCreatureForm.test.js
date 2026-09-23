import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import EditCreatureForm from './EditCreatureForm.svelte'

const setup = (props = {}) => render(EditCreatureForm, { name: 'Goblin', maxHp: 7, ...props })

describe('EditCreatureForm', () => {
  it('is seeded with the current name and max HP', () => {
    setup()
    expect(screen.getByLabelText(/name/i)).toHaveValue('Goblin')
    expect(screen.getByLabelText(/max hp/i)).toHaveValue(7)
  })

  it('saves the edited name and max HP', async () => {
    const onSave = vi.fn()
    setup({ onSave })
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Goblin boss' } })
    await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: '21' } })
    await fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Goblin boss', maxHp: 21 })
  })

  it('disables saving with a blank name', async () => {
    setup()
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: '  ' } })
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('disables saving with a max HP below 1', async () => {
    setup()
    await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: '0' } })
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('cancels without saving', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    setup({ onSave, onCancel })
    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('names the remove action after its list', () => {
    setup({ removeLabel: 'Delete from catalog' })
    expect(screen.getByRole('button', { name: /delete from catalog/i })).toBeInTheDocument()
  })

  it('removes the creature from the encounter', async () => {
    const onRemove = vi.fn()
    setup({ onRemove })
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    expect(onRemove).toHaveBeenCalled()
  })
})
