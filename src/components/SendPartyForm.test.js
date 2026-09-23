import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import SendPartyForm from './SendPartyForm.svelte'
import { createCatalogCreature } from '../lib/catalog.js'

const aria = createCatalogCreature({ name: 'Aria', hp: 20, isPlayer: true })
const thorin = createCatalogCreature({ name: 'Thorin', hp: 30, isPlayer: true })
const setup = (props = {}) => render(SendPartyForm, { players: [aria, thorin], ...props })
const initiativeFor = (name) => screen.getByLabelText(`Initiative for ${name}`)
const send = () => screen.getByRole('button', { name: /send party/i })

describe('SendPartyForm', () => {
  it('lists every player, selected, with an initiative field', () => {
    setup()
    expect(screen.getByRole('checkbox', { name: 'Aria' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Thorin' })).toBeChecked()
    expect(initiativeFor('Aria')).toHaveValue(null)
  })

  it('waits for every selected player to have an initiative', async () => {
    setup()
    expect(send()).toBeDisabled()
    await fireEvent.input(initiativeFor('Aria'), { target: { value: '15' } })
    expect(send()).toBeDisabled()
    await fireEvent.input(initiativeFor('Thorin'), { target: { value: '8' } })
    expect(send()).toBeEnabled()
  })

  it('sends each selected player with its initiative', async () => {
    const onSend = vi.fn()
    setup({ onSend })
    await fireEvent.input(initiativeFor('Aria'), { target: { value: '15' } })
    await fireEvent.input(initiativeFor('Thorin'), { target: { value: '8' } })
    await fireEvent.click(send())
    expect(onSend).toHaveBeenCalledWith([
      { id: aria.id, initiative: 15 },
      { id: thorin.id, initiative: 8 },
    ])
  })

  it('skips an unselected player', async () => {
    const onSend = vi.fn()
    setup({ onSend })
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Thorin' }))
    await fireEvent.input(initiativeFor('Aria'), { target: { value: '15' } })
    await fireEvent.click(send())
    expect(onSend).toHaveBeenCalledWith([{ id: aria.id, initiative: 15 }])
  })

  it('cannot send with nobody selected', async () => {
    setup()
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Aria' }))
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Thorin' }))
    expect(send()).toBeDisabled()
  })

  it('cancels', async () => {
    const onCancel = vi.fn()
    setup({ onCancel })
    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
