import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hideSplash } from './splash.js'

describe('hideSplash', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function mountSplash() {
    const splash = document.createElement('div')
    document.body.appendChild(splash)
    return splash
  }

  it('does not throw when there is no splash element', () => {
    expect(() => hideSplash(null)).not.toThrow()
  })

  it('keeps the splash visible until the display time elapses', () => {
    const splash = mountSplash()
    hideSplash(splash, { delay: 300, fade: 200 })
    vi.advanceTimersByTime(299)
    expect(splash.classList.contains('is-hidden')).toBe(false)
    expect(splash.isConnected).toBe(true)
  })

  it('fades the splash out once the display time has elapsed', () => {
    const splash = mountSplash()
    hideSplash(splash, { delay: 300, fade: 200 })
    vi.advanceTimersByTime(300)
    expect(splash.classList.contains('is-hidden')).toBe(true)
    expect(splash.isConnected).toBe(true)
  })

  it('removes the splash from the DOM after the fade', () => {
    const splash = mountSplash()
    hideSplash(splash, { delay: 300, fade: 200 })
    vi.advanceTimersByTime(500)
    expect(splash.isConnected).toBe(false)
  })

  it('defaults to a 300ms display time', () => {
    const splash = mountSplash()
    hideSplash(splash)
    vi.advanceTimersByTime(299)
    expect(splash.classList.contains('is-hidden')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(splash.classList.contains('is-hidden')).toBe(true)
  })
})
