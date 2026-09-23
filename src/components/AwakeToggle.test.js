import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import AwakeToggle from './AwakeToggle.svelte'

const button = () => screen.getByRole('button', { name: /keep screen on/i })

describe('AwakeToggle', () => {
  it('reports whether keeping the screen on is enabled', () => {
    render(AwakeToggle, { enabled: true })
    expect(button()).toHaveAttribute('aria-pressed', 'true')
  })

  it('reports when it is turned off', () => {
    render(AwakeToggle, { enabled: false })
    expect(button()).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles', async () => {
    const onToggle = vi.fn()
    render(AwakeToggle, { enabled: true, onToggle })
    await fireEvent.click(button())
    expect(onToggle).toHaveBeenCalled()
  })

  it('says when the screen is actually being kept on', () => {
    render(AwakeToggle, { enabled: true, held: true })
    expect(button()).toHaveAttribute('title', expect.stringMatching(/screen is being kept on/i))
    expect(button()).toHaveClass('held')
  })

  it('explains it waits for combat when enabled but idle', () => {
    render(AwakeToggle, { enabled: true, held: false })
    expect(button()).toHaveAttribute('title', expect.stringMatching(/during combat/i))
  })
})
