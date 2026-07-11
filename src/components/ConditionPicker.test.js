import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import ConditionPicker from './ConditionPicker.svelte'
import { CONDITIONS } from '../lib/conditions.js'

describe('ConditionPicker', () => {
  it('offers every condition in the catalog', () => {
    render(ConditionPicker, { active: [] })
    expect(screen.getAllByRole('button')).toHaveLength(CONDITIONS.length)
  })

  it('marks active conditions as pressed', () => {
    render(ConditionPicker, { active: ['poisoned'] })
    expect(screen.getByRole('button', { name: /poisoned/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /stunned/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggle with the condition key when tapped', async () => {
    const onToggle = vi.fn()
    render(ConditionPicker, { active: [], onToggle })
    await fireEvent.click(screen.getByRole('button', { name: /poisoned/i }))
    expect(onToggle).toHaveBeenCalledWith('poisoned')
  })
})
