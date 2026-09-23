import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import Toast from './Toast.svelte'

describe('Toast', () => {
  it('announces the message', () => {
    render(Toast, { message: 'Orc −7 HP' })
    expect(screen.getByRole('status')).toHaveTextContent('Orc −7 HP')
  })

  it('offers to undo', async () => {
    const onUndo = vi.fn()
    render(Toast, { message: 'Orc −7 HP', onUndo })
    await fireEvent.click(screen.getByRole('button', { name: /^undo$/i }))
    expect(onUndo).toHaveBeenCalled()
  })

  it('hides the undo button when the change cannot be undone', () => {
    render(Toast, { message: 'Undone', undoable: false })
    expect(screen.queryByRole('button', { name: /^undo$/i })).not.toBeInTheDocument()
  })
})
