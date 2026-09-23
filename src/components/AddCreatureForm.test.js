import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import AddCreatureForm from './AddCreatureForm.svelte'

vi.mock('../lib/dice.js', () => ({
  rollInitiative: (bonus) => 15 + Number(bonus),
}))

async function fill({ name, hp, maxHp, initiative }) {
  if (name !== undefined) await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: name } })
  if (hp !== undefined) await fireEvent.input(screen.getByLabelText('HP'), { target: { value: hp } })
  if (maxHp !== undefined) await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: maxHp } })
  if (initiative !== undefined) await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: initiative } })
}

describe('AddCreatureForm', () => {
  it('submits parsed values and defaults to a player', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Gimli', hp: 30, initiative: 9, isPlayer: true })
  })

  it('includes an explicit max hp when provided', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Hurt Hero', hp: '10', maxHp: '24', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hurt Hero', hp: 10, maxHp: 24 }))
  })

  it('omits max hp when the field is left empty', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Gimli', hp: 30, initiative: 9, isPlayer: true })
  })

  it('includes the armor class when provided', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Knight', hp: '20', initiative: '9' })
    await fireEvent.input(screen.getByLabelText('AC'), { target: { value: '18' } })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Knight', ca: 18 }))
  })

  it('omits the armor class when the field is left empty', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith(expect.not.objectContaining({ ca: expect.anything() }))
  })

  it('adds an enemy when the toggle is switched', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fireEvent.click(screen.getByLabelText(/enemy/i))
    await fill({ name: 'Goblin', hp: '7', initiative: '14' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Goblin', hp: 7, initiative: 14, isPlayer: false })
  })

  it('does not submit without a name', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ hp: '10', initiative: '5' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not submit without an hp value', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Nameless', initiative: '5' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('resets the fields after a successful add', async () => {
    render(AddCreatureForm, { onAdd: vi.fn() })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByLabelText(/name/i)).toHaveValue('')
    expect(screen.getByLabelText('HP')).toHaveValue(null)
  })
})

describe('AddCreatureForm without initiative', () => {
  it('hides the initiative field', () => {
    render(AddCreatureForm, { onAdd: vi.fn(), showInitiative: false })
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })

  it('still offers the armor-class field', () => {
    render(AddCreatureForm, { onAdd: vi.fn(), showInitiative: false })
    expect(screen.getByLabelText('AC')).toBeInTheDocument()
  })

  it('submits name and hp without an initiative key', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd, showInitiative: false })
    await fill({ name: 'Goblin', hp: '7' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Goblin', hp: 7, isPlayer: true })
  })

  it('submits without needing an initiative value', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd, showInitiative: false })
    await fill({ name: 'Goblin', hp: '7' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalled()
  })
})

describe('AddCreatureForm save to catalog', () => {
  it('does not offer it unless asked', () => {
    render(AddCreatureForm, { onAdd: vi.fn() })
    expect(screen.queryByLabelText(/save to catalog/i)).not.toBeInTheDocument()
  })

  it('is off by default', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd, offerSaveToCatalog: true })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Gimli', hp: 30, initiative: 9, isPlayer: true })
  })

  it('flags the creature for the catalog when ticked', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd, offerSaveToCatalog: true })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByLabelText(/save to catalog/i))
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gimli', saveToCatalog: true }))
  })
})

describe('AddCreatureForm initiative roll', () => {
  it('offers no roll for a player', () => {
    render(AddCreatureForm, { onAdd: vi.fn() })
    expect(screen.queryByRole('button', { name: /roll/i })).not.toBeInTheDocument()
  })

  it('rolls an enemy initiative from the die plus its bonus', async () => {
    render(AddCreatureForm, { onAdd: vi.fn() })
    await fireEvent.click(screen.getByLabelText(/enemy/i))
    await fireEvent.input(screen.getByLabelText(/init bonus/i), { target: { value: '2' } })
    await fireEvent.click(screen.getByRole('button', { name: /roll/i }))
    expect(screen.getByLabelText(/^initiative$/i)).toHaveValue(17)
  })

  it('offers no roll without an initiative field', async () => {
    render(AddCreatureForm, { onAdd: vi.fn(), showInitiative: false })
    await fireEvent.click(screen.getByLabelText(/enemy/i))
    expect(screen.queryByRole('button', { name: /roll/i })).not.toBeInTheDocument()
  })
})
