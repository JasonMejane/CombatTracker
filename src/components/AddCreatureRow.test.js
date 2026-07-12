import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import AddCreatureRow from './AddCreatureRow.svelte'

const toggle = () => screen.getByRole('button', { name: /add creature/i })

describe('AddCreatureRow', () => {
  it('hides the form until the row is clicked', () => {
    render(AddCreatureRow, { onAdd: vi.fn() })
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('reveals the form when the row is clicked', async () => {
    render(AddCreatureRow, { onAdd: vi.fn() })
    await fireEvent.click(toggle())
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('hides the form again when the row is clicked a second time', async () => {
    render(AddCreatureRow, { onAdd: vi.fn() })
    await fireEvent.click(toggle())
    await fireEvent.click(toggle())
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('forwards the built creature and auto-closes after a successful add', async () => {
    const onAdd = vi.fn()
    render(AddCreatureRow, { onAdd })
    await fireEvent.click(toggle())
    await fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Gimli' } })
    await fireEvent.input(screen.getByLabelText('HP'), { target: { value: '30' } })
    await fireEvent.input(screen.getByLabelText(/initiative/i), { target: { value: '9' } })
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Gimli', hp: 30, initiative: 9, isPlayer: true })
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('hides the initiative field when showInitiative is false', async () => {
    render(AddCreatureRow, { onAdd: vi.fn(), showInitiative: false })
    await fireEvent.click(toggle())
    expect(screen.queryByLabelText(/initiative/i)).not.toBeInTheDocument()
  })
})
