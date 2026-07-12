import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import SendToEncounterForm from './SendToEncounterForm.svelte'

vi.mock('../lib/dice.js', () => ({
  rollInitiative: (bonus) => 15 + Number(bonus),
}))

describe('SendToEncounterForm', () => {
  it('names the creature being sent', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin' })
    expect(screen.getByText(/goblin/i)).toBeInTheDocument()
  })

  it('defaults the initiative to 0', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin' })
    expect(screen.getByLabelText(/initiative/i)).toHaveValue(0)
  })

  it('sends the entered initiative as a number', async () => {
    const onSend = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', onSend })
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onSend).toHaveBeenCalledWith(14)
  })

  it('sends the default initiative when unchanged', async () => {
    const onSend = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', onSend })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onSend).toHaveBeenCalledWith(0)
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

describe('SendToEncounterForm for an NPC', () => {
  it('offers a bonus input and a roll button', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin', isPlayer: false })
    expect(screen.getByLabelText(/bonus/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roll/i })).toBeInTheDocument()
  })

  it('defaults the bonus to 0', () => {
    render(SendToEncounterForm, { creatureName: 'Goblin', isPlayer: false })
    expect(screen.getByLabelText(/bonus/i)).toHaveValue(0)
  })

  it('rolls the initiative from the die plus the bonus', async () => {
    render(SendToEncounterForm, { creatureName: 'Goblin', isPlayer: false })
    await fireEvent.input(screen.getByLabelText(/bonus/i), { target: { value: '3' } })
    await fireEvent.click(screen.getByRole('button', { name: /roll/i }))
    expect(screen.getByLabelText(/initiative/i)).toHaveValue(18)
  })

  it('sends the rolled initiative', async () => {
    const onSend = vi.fn()
    render(SendToEncounterForm, { creatureName: 'Goblin', isPlayer: false, onSend })
    await fireEvent.click(screen.getByRole('button', { name: /roll/i }))
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onSend).toHaveBeenCalledWith(15)
  })
})

describe('SendToEncounterForm for a player', () => {
  it('has no roll button or bonus input', () => {
    render(SendToEncounterForm, { creatureName: 'Aragorn', isPlayer: true })
    expect(screen.queryByRole('button', { name: /roll/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/bonus/i)).not.toBeInTheDocument()
  })
})
