import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi } from 'vitest'
import UpdateBanner from './UpdateBanner.svelte'

const liveRegion = (container) => container.querySelector('[aria-live="polite"]')
const props = (overrides) => ({ available: true, onReload: vi.fn(), onDismiss: vi.fn(), ...overrides })

describe('UpdateBanner', () => {
  it('keeps an empty live region while there is nothing to announce', () => {
    const { container } = render(UpdateBanner, props({ available: false }))
    expect(liveRegion(container)).toBeEmptyDOMElement()
  })

  it('announces the new version inside the existing live region', async () => {
    const { container, rerender } = render(UpdateBanner, props({ available: false }))
    const region = liveRegion(container)
    await rerender(props())
    expect(region).toHaveTextContent(/new version is available/i)
  })

  it('reloads on demand and disables itself meanwhile', async () => {
    const onReload = vi.fn()
    render(UpdateBanner, props({ onReload }))
    const reload = screen.getByRole('button', { name: /reload/i })
    await fireEvent.click(reload)
    expect(onReload).toHaveBeenCalledOnce()
    expect(reload).toBeDisabled()
  })

  it('can be dismissed', async () => {
    const onDismiss = vi.fn()
    render(UpdateBanner, props({ onDismiss }))
    await fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
