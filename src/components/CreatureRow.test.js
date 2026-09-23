import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import CreatureRow from './CreatureRow.svelte'
import { createCreature, damage, addDeathSave, toggleCondition, setTempHp } from '../lib/creatures.js'

const player = (over = {}) => createCreature({ name: 'Aragorn', hp: 20, initiative: 15, isPlayer: true, ...over })
const enemy = (over = {}) => createCreature({ name: 'Goblin', hp: 7, initiative: 12, isPlayer: false, ...over })

function row(container) {
  return container.querySelector('.creature-row')
}

describe('CreatureRow', () => {
  it('shows name, current/max HP and initiative', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.getByText('Aragorn')).toBeInTheDocument()
    expect(screen.getByText('20/20')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('marks a player row', () => {
    const { container } = render(CreatureRow, { creature: player() })
    expect(row(container)).toHaveClass('player')
    expect(row(container)).not.toHaveClass('enemy')
  })

  it('marks an enemy row', () => {
    const { container } = render(CreatureRow, { creature: enemy() })
    expect(row(container)).toHaveClass('enemy')
    expect(row(container)).not.toHaveClass('player')
  })

  it('highlights the active creature', () => {
    const { container } = render(CreatureRow, { creature: player(), isActive: true })
    expect(row(container)).toHaveClass('active')
  })

  it('marks the active creature as the current turn for assistive tech', () => {
    const { container } = render(CreatureRow, { creature: player(), isActive: true })
    expect(row(container)).toHaveAttribute('aria-current', 'true')
  })

  it('colours the HP bar by health', () => {
    const { container } = render(CreatureRow, { creature: damage(player(), 12) })
    expect(container.querySelector('.hp-fill')).toHaveClass('bloodied')
  })

  it('describes the death-save tally in words', () => {
    let c = damage(player(), 20)
    c = addDeathSave(addDeathSave(c, 'success'), 'failure')
    render(CreatureRow, { creature: c })
    expect(screen.getByRole('img', { name: '1 success, 1 failure' })).toBeInTheDocument()
  })

  it('does not highlight a non-active creature', () => {
    const { container } = render(CreatureRow, { creature: player(), isActive: false })
    expect(row(container)).not.toHaveClass('active')
  })

  it('greys out a downed enemy', () => {
    const { container } = render(CreatureRow, { creature: damage(enemy(), 7) })
    expect(row(container)).toHaveClass('down')
  })

  it('does not grey out a downed player', () => {
    const { container } = render(CreatureRow, { creature: damage(player(), 20) })
    expect(row(container)).not.toHaveClass('down')
  })

  it('shows death saves for a downed player', () => {
    render(CreatureRow, { creature: damage(player(), 20) })
    expect(screen.getByTestId('death-saves')).toBeInTheDocument()
  })

  it('hides death saves for a downed enemy', () => {
    render(CreatureRow, { creature: damage(enemy(), 7) })
    expect(screen.queryByTestId('death-saves')).not.toBeInTheDocument()
  })

  it('reflects the number of failed death saves', () => {
    let c = damage(player(), 20)
    c = addDeathSave(c, 'failure')
    c = addDeathSave(c, 'failure')
    const { container } = render(CreatureRow, { creature: c })
    expect(container.querySelectorAll('.pip.failure.filled')).toHaveLength(2)
  })

  it('labels a dead player', () => {
    let c = damage(player(), 20)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'failure')
    expect(screen.queryByText(/dead/i)).not.toBeInTheDocument()
    render(CreatureRow, { creature: c })
    expect(screen.getByText(/dead/i)).toBeInTheDocument()
  })

  it('labels a stable player', () => {
    let c = damage(player(), 20)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'success')
    render(CreatureRow, { creature: c })
    expect(screen.getByText(/stable/i)).toBeInTheDocument()
  })

  it('hides the death-save buttons once stable', () => {
    let c = damage(player(), 20)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'success')
    render(CreatureRow, { creature: c })
    expect(screen.queryByRole('button', { name: /success/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /failure/i })).not.toBeInTheDocument()
  })

  it('hides the death-save buttons once dead', () => {
    let c = damage(player(), 20)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'failure')
    render(CreatureRow, { creature: c })
    expect(screen.queryByRole('button', { name: /success/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /failure/i })).not.toBeInTheDocument()
  })
})

describe('CreatureRow interactions', () => {
  it('asks to adjust HP from the HP bar', async () => {
    const onAdjustHp = vi.fn()
    render(CreatureRow, { creature: player(), onAdjustHp })
    await fireEvent.click(screen.getByRole('button', { name: /adjust hp for aragorn/i }))
    expect(onAdjustHp).toHaveBeenCalled()
  })

  it('scrolls into view when its turn comes up', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const { rerender } = render(CreatureRow, { creature: player(), isActive: false })
    expect(scrollIntoView).not.toHaveBeenCalled()
    await rerender({ creature: player(), isActive: true })
    expect(scrollIntoView).toHaveBeenCalled()
    delete Element.prototype.scrollIntoView
  })

  it('records a death-save success for a downed player', async () => {
    const onDeathSave = vi.fn()
    render(CreatureRow, { creature: damage(player(), 20), onDeathSave })
    await fireEvent.click(screen.getByRole('button', { name: /success/i }))
    expect(onDeathSave).toHaveBeenCalledWith('success')
  })

  it('records a death-save failure for a downed player', async () => {
    const onDeathSave = vi.fn()
    render(CreatureRow, { creature: damage(player(), 20), onDeathSave })
    await fireEvent.click(screen.getByRole('button', { name: /failure/i }))
    expect(onDeathSave).toHaveBeenCalledWith('failure')
  })

  it('revives a downed enemy', async () => {
    const onRevive = vi.fn()
    render(CreatureRow, { creature: damage(enemy(), 7), onRevive })
    await fireEvent.click(screen.getByRole('button', { name: /revive/i }))
    expect(onRevive).toHaveBeenCalled()
  })

  it('has no revive button for a living creature', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.queryByRole('button', { name: /revive/i })).not.toBeInTheDocument()
  })

  it('shows temporary HP in the bar', () => {
    render(CreatureRow, { creature: setTempHp(player(), 5) })
    expect(screen.getByText('20/20 (+5)')).toBeInTheDocument()
  })

  it('has no death-save buttons for a living player', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.queryByRole('button', { name: /success/i })).not.toBeInTheDocument()
  })
})

describe('CreatureRow at 0 HP', () => {
  const dying = () => damage(player(), 20)
  const dead = () => addDeathSave(addDeathSave(dying(), 'nat1'), 'failure')

  it('lets a dying player be healed or hit', async () => {
    const onAdjustHp = vi.fn()
    render(CreatureRow, { creature: dying(), onAdjustHp })
    await fireEvent.click(screen.getByRole('button', { name: /adjust hp/i }))
    expect(onAdjustHp).toHaveBeenCalled()
  })

  it('records a natural 1', async () => {
    const onDeathSave = vi.fn()
    render(CreatureRow, { creature: dying(), onDeathSave })
    await fireEvent.click(screen.getByRole('button', { name: /natural 1$/i }))
    expect(onDeathSave).toHaveBeenCalledWith('nat1')
  })

  it('records a natural 20', async () => {
    const onDeathSave = vi.fn()
    render(CreatureRow, { creature: dying(), onDeathSave })
    await fireEvent.click(screen.getByRole('button', { name: /natural 20/i }))
    expect(onDeathSave).toHaveBeenCalledWith('nat20')
  })

  it('has no revive button while a player is dying', () => {
    render(CreatureRow, { creature: dying() })
    expect(screen.queryByRole('button', { name: /revive/i })).not.toBeInTheDocument()
  })

  it('lets a stable player adjust HP', () => {
    let c = dying()
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'success')
    render(CreatureRow, { creature: c })
    expect(screen.getByRole('button', { name: /adjust hp/i })).toBeInTheDocument()
  })

  it('offers only revive for a dead player', async () => {
    const onRevive = vi.fn()
    render(CreatureRow, { creature: dead(), onRevive })
    expect(screen.queryByRole('button', { name: /adjust hp/i })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /revive/i }))
    expect(onRevive).toHaveBeenCalled()
  })
})

describe('CreatureRow editing', () => {
  it('keeps the edit panel hidden until opened', () => {
    render(CreatureRow, { creature: enemy() })
    expect(screen.queryByLabelText(/max hp/i)).not.toBeInTheDocument()
  })

  it('opens the edit panel seeded with the creature', async () => {
    render(CreatureRow, { creature: enemy() })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    expect(screen.getByLabelText(/max hp/i)).toHaveValue(7)
  })

  it('saves edits and closes the panel', async () => {
    const onEdit = vi.fn()
    render(CreatureRow, { creature: enemy(), onEdit })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Goblin boss' } })
    await fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onEdit).toHaveBeenCalledWith({ name: 'Goblin boss', maxHp: 7 })
    expect(screen.queryByLabelText(/max hp/i)).not.toBeInTheDocument()
  })

  it('removes the creature from the edit panel', async () => {
    const onRemove = vi.fn()
    render(CreatureRow, { creature: enemy(), onRemove })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.click(screen.getByRole('button', { name: /remove from encounter/i }))
    expect(onRemove).toHaveBeenCalled()
  })
})

describe('CreatureRow initiative editing', () => {
  it('shows no initiative input until the value is clicked', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })

  it('reveals an input seeded with the current value when clicked', async () => {
    render(CreatureRow, { creature: player() })
    await fireEvent.click(screen.getByText('15'))
    expect(screen.getByLabelText(/initiative/i)).toHaveValue(15)
  })

  it('commits the new initiative on blur', async () => {
    const onSetInitiative = vi.fn()
    render(CreatureRow, { creature: player(), onSetInitiative })
    await fireEvent.click(screen.getByText('15'))
    const input = screen.getByLabelText(/initiative/i)
    await fireEvent.input(input, { target: { value: '9' } })
    await fireEvent.blur(input)
    expect(onSetInitiative).toHaveBeenCalledWith(9)
  })

  it('commits the new initiative on Enter', async () => {
    const onSetInitiative = vi.fn()
    render(CreatureRow, { creature: player(), onSetInitiative })
    await fireEvent.click(screen.getByText('15'))
    const input = screen.getByLabelText(/initiative/i)
    await fireEvent.input(input, { target: { value: '7' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetInitiative).toHaveBeenCalledWith(7)
  })

  it('returns to the plain value after committing', async () => {
    render(CreatureRow, { creature: player(), onSetInitiative: vi.fn() })
    await fireEvent.click(screen.getByText('15'))
    const input = screen.getByLabelText(/initiative/i)
    await fireEvent.input(input, { target: { value: '9' } })
    await fireEvent.blur(input)
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })
})

describe('CreatureRow armor class', () => {
  it('shows the armor class beside the name', () => {
    render(CreatureRow, { creature: player({ ca: 17 }) })
    expect(screen.getByText('AC 17')).toBeInTheDocument()
  })

  it('reveals an input seeded with the current AC when clicked', async () => {
    render(CreatureRow, { creature: player({ ca: 17 }) })
    await fireEvent.click(screen.getByText('AC 17'))
    expect(screen.getByLabelText('AC')).toHaveValue(17)
  })

  it('commits the new AC on blur', async () => {
    const onSetCa = vi.fn()
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa })
    await fireEvent.click(screen.getByText('AC 17'))
    const input = screen.getByLabelText('AC')
    await fireEvent.input(input, { target: { value: '14' } })
    await fireEvent.blur(input)
    expect(onSetCa).toHaveBeenCalledWith(14)
  })

  it('commits the new AC on Enter', async () => {
    const onSetCa = vi.fn()
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa })
    await fireEvent.click(screen.getByText('AC 17'))
    const input = screen.getByLabelText('AC')
    await fireEvent.input(input, { target: { value: '12' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetCa).toHaveBeenCalledWith(12)
  })

  it('returns to the plain value after committing', async () => {
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa: vi.fn() })
    await fireEvent.click(screen.getByText('AC 17'))
    const input = screen.getByLabelText('AC')
    await fireEvent.blur(input)
    expect(screen.queryByLabelText('AC')).not.toBeInTheDocument()
  })
})

describe('CreatureRow conditions', () => {
  it('shows an emoji for each active condition', () => {
    render(CreatureRow, { creature: toggleCondition(player(), 'poisoned') })
    expect(screen.getByText('🤢')).toBeInTheDocument()
  })

  it('names each active condition on its chip', () => {
    render(CreatureRow, { creature: toggleCondition(player(), 'poisoned') })
    expect(screen.getByRole('button', { name: /remove poisoned/i })).toHaveTextContent('Poisoned')
  })

  it('removes a condition by tapping its chip', async () => {
    const onToggleCondition = vi.fn()
    render(CreatureRow, { creature: toggleCondition(player(), 'poisoned'), onToggleCondition })
    await fireEvent.click(screen.getByRole('button', { name: /remove poisoned/i }))
    expect(onToggleCondition).toHaveBeenCalledWith('poisoned')
  })

  it('puts the add-condition button on the HP line to save a line', () => {
    const { container } = render(CreatureRow, { creature: player() })
    expect(container.querySelector('.status')).toContainElement(screen.getByRole('button', { name: /add condition/i }))
  })

  it('has no conditions line when there is nothing to show', () => {
    const { container } = render(CreatureRow, { creature: player() })
    expect(container.querySelector('.conditions-bar')).toBeNull()
  })

  it('keeps the add-condition button for a downed player', () => {
    render(CreatureRow, { creature: damage(player(), 20) })
    expect(screen.getByRole('button', { name: /add condition/i })).toBeInTheDocument()
  })

  it('keeps the condition picker hidden until opened', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.queryByRole('group', { name: /conditions/i })).not.toBeInTheDocument()
  })

  it('opens the condition picker from the add-condition button', async () => {
    render(CreatureRow, { creature: player() })
    await fireEvent.click(screen.getByRole('button', { name: /condition/i }))
    expect(screen.getByRole('group', { name: /conditions/i })).toBeInTheDocument()
  })

  it('toggles a condition through the picker', async () => {
    const onToggleCondition = vi.fn()
    render(CreatureRow, { creature: player(), onToggleCondition })
    await fireEvent.click(screen.getByRole('button', { name: /condition/i }))
    await fireEvent.click(screen.getByRole('button', { name: /poisoned/i }))
    expect(onToggleCondition).toHaveBeenCalledWith('poisoned')
  })
})
