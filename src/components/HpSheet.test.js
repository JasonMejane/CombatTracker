import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import HpSheet from './HpSheet.svelte'
import { createCreature } from '../lib/creatures.js'

const goblin = () => createCreature({ name: 'Goblin', hp: 7, initiative: 12, isPlayer: false })

async function type(digits) {
  for (const d of digits) await fireEvent.click(screen.getByRole('button', { name: d }))
}

describe('HpSheet', () => {
  it('is a dialog named after the creature', () => {
    render(HpSheet, { creature: goblin() })
    expect(screen.getByRole('dialog', { name: /goblin/i })).toBeInTheDocument()
  })

  it('shows the creature HP', () => {
    render(HpSheet, { creature: goblin() })
    expect(screen.getByText('7/7')).toBeInTheDocument()
  })

  it('builds the amount from the keypad', async () => {
    render(HpSheet, { creature: goblin() })
    await type('12')
    expect(screen.getByLabelText('Amount')).toHaveTextContent('12')
  })

  it('deletes the last digit', async () => {
    render(HpSheet, { creature: goblin() })
    await type('12')
    await fireEvent.click(screen.getByRole('button', { name: /delete digit/i }))
    expect(screen.getByLabelText('Amount')).toHaveTextContent('1')
  })

  it('clears the amount', async () => {
    render(HpSheet, { creature: goblin() })
    await type('12')
    await fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(screen.getByLabelText('Amount')).toHaveTextContent('0')
  })

  it('disables the actions until an amount is entered', () => {
    render(HpSheet, { creature: goblin() })
    expect(screen.getByRole('button', { name: /damage/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /heal/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /temp hp/i })).toBeDisabled()
  })

  it('applies damage', async () => {
    const onDamage = vi.fn()
    render(HpSheet, { creature: goblin(), onDamage })
    await type('7')
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(onDamage).toHaveBeenCalledWith(7)
  })

  it('applies healing', async () => {
    const onHeal = vi.fn()
    render(HpSheet, { creature: goblin(), onHeal })
    await type('3')
    await fireEvent.click(screen.getByRole('button', { name: /heal/i }))
    expect(onHeal).toHaveBeenCalledWith(3)
  })

  it('adds temporary HP', async () => {
    const onAddTemp = vi.fn()
    render(HpSheet, { creature: goblin(), onAddTemp })
    await type('5')
    await fireEvent.click(screen.getByRole('button', { name: /temp hp/i }))
    expect(onAddTemp).toHaveBeenCalledWith(5)
  })

  it('accepts typed digits from a keyboard', async () => {
    const onDamage = vi.fn()
    render(HpSheet, { creature: goblin(), onDamage })
    await fireEvent.keyDown(window, { key: '4' })
    await fireEvent.keyDown(window, { key: '2' })
    await fireEvent.keyDown(window, { key: 'Backspace' })
    await fireEvent.click(screen.getByRole('button', { name: /damage/i }))
    expect(onDamage).toHaveBeenCalledWith(4)
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(HpSheet, { creature: goblin(), onClose })
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes from the close button', async () => {
    const onClose = vi.fn()
    render(HpSheet, { creature: goblin(), onClose })
    await fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('caps the amount at four digits', async () => {
    render(HpSheet, { creature: goblin() })
    await type('123456')
    expect(screen.getByLabelText('Amount')).toHaveTextContent('1234')
  })
})
