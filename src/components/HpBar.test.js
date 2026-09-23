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

  it('applies the health variant class', () => {
    const { container } = render(HpBar, { current: 5, max: 10, variant: 'bloodied' })
    expect(fill(container)).toHaveClass('bloodied')
  })

  it('exposes the HP as a meter', () => {
    render(HpBar, { current: 7, max: 10, temp: 3, variant: 'healthy' })
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '7')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '10')
    expect(meter).toHaveAttribute('aria-valuetext', '7 of 10 HP, 3 temporary')
  })

  it('names a bloodied or critical state in the meter text', () => {
    render(HpBar, { current: 2, max: 10, variant: 'critical' })
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '2 of 10 HP, critical')
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

describe('HpBar change flash', () => {
  it('shows nothing on first render', () => {
    const { container } = render(HpBar, { current: 10, max: 10 })
    expect(container.querySelector('.hp-delta')).toBeNull()
  })

  it('floats the HP lost after a hit', async () => {
    const { rerender } = render(HpBar, { current: 10, max: 10 })
    await rerender({ current: 3, max: 10 })
    expect(screen.getByText('−7')).not.toHaveClass('gain')
  })

  it('floats the HP gained after healing', async () => {
    const { rerender } = render(HpBar, { current: 3, max: 10 })
    await rerender({ current: 7, max: 10 })
    expect(screen.getByText('+4')).toHaveClass('gain')
  })

  it('counts temporary HP in the change', async () => {
    const { rerender } = render(HpBar, { current: 10, max: 10, temp: 5 })
    await rerender({ current: 10, max: 10, temp: 2 })
    expect(screen.getByText('−3')).toBeInTheDocument()
  })
})
