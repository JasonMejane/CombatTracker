import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import CatalogPage from './CatalogPage.svelte'
import { createCatalogCreature } from '../lib/catalog.js'

const player = (name) => createCatalogCreature({ name, hp: 10, isPlayer: true })
const enemy = (name) => createCatalogCreature({ name, hp: 7, isPlayer: false })

function names() {
  return Array.from(document.querySelectorAll('.catalog-row .name')).map((n) => n.textContent)
}

describe('CatalogPage', () => {
  it('shows an empty state when the catalog is empty', () => {
    render(CatalogPage, { catalog: [] })
    expect(screen.getByText(/empty/i)).toBeInTheDocument()
  })

  it('lists creatures alphabetically', () => {
    render(CatalogPage, { catalog: [enemy('Zombie'), player('Aragorn'), enemy('Goblin')] })
    expect(names()).toEqual(['Aragorn', 'Goblin', 'Zombie'])
  })

  it('filters to players only', async () => {
    render(CatalogPage, { catalog: [player('Aragorn'), enemy('Goblin')] })
    await fireEvent.click(screen.getByRole('button', { name: /players/i }))
    expect(names()).toEqual(['Aragorn'])
  })

  it('filters to enemies only', async () => {
    render(CatalogPage, { catalog: [player('Aragorn'), enemy('Goblin')] })
    await fireEvent.click(screen.getByRole('button', { name: /enemies/i }))
    expect(names()).toEqual(['Goblin'])
  })

  it('adds a creature through the form with initiative hidden', async () => {
    const onAdd = vi.fn()
    render(CatalogPage, { catalog: [], onAdd })
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Goblin' } })
    await fireEvent.input(screen.getByLabelText('HP'), { target: { value: '7' } })
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Goblin', hp: 7, isPlayer: true })
  })

  it('propagates a remove from a row', async () => {
    const onRemove = vi.fn()
    const goblin = enemy('Goblin')
    render(CatalogPage, { catalog: [goblin], onRemove })
    await fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith(goblin.id)
  })

  it('propagates an HP edit from a row', async () => {
    const onSetHp = vi.fn()
    const goblin = enemy('Goblin')
    render(CatalogPage, { catalog: [goblin], onSetHp })
    await fireEvent.click(screen.getByText('7'))
    const input = document.querySelector('.catalog-row .hp-input')
    await fireEvent.input(input, { target: { value: '9' } })
    await fireEvent.blur(input)
    expect(onSetHp).toHaveBeenCalledWith(goblin.id, 9)
  })

  it('triggers onClear from the delete-all button', async () => {
    const onClear = vi.fn()
    render(CatalogPage, { catalog: [enemy('Goblin')], onClear })
    await fireEvent.click(screen.getByRole('button', { name: /delete all/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('disables delete all when the catalog is empty', () => {
    render(CatalogPage, { catalog: [] })
    expect(screen.getByRole('button', { name: /delete all/i })).toBeDisabled()
  })

  it('propagates a CA edit from a row', async () => {
    const onSetCa = vi.fn()
    const goblin = enemy('Goblin')
    render(CatalogPage, { catalog: [goblin], onSetCa })
    await fireEvent.click(screen.getByText(`CA ${goblin.ca}`))
    const input = document.querySelector('.catalog-row .ca-input')
    await fireEvent.input(input, { target: { value: '13' } })
    await fireEvent.blur(input)
    expect(onSetCa).toHaveBeenCalledWith(goblin.id, 13)
  })

  it('propagates a send from a row', async () => {
    const onSend = vi.fn()
    const goblin = enemy('Goblin')
    render(CatalogPage, { catalog: [goblin], onSend })
    await fireEvent.click(screen.getByRole('button', { name: /send to encounter/i }))
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '14' } })
    await fireEvent.click(screen.getByRole('button', { name: /^send$/i }))
    expect(onSend).toHaveBeenCalledWith(goblin.id, 14)
  })
})
