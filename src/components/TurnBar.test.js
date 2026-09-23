import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import TurnBar from './TurnBar.svelte'

const setup = (props = {}) => render(TurnBar, { round: 1, activeName: null, canUndo: false, hasCreatures: true, ...props })

describe('TurnBar', () => {
  it('shows the round and whose turn it is', () => {
    setup({ round: 3, activeName: 'Aria' })
    expect(screen.getByText('Round 3')).toBeInTheDocument()
    expect(screen.getByText("Aria's turn")).toBeInTheDocument()
  })

  it('announces turn changes politely', () => {
    setup({ round: 2, activeName: 'Aria' })
    expect(screen.getByText("Aria's turn").closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('invites to start before the first turn', () => {
    setup()
    expect(screen.getByText(/not started/i)).toBeInTheDocument()
  })

  it('advances the turn', async () => {
    const onNext = vi.fn()
    setup({ onNext })
    await fireEvent.click(screen.getByRole('button', { name: /next turn/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it('disables next turn without creatures', () => {
    setup({ hasCreatures: false })
    expect(screen.getByRole('button', { name: /next turn/i })).toBeDisabled()
  })

  it('steps back a turn', async () => {
    const onPrevious = vi.fn()
    setup({ activeName: 'Aria', onPrevious })
    await fireEvent.click(screen.getByRole('button', { name: /previous turn/i }))
    expect(onPrevious).toHaveBeenCalled()
  })

  it('disables previous turn before combat starts', () => {
    setup()
    expect(screen.getByRole('button', { name: /previous turn/i })).toBeDisabled()
  })

  it('undoes the last change', async () => {
    const onUndo = vi.fn()
    setup({ canUndo: true, onUndo })
    await fireEvent.click(screen.getByRole('button', { name: /undo last change/i }))
    expect(onUndo).toHaveBeenCalled()
  })

  it('disables undo with nothing to undo', () => {
    setup({ canUndo: false })
    expect(screen.getByRole('button', { name: /undo last change/i })).toBeDisabled()
  })
})
