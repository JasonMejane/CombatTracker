import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import AddCreatureForm from './AddCreatureForm.svelte'

async function fill({ name, hp, maxHp, initiative }) {
  if (name !== undefined) await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: name } })
  if (hp !== undefined) await fireEvent.input(screen.getByLabelText('HP'), { target: { value: hp } })
  if (maxHp !== undefined)
    await fireEvent.input(screen.getByLabelText(/max hp/i), { target: { value: maxHp } })
  if (initiative !== undefined)
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: initiative } })
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
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Hurt Hero', hp: 10, maxHp: 24 }),
    )
  })

  it('omits max hp when the field is left empty', async () => {
    const onAdd = vi.fn()
    render(AddCreatureForm, { onAdd })
    await fill({ name: 'Gimli', hp: '30', initiative: '9' })
    await fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Gimli', hp: 30, initiative: 9, isPlayer: true })
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
