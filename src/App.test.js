import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import App from './App.svelte'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

async function addCombatant({ name, hp, initiative, enemy = false }) {
  await fireEvent.click(screen.getByRole('button', { name: /add creature/i }))
  await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: name } })
  await fireEvent.input(screen.getByLabelText('HP'), { target: { value: String(hp) } })
  await fireEvent.input(screen.getByLabelText(/initiative/i), {
    target: { value: String(initiative) },
  })
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

  it('re-sorts the order when a combatant initiative is edited', async () => {
    render(App)
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    const names = () => Array.from(document.querySelectorAll('.creature-row .name')).map((n) => n.textContent)
    expect(names()).toEqual(['Fast', 'Slow'])

    const slowRow = Array.from(document.querySelectorAll('.creature-row')).find((r) => r.querySelector('.name').textContent === 'Slow')
    await fireEvent.click(slowRow.querySelector('.initiative'))
    const input = slowRow.querySelector('.initiative-input')
    await fireEvent.input(input, { target: { value: '30' } })
    await fireEvent.blur(input)

    expect(names()).toEqual(['Slow', 'Fast'])
  })

  it('edits a combatant armor class', async () => {
    render(App)
    await addCombatant({ name: 'Knight', hp: 20, initiative: 9 })
    await fireEvent.click(screen.getByText('CA 10'))
    const input = document.querySelector('.creature-row .ca-input')
    await fireEvent.input(input, { target: { value: '16' } })
    await fireEvent.blur(input)
    expect(screen.getByText('CA 16')).toBeInTheDocument()
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
    expect(document.querySelector('.conditions-bar .cond-emoji')).toHaveTextContent('🤢')
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

async function addToCatalog({ name, hp, enemy = false }) {
  await fireEvent.click(screen.getByRole('button', { name: /add creature/i }))
  await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: name } })
  await fireEvent.input(screen.getByLabelText('HP'), { target: { value: String(hp) } })
  if (enemy) await fireEvent.click(screen.getByLabelText(/enemy/i))
  await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
}

function catalogNames() {
  return Array.from(document.querySelectorAll('.catalog-row .name')).map((n) => n.textContent)
}

describe('App catalog', () => {
  async function openCatalog() {
    await fireEvent.click(screen.getByRole('button', { name: /^catalog$/i }))
  }

  it('switches to the catalog view', async () => {
    render(App)
    await openCatalog()
    expect(screen.getByText(/catalog is empty/i)).toBeInTheDocument()
  })

  it('adds a creature to the catalog', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('removes a creature from the catalog once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(catalogNames()).toEqual([])
  })

  it('keeps the creature when the removal is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('sends a catalog creature into the encounter and returns to it', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    expect(document.querySelector('.creature-row .name')?.textContent).toBe('Goblin')
    expect(screen.getByText('7/7')).toBeInTheDocument()
  })

  async function sendCatalogCreature() {
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
  }

  it('appends an incremental index to duplicate enemy names', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })

    await sendCatalogCreature()
    await openCatalog()
    await sendCatalogCreature()

    const encounterNames = Array.from(document.querySelectorAll('.creature-row .name')).map((n) => n.textContent)
    expect(encounterNames.sort()).toEqual(['Goblin', 'Goblin 2'])
  })

  it('keeps the catalog copy after sending', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    await openCatalog()
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('edits a catalog creature armor class', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByText('CA 10'))
    const input = document.querySelector('.catalog-row .ca-input')
    await fireEvent.input(input, { target: { value: '15' } })
    await fireEvent.blur(input)
    expect(screen.getByText('CA 15')).toBeInTheDocument()
  })

  it('carries the catalog CA to the encounter without asking for it', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByText('CA 10'))
    const caInput = document.querySelector('.catalog-row .ca-input')
    await fireEvent.input(caInput, { target: { value: '15' } })
    await fireEvent.blur(caInput)

    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    const sendForm = document.querySelector('.send-form')
    expect(sendForm.querySelector('input[aria-label="CA"]')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    expect(screen.getByText('CA 15')).toBeInTheDocument()
  })

  it('deletes the whole catalog once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await addToCatalog({ name: 'Orc', hp: 10, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /delete all/i }))
    expect(catalogNames()).toEqual([])
    expect(screen.getByText(/catalog is empty/i)).toBeInTheDocument()
  })

  it('keeps the catalog when the deletion is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /delete all/i }))
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('restores the catalog from storage on reload', async () => {
    const first = render(App)
    await fireEvent.click(screen.getByRole('button', { name: /^catalog$/i }))
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    first.unmount()

    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /^catalog$/i }))
    expect(catalogNames()).toEqual(['Goblin'])
  })
})
