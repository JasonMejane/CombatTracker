import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import SendToEncounterForm from './SendToEncounterForm.svelte'

describe('SendToEncounterForm', () => {
  it('names the creature being sent', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin' })
    expect(screen.getByText(/goblin/i)).toBeInTheDocument()
  })

  it('defaults the initiative to 1', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin' })
    expect(screen.getByLabelText(/initiative/i)).toHaveValue(1)
  })

  it('sends the entered initiative as a number', async () => {
    const onSend = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', onSend })
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onSend).toHaveBeenCalledWith(14)
  })

  it('sends the default initiative when unchanged', async () => {
    const onSend = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', onSend })
    await fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onSend).toHaveBeenCalledWith(1)
  })

  it('cancels without sending', async () => {
    const onSend = vi.fn()
    const onCancel = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', onSend, onCancel })
    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
    expect(onSend).not.toHaveBeenCalled()
  })
})
