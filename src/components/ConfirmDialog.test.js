import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog.svelte'

const setup = (props = {}) =>
  render(ConfirmDialog, { title: 'New encounter?', message: 'All combatants will be cleared.', confirmLabel: 'Clear', ...props })

describe('ConfirmDialog', () => {
  it('is a modal alert dialog named by its title', () => {
    setup()
    const dialog = screen.getByRole('alertdialog', { name: 'New encounter?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('All combatants will be cleared.')
  })

  it('confirms', async () => {
    const onConfirm = vi.fn()
    setup({ onConfirm })
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('cancels from the cancel button', async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    setup({ onCancel, onConfirm })
    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancels on Escape', async () => {
    const onCancel = vi.fn()
    setup({ onCancel })
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })

  it('puts focus on the safe choice', () => {
    setup()
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus()
  })
})
