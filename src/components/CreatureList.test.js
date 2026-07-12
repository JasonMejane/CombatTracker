import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import CreatureList from './CreatureList.svelte'
import { createCreature } from '../lib/creatures.js'

const make = (name, initiative, isPlayer = true) => createCreature({ name, hp: 10, initiative, isPlayer })

describe('CreatureList', () => {
  it('renders one row per creature', () => {
    const creatures = [make('A', 5), make('B', 9), make('C', 1)]
    const { container } = render(CreatureList, { creatures })
    expect(container.querySelectorAll('.creature-row')).toHaveLength(3)
  })

  it('orders rows by initiative descending', () => {
    const creatures = [make('Low', 3), make('High', 18), make('Mid', 10)]
    render(CreatureList, { creatures })
    const names = [...document.querySelectorAll('.creature-row .name')].map((n) => n.textContent)
    expect(names).toEqual(['High', 'Mid', 'Low'])
  })

  it('places players before enemies on a tie', () => {
    const creatures = [make('Enemy', 10, false), make('Player', 10, true)]
    render(CreatureList, { creatures })
    const names = [...document.querySelectorAll('.creature-row .name')].map((n) => n.textContent)
    expect(names).toEqual(['Player', 'Enemy'])
  })

  it('marks the active creature as active', () => {
    const active = make('Turn', 7)
    const other = make('Waiting', 4)
    const { container } = render(CreatureList, {
      creatures: [active, other],
      activeCreatureId: active.id,
    })
    const activeRows = container.querySelectorAll('.creature-row.active')
    expect(activeRows).toHaveLength(1)
    expect(activeRows[0].querySelector('.name').textContent).toBe('Turn')
  })

  it('shows an empty message when there are no creatures', () => {
    render(CreatureList, { creatures: [] })
    expect(screen.getByText(/no combatants/i)).toBeInTheDocument()
  })

  it('forwards damage with the creature id and amount', async () => {
    const onDamage = vi.fn()
    const c = make('Target', 5)
    render(CreatureList, { creatures: [c], onDamage })
    await fireEvent.input(screen.getByLabelText(/amount/i), { target: { value: '3' } })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(onDamage).toHaveBeenCalledWith(c.id, 3)
  })

  it('forwards revive with the creature id', async () => {
    const onRevive = vi.fn()
    const c = createCreature({ name: 'Down', hp: 0, initiative: 5, isPlayer: false })
    render(CreatureList, { creatures: [c], onRevive })
    await fireEvent.click(screen.getByRole('button', { name: /revive/i }))
    expect(onRevive).toHaveBeenCalledWith(c.id)
  })
})
