import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import App from './App.svelte'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

async function addCombatant({ name, hp, initiative, enemy = false }) {
  await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: name } })
  await fireEvent.input(screen.getByLabelText('HP'), { target: { value: String(hp) } })
  await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: String(initiative) } })
  if (enemy) await fireEvent.click(screen.getByLabelText(/enemy/i))
  await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
}

function activeName() {
  return document.querySelector('.creature-row.active .name')?.textContent
}

describe('App', () => {
  it('renders the title', () => {
    render(App)
    expect(screen.getByRole('heading', { name: 'Combat Tracker' })).toBeInTheDocument()
  })

  it('adds a combatant to the list', async () => {
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    expect(screen.getByText('Gimli')).toBeInTheDocument()
    expect(screen.getByText('30/30')).toBeInTheDocument()
  })

  it('advances the active combatant by initiative order', async () => {
    render(App)
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    expect(activeName()).toBe('Fast')
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    expect(activeName()).toBe('Slow')
  })

  it('applies damage to a combatant', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '3' } })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(screen.getByText('7/10')).toBeInTheDocument()
  })

  it('revives a downed combatant at 1 HP', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 5, initiative: 8, enemy: true })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '5' } })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(screen.getByText('0/5')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /revive/i }))
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('accumulates temporary HP and absorbs the next hit', async () => {
    render(App)
    await addCombatant({ name: 'Barbarian', hp: 20, initiative: 12 })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '4' } })
    await fireEvent.click(screen.getByRole('button', { name: /add temp hp/i }))
    await fireEvent.click(screen.getByRole('button', { name: /add temp hp/i }))
    expect(screen.getByText('20/20 (+8)')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(screen.getByText('20/20 (+4)')).toBeInTheDocument()
  })

  it('toggles a condition onto a combatant', async () => {
    render(App)
    await addCombatant({ name: 'Aragorn', hp: 24, initiative: 18 })
    await fireEvent.click(screen.getByRole('button', { name: /add condition/i }))
    await fireEvent.click(screen.getByRole('button', { name: /poisoned/i }))
    expect(document.querySelector('.name-group .cond-emoji')).toHaveTextContent('🤢')
  })

  it('clears all combatants for a fresh encounter once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    expect(screen.queryByText('Gimli')).not.toBeInTheDocument()
    expect(screen.getByText(/no combatants/i)).toBeInTheDocument()
  })

  it('keeps combatants when the clear is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    expect(screen.getByText('Gimli')).toBeInTheDocument()
  })

  it('restores combatants from storage on reload', async () => {
    const first = render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    first.unmount()

    render(App)
    expect(screen.getByText('Gimli')).toBeInTheDocument()
    expect(screen.getByText('30/30')).toBeInTheDocument()
  })
})
