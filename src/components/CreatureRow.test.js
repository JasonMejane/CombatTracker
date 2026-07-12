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
  it('applies the entered amount as damage', async () => {
    const onDamage = vi.fn()
    render(CreatureRow, { creature: player(), onDamage })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '8' } })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(onDamage).toHaveBeenCalledWith(8)
  })

  it('applies the entered amount as healing', async () => {
    const onHeal = vi.fn()
    render(CreatureRow, { creature: player(), onHeal })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '5' } })
    await fireEvent.click(screen.getByRole('button', { name: /heal/i }))
    expect(onHeal).toHaveBeenCalledWith(5)
  })

  it('defaults the amount to 1', async () => {
    const onDamage = vi.fn()
    render(CreatureRow, { creature: player(), onDamage })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(onDamage).toHaveBeenCalledWith(1)
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

  it('adds temporary HP from the amount field', async () => {
    const onAddTemp = vi.fn()
    render(CreatureRow, { creature: player(), onAddTemp })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '7' } })
    await fireEvent.click(screen.getByRole('button', { name: /temp/i }))
    expect(onAddTemp).toHaveBeenCalledWith(7)
  })

  it('has no death-save buttons for a living player', () => {
    render(CreatureRow, { creature: player() })
    expect(screen.queryByRole('button', { name: /success/i })).not.toBeInTheDocument()
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
    expect(screen.getByText('CA 17')).toBeInTheDocument()
  })

  it('reveals an input seeded with the current CA when clicked', async () => {
    render(CreatureRow, { creature: player({ ca: 17 }) })
    await fireEvent.click(screen.getByText('CA 17'))
    expect(screen.getByLabelText('CA')).toHaveValue(17)
  })

  it('commits the new CA on blur', async () => {
    const onSetCa = vi.fn()
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa })
    await fireEvent.click(screen.getByText('CA 17'))
    const input = screen.getByLabelText('CA')
    await fireEvent.input(input, { target: { value: '14' } })
    await fireEvent.blur(input)
    expect(onSetCa).toHaveBeenCalledWith(14)
  })

  it('commits the new CA on Enter', async () => {
    const onSetCa = vi.fn()
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa })
    await fireEvent.click(screen.getByText('CA 17'))
    const input = screen.getByLabelText('CA')
    await fireEvent.input(input, { target: { value: '12' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetCa).toHaveBeenCalledWith(12)
  })

  it('returns to the plain value after committing', async () => {
    render(CreatureRow, { creature: player({ ca: 17 }), onSetCa: vi.fn() })
    await fireEvent.click(screen.getByText('CA 17'))
    const input = screen.getByLabelText('CA')
    await fireEvent.blur(input)
    expect(screen.queryByLabelText('CA')).not.toBeInTheDocument()
  })
})

describe('CreatureRow conditions', () => {
  it('shows an emoji for each active condition', () => {
    render(CreatureRow, { creature: toggleCondition(player(), 'poisoned') })
    expect(screen.getByText('🤢')).toBeInTheDocument()
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
