import { render, screen } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest'
import HpBar from './HpBar.svelte'

function fill(container) {
  return container.querySelector('.hp-fill')
}

describe('HpBar', () => {
  it('shows the current and max HP', () => {
    render(HpBar, { current: 7, max: 10 })
    expect(screen.getByText('7/10')).toBeInTheDocument()
  })

  it('fills proportionally to the HP ratio', () => {
    const { container } = render(HpBar, { current: 7, max: 10 })
    expect(fill(container).style.width).toBe('70%')
  })

  it('is empty at 0 HP', () => {
    const { container } = render(HpBar, { current: 0, max: 10 })
    expect(fill(container).style.width).toBe('0%')
  })

  it('never exceeds 100%', () => {
    const { container } = render(HpBar, { current: 15, max: 10 })
    expect(fill(container).style.width).toBe('100%')
  })

  it('handles a zero max without dividing by zero', () => {
    const { container } = render(HpBar, { current: 0, max: 0 })
    expect(fill(container).style.width).toBe('0%')
  })

  it('applies the variant class', () => {
    const { container } = render(HpBar, { current: 5, max: 10, variant: 'enemy' })
    expect(fill(container)).toHaveClass('enemy')
  })

  it('shows no temp segment without temporary HP', () => {
    const { container } = render(HpBar, { current: 7, max: 10 })
    expect(container.querySelector('.hp-temp')).toBeNull()
  })

  it('renders a temp segment sized against the extended pool', () => {
    const { container } = render(HpBar, { current: 10, max: 10, temp: 5 })
    expect(container.querySelector('.hp-temp').style.width).toBe('33%')
    expect(fill(container).style.width).toBe('67%')
  })

  it('shows the temporary HP in the label', () => {
    render(HpBar, { current: 10, max: 10, temp: 5 })
    expect(screen.getByText('10/10 (+5)')).toBeInTheDocument()
  })
})
