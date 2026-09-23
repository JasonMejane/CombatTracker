import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import CatalogRow from './CatalogRow.svelte'
import { createCatalogCreature } from '../lib/catalog.js'

const goblin = (over = {}) => ({
  ...createCatalogCreature({ name: 'Goblin', hp: 7, isPlayer: false }),
  ...over,
})

function row(container) {
  return container.querySelector('.catalog-row')
}

describe('CatalogRow', () => {
  it('shows the name and base HP', () => {
    render(CatalogRow, { creature: goblin() })
    expect(screen.getByText('Goblin')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('marks a player row', () => {
    const { container } = render(CatalogRow, {
      creature: createCatalogCreature({ name: 'Hero', hp: 10, isPlayer: true }),
    })
    expect(row(container)).toHaveClass('player')
  })

  it('marks an enemy row', () => {
    const { container } = render(CatalogRow, { creature: goblin() })
    expect(row(container)).toHaveClass('enemy')
  })

  it('keeps delete out of reach until the edit panel is opened', () => {
    render(CatalogRow, { creature: goblin() })
    expect(screen.queryByRole('button', { name: /delete from catalog/i })).not.toBeInTheDocument()
  })

  it('deletes the creature from the edit panel', async () => {
    const onRemove = vi.fn()
    render(CatalogRow, { creature: goblin(), onRemove })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.click(screen.getByRole('button', { name: /delete from catalog/i }))
    expect(onRemove).toHaveBeenCalled()
  })

  it('saves a rename from the edit panel and closes it', async () => {
    const onEdit = vi.fn()
    render(CatalogRow, { creature: goblin(), onEdit })
    await fireEvent.click(screen.getByRole('button', { name: /edit goblin/i }))
    await fireEvent.input(screen.getByLabelText(/^name$/i), { target: { value: 'Hobgoblin' } })
    await fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onEdit).toHaveBeenCalledWith({ name: 'Hobgoblin', maxHp: 7 })
    expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument()
  })
})

describe('CatalogRow armor class', () => {
  it('shows the armor class beside the name', () => {
    render(CatalogRow, { creature: goblin({ ca: 15 }) })
    expect(screen.getByText('AC 15')).toBeInTheDocument()
  })

  it('reveals an input seeded with the current AC when clicked', async () => {
    render(CatalogRow, { creature: goblin({ ca: 15 }) })
    await fireEvent.click(screen.getByText('AC 15'))
    expect(screen.getByLabelText('AC')).toHaveValue(15)
  })

  it('commits the new AC on blur', async () => {
    const onSetCa = vi.fn()
    render(CatalogRow, { creature: goblin({ ca: 15 }), onSetCa })
    await fireEvent.click(screen.getByText('AC 15'))
    const input = screen.getByLabelText('AC')
    await fireEvent.input(input, { target: { value: '13' } })
    await fireEvent.blur(input)
    expect(onSetCa).toHaveBeenCalledWith(13)
  })

  it('commits the new AC on Enter', async () => {
    const onSetCa = vi.fn()
    render(CatalogRow, { creature: goblin({ ca: 15 }), onSetCa })
    await fireEvent.click(screen.getByText('AC 15'))
    const input = screen.getByLabelText('AC')
    await fireEvent.input(input, { target: { value: '11' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetCa).toHaveBeenCalledWith(11)
  })
})

describe('CatalogRow HP editing', () => {
  it('reveals an input seeded with the current HP when clicked', async () => {
    render(CatalogRow, { creature: goblin() })
    await fireEvent.click(screen.getByText('7'))
    expect(screen.getByLabelText(/hp/i)).toHaveValue(7)
  })

  it('commits the new HP on blur', async () => {
    const onSetHp = vi.fn()
    render(CatalogRow, { creature: goblin(), onSetHp })
    await fireEvent.click(screen.getByText('7'))
    const input = screen.getByLabelText(/hp/i)
    await fireEvent.input(input, { target: { value: '12' } })
    await fireEvent.blur(input)
    expect(onSetHp).toHaveBeenCalledWith(12)
  })

  it('commits the new HP on Enter', async () => {
    const onSetHp = vi.fn()
    render(CatalogRow, { creature: goblin(), onSetHp })
    await fireEvent.click(screen.getByText('7'))
    const input = screen.getByLabelText(/hp/i)
    await fireEvent.input(input, { target: { value: '9' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetHp).toHaveBeenCalledWith(9)
  })
})

describe('CatalogRow sending', () => {
  it('keeps the send form hidden until requested', () => {
    render(CatalogRow, { creature: goblin() })
    expect(screen.queryByRole('button', { name: /^send$/i })).not.toBeInTheDocument()
  })

  it('reveals the send form from the send button', async () => {
    render(CatalogRow, { creature: goblin() })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    expect(screen.getByLabelText(/initiative/i)).toBeInTheDocument()
  })

  it('forwards the chosen initiative to onSend', async () => {
    const onSend = vi.fn()
    render(CatalogRow, { creature: goblin(), onSend })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onSend).toHaveBeenCalledWith(14, 1)
  })

  it('hides the send form after sending', async () => {
    render(CatalogRow, { creature: goblin(), onSend: vi.fn() })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })

  it('hides the send form on cancel', async () => {
    render(CatalogRow, { creature: goblin() })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })

  it('offers an initiative roll for an NPC', async () => {
    render(CatalogRow, { creature: goblin() })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    expect(screen.getByRole('button', { name: /roll/i })).toBeInTheDocument()
  })

  it('offers no initiative roll for a player', async () => {
    render(CatalogRow, { creature: goblin({ isPlayer: true }) })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    expect(screen.queryByRole('button', { name: /roll/i })).not.toBeInTheDocument()
  })
})
