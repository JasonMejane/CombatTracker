import { render, screen, fireEvent, within } from '@testing-library/svelte'
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

async function adjustHp(name, amount, action) {
  await fireEvent.click(screen.getByRole('button', { name: new RegExp(`adjust hp for ${name}$`, 'i') }))
  const sheet = within(screen.getByRole('dialog'))
  for (const digit of String(amount)) await fireEvent.click(sheet.getByRole('button', { name: digit }))
  await fireEvent.click(sheet.getByRole('button', { name: action }))
}

const answerDialog = (label) => fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: label }))

function activeName() {
  return document.querySelector('.creature-row.active .name')?.textContent
}

describe('App', () => {
  it('renders the title', () => {
    render(App)
    expect(screen.getByRole('heading', { name: 'Combat Tracker' })).toBeInTheDocument()
  })

  it('exposes the two pages as tabs', async () => {
    render(App)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^encounter/i })).toHaveAttribute('aria-selected', 'true')
    await fireEvent.click(screen.getByRole('tab', { name: /^catalog$/i }))
    expect(screen.getByRole('tab', { name: /^catalog$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: /^catalog$/i })).toBeInTheDocument()
  })

  it('puts New encounter in the header, left of the screen toggle', async () => {
    Object.defineProperty(navigator, 'wakeLock', { value: { request: vi.fn(async () => ({})) }, configurable: true })
    try {
      render(App)
      const header = document.querySelector('header')
      const newEncounter = screen.getByRole('button', { name: /new encounter/i })
      const awake = screen.getByRole('button', { name: /keep screen on/i })
      expect(header).toContainElement(newEncounter)
      expect(newEncounter.compareDocumentPosition(awake) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    } finally {
      delete navigator.wakeLock
    }
  })

  it('spells out New encounter where there is room', () => {
    render(App)
    expect(screen.getByRole('button', { name: /new encounter/i }).textContent.trim()).toBe('New encounter')
  })

  it('shows New encounter only on the encounter page', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('tab', { name: /^catalog$/i }))
    expect(screen.queryByRole('button', { name: /new encounter/i })).not.toBeInTheDocument()
  })

  it('moves between tabs with the arrow keys', async () => {
    render(App)
    await fireEvent.keyDown(screen.getByRole('tab', { name: /^encounter/i }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: /^catalog$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /^catalog$/i })).toHaveFocus()
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
    await fireEvent.click(screen.getByText('AC 10'))
    const input = document.querySelector('.creature-row .ca-input')
    await fireEvent.input(input, { target: { value: '16' } })
    await fireEvent.blur(input)
    expect(screen.getByText('AC 16')).toBeInTheDocument()
  })

  it('applies damage to a combatant', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await adjustHp('Orc', 3, /damage/i)
    expect(screen.getByText('7/10')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('revives a downed combatant at 1 HP', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 5, initiative: 8, enemy: true })
    await adjustHp('Orc', 5, /damage/i)
    expect(screen.getByText('0/5')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /revive/i }))
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('accumulates temporary HP and absorbs the next hit', async () => {
    render(App)
    await addCombatant({ name: 'Barbarian', hp: 20, initiative: 12 })
    await adjustHp('Barbarian', 4, /temp hp/i)
    await adjustHp('Barbarian', 4, /temp hp/i)
    expect(screen.getByText('20/20 (+8)')).toBeInTheDocument()

    await adjustHp('Barbarian', 4, /damage/i)
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
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    await answerDialog(/clear encounter/i)
    expect(screen.queryByText('Gimli')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText(/no combatants/i)).toBeInTheDocument()
  })

  it('keeps combatants when the clear is cancelled', async () => {
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    await answerDialog(/cancel/i)
    expect(screen.getByText('Gimli')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  function names() {
    return Array.from(document.querySelectorAll('.creature-row .name')).map((n) => n.textContent)
  }

  const damageNamed = (name, amount) => adjustHp(name, amount, /damage/i)

  it('removes a single combatant straight away', async () => {
    render(App)
    await addCombatant({ name: 'Gimli', hp: 30, initiative: 9 })
    await addCombatant({ name: 'Orc', hp: 10, initiative: 5, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit orc/i }))
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    expect(names()).toEqual(['Gimli'])
  })

  it('relies on undo rather than a confirmation to remove a combatant', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm')
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 5, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit orc/i }))
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Orc removed')
    await fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: /^undo$/i }))
    expect(names()).toEqual(['Orc'])
  })

  it('passes the turn on when the active combatant is removed', async () => {
    render(App)
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /edit fast/i }))
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    expect(activeName()).toBe('Slow')
  })

  it('renames a combatant and changes its max HP', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 5, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit orc/i }))
    await fireEvent.input(screen.getByLabelText(/^name$/i), { target: { value: 'Orc chief' } })
    await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: '25' } })
    await fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(names()).toEqual(['Orc chief'])
    expect(screen.getByText('10/25')).toBeInTheDocument()
  })

  it('skips downed enemies when advancing the turn', async () => {
    render(App)
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await addCombatant({ name: 'Orc', hp: 5, initiative: 10, enemy: true })
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    await damageNamed('Orc', 5)
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    expect(activeName()).toBe('Slow')
  })

  it('heals a dying player straight back into the fight', async () => {
    render(App)
    await addCombatant({ name: 'Aria', hp: 10, initiative: 12 })
    await damageNamed('Aria', 10)
    await fireEvent.click(screen.getByRole('button', { name: /add failure/i }))
    await adjustHp('Aria', 4, /heal/i)
    expect(screen.getByText('4/10')).toBeInTheDocument()
    expect(screen.queryByTestId('death-saves')).not.toBeInTheDocument()
  })

  it('adds a failed death save when a dying player is hit', async () => {
    render(App)
    await addCombatant({ name: 'Aria', hp: 10, initiative: 12 })
    await damageNamed('Aria', 10)
    await damageNamed('Aria', 3)
    expect(document.querySelectorAll('.pip.failure.filled')).toHaveLength(1)
  })

  it('shows what changed with an undo button', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await adjustHp('Orc', 3, /damage/i)
    expect(screen.getByRole('status')).toHaveTextContent('Orc −3 HP')
    await fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: /^undo$/i }))
    expect(screen.getByText('10/10')).toBeInTheDocument()
  })

  it('hides the change message after a few seconds', async () => {
    vi.useFakeTimers()
    try {
      render(App)
      await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
      await adjustHp('Orc', 3, /damage/i)
      await vi.advanceTimersByTimeAsync(6000)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('undoes changes one at a time from the turn bar', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await adjustHp('Orc', 3, /damage/i)
    await adjustHp('Orc', 2, /damage/i)
    await fireEvent.click(screen.getByRole('button', { name: /undo last change/i }))
    expect(screen.getByText('7/10')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /undo last change/i }))
    expect(screen.getByText('10/10')).toBeInTheDocument()
  })

  it('undoes a turn change', async () => {
    render(App)
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /undo last change/i }))
    expect(activeName()).toBe('Fast')
  })

  it('brings back a removed combatant on undo', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit orc/i }))
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    await fireEvent.click(screen.getByRole('button', { name: /undo last change/i }))
    expect(names()).toEqual(['Orc'])
  })

  it('counts rounds as the turn wraps around', async () => {
    render(App)
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    const next = () => fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await next()
    expect(screen.getByText('Round 1')).toBeInTheDocument()
    expect(screen.getByText("Fast's turn")).toBeInTheDocument()
    await next()
    await next()
    expect(screen.getByText('Round 2')).toBeInTheDocument()
    expect(activeName()).toBe('Fast')
  })

  it('steps back to the previous turn and round', async () => {
    render(App)
    await addCombatant({ name: 'Fast', hp: 10, initiative: 20 })
    await addCombatant({ name: 'Slow', hp: 10, initiative: 5 })
    for (let i = 0; i < 3; i++) await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /previous turn/i }))
    expect(screen.getByText('Round 1')).toBeInTheDocument()
    expect(activeName()).toBe('Slow')
  })

  it('resets the round for a new encounter', async () => {
    render(App)
    await addCombatant({ name: 'Solo', hp: 10, initiative: 20 })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    expect(screen.getByText('Round 2')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    await answerDialog(/clear encounter/i)
    expect(screen.getByText('Round 1')).toBeInTheDocument()
  })

  it('closes the HP sheet without changing anything', async () => {
    render(App)
    await addCombatant({ name: 'Orc', hp: 10, initiative: 8, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /adjust hp for orc/i }))
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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
    await fireEvent.click(screen.getByRole('tab', { name: /^catalog$/i }))
  }

  async function openEncounter() {
    await fireEvent.click(screen.getByRole('tab', { name: /^encounter/i }))
  }

  const encounterNames = () => Array.from(document.querySelectorAll('.creature-row .name')).map((n) => n.textContent)

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
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.click(screen.getByRole('button', { name: /delete from catalog/i }))
    expect(screen.getByRole('alertdialog', { name: /delete goblin/i })).toBeInTheDocument()
    await answerDialog(/^delete$/i)
    expect(catalogNames()).toEqual([])
  })

  it('keeps the creature when the removal is cancelled', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.click(screen.getByRole('button', { name: /delete from catalog/i }))
    await answerDialog(/cancel/i)
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('sends a catalog creature into the encounter and stays on the catalog', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    expect(catalogNames()).toEqual(['Goblin'])
    expect(screen.getByRole('status')).toHaveTextContent('Goblin sent to encounter')
    await openEncounter()
    expect(encounterNames()).toEqual(['Goblin'])
    expect(screen.getByText('7/7')).toBeInTheDocument()
  })

  it('counts the combatants on the encounter tab', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await sendCatalogCreature()
    expect(screen.getByRole('tab', { name: /^encounter/i })).toHaveTextContent('1')
  })

  it('sends several copies of an enemy at once', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.input(screen.getByLabelText(/count/i), { target: { value: '3' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(screen.getByRole('status')).toHaveTextContent('Goblin ×3 sent to encounter')
    await openEncounter()
    expect(encounterNames().sort()).toEqual(['Goblin', 'Goblin 2', 'Goblin 3'])
  })

  it('undoes a send from the catalog', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await sendCatalogCreature()
    await fireEvent.click(screen.getByRole('button', { name: /^undo$/i }))
    await openEncounter()
    expect(encounterNames()).toEqual([])
  })

  it('sends the whole party with their initiatives', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Aria', hp: 20 })
    await addToCatalog({ name: 'Thorin', hp: 30 })
    await fireEvent.click(screen.getByRole('button', { name: /send party/i }))
    await fireEvent.input(screen.getByLabelText('Initiative for Aria'), { target: { value: '17' } })
    await fireEvent.input(screen.getByLabelText('Initiative for Thorin'), { target: { value: '9' } })
    await fireEvent.click(screen.getAllByRole('button', { name: /send party/i }).at(-1))
    expect(screen.queryByRole('button', { name: /send party/i })).not.toBeInTheDocument()
    await openEncounter()
    expect(encounterNames()).toEqual(['Aria', 'Thorin'])
  })

  it('renames a catalog creature and changes its HP', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.input(screen.getByLabelText(/^name$/i), { target: { value: 'Hobgoblin' } })
    await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: '11' } })
    await fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(catalogNames()).toEqual(['Hobgoblin'])
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('also saves an encounter creature to the catalog when asked', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /add creature/i }))
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Ogre' } })
    await fireEvent.input(screen.getByLabelText('HP'), { target: { value: '59' } })
    await fireEvent.input(screen.getByLabelText(/^initiative$/i), { target: { value: '8' } })
    await fireEvent.click(screen.getByLabelText(/enemy/i))
    await fireEvent.click(screen.getByLabelText(/save to catalog/i))
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(encounterNames()).toEqual(['Ogre'])
    await openCatalog()
    expect(catalogNames()).toEqual(['Ogre'])
    expect(screen.getByText('59')).toBeInTheDocument()
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
    await sendCatalogCreature()

    await openEncounter()
    expect(encounterNames().sort()).toEqual(['Goblin', 'Goblin 2'])
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
    await fireEvent.click(screen.getByText('AC 10'))
    const input = document.querySelector('.catalog-row .ca-input')
    await fireEvent.input(input, { target: { value: '15' } })
    await fireEvent.blur(input)
    expect(screen.getByText('AC 15')).toBeInTheDocument()
  })

  it('carries the catalog AC to the encounter without asking for it', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByText('AC 10'))
    const caInput = document.querySelector('.catalog-row .ca-input')
    await fireEvent.input(caInput, { target: { value: '15' } })
    await fireEvent.blur(caInput)

    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    const sendForm = document.querySelector('.send-form')
    expect(sendForm.querySelector('input[aria-label="AC"]')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    await openEncounter()
    expect(screen.getByText('AC 15')).toBeInTheDocument()
  })

  it('deletes the whole catalog once confirmed', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await addToCatalog({ name: 'Orc', hp: 10, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /delete all/i }))
    await answerDialog(/delete all/i)
    expect(catalogNames()).toEqual([])
    expect(screen.getByText(/catalog is empty/i)).toBeInTheDocument()
  })

  it('keeps the catalog when the deletion is cancelled', async () => {
    render(App)
    await openCatalog()
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    await fireEvent.click(screen.getByRole('button', { name: /delete all/i }))
    await answerDialog(/cancel/i)
    expect(catalogNames()).toEqual(['Goblin'])
  })

  it('restores the catalog from storage on reload', async () => {
    const first = render(App)
    await fireEvent.click(screen.getByRole('tab', { name: /^catalog$/i }))
    await addToCatalog({ name: 'Goblin', hp: 7, enemy: true })
    first.unmount()

    render(App)
    await fireEvent.click(screen.getByRole('tab', { name: /^catalog$/i }))
    expect(catalogNames()).toEqual(['Goblin'])
  })
})

describe('App screen wake lock', () => {
  let request
  let sentinel

  beforeEach(() => {
    sentinel = { release: vi.fn(async () => {}), addEventListener: vi.fn() }
    request = vi.fn(async () => sentinel)
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  })

  afterEach(() => {
    delete navigator.wakeLock
  })

  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

  async function startCombat() {
    await addCombatant({ name: 'Aria', hp: 20, initiative: 15 })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await settle()
  }

  it('keeps the screen on once combat starts', async () => {
    render(App)
    await addCombatant({ name: 'Aria', hp: 20, initiative: 15 })
    await settle()
    expect(request).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    await settle()
    expect(request).toHaveBeenCalledWith('screen')
  })

  it('lets the screen sleep again after a new encounter', async () => {
    render(App)
    await startCombat()
    await fireEvent.click(screen.getByRole('button', { name: /new encounter/i }))
    await answerDialog(/clear encounter/i)
    await settle()
    expect(sentinel.release).toHaveBeenCalled()
  })

  it('can be switched off, and remembers it', async () => {
    const first = render(App)
    await startCombat()
    await fireEvent.click(screen.getByRole('button', { name: /keep screen on/i }))
    await settle()
    expect(sentinel.release).toHaveBeenCalled()
    first.unmount()

    request.mockClear()
    render(App)
    await settle()
    expect(screen.getByRole('button', { name: /keep screen on/i })).toHaveAttribute('aria-pressed', 'false')
    expect(request).not.toHaveBeenCalled()
  })

  it('shows no toggle where the browser cannot keep the screen on', () => {
    delete navigator.wakeLock
    render(App)
    expect(screen.queryByRole('button', { name: /keep screen on/i })).not.toBeInTheDocument()
  })
})
