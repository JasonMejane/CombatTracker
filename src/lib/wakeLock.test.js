import { describe, it, expect, vi } from 'vitest'
import { createWakeLock } from './wakeLock.js'

function fakeSentinel() {
  const listeners = []
  const sentinel = {
    released: false,
    addEventListener: (type, fn) => listeners.push(fn),
    release: vi.fn(async () => {
      sentinel.released = true
      listeners.forEach((fn) => fn())
    }),
    // What the browser does on its own when the page is hidden.
    systemRelease: () => {
      sentinel.released = true
      listeners.forEach((fn) => fn())
    },
  }
  return sentinel
}

function setup({ request } = {}) {
  const sentinels = []
  const nav = {
    wakeLock: {
      request: request ?? vi.fn(async () => sentinels[sentinels.push(fakeSentinel()) - 1]),
    },
  }
  let onVisibility = null
  const doc = {
    visibilityState: 'visible',
    addEventListener: vi.fn((type, fn) => (onVisibility = fn)),
    removeEventListener: vi.fn(),
  }
  const onChange = vi.fn()
  const lock = createWakeLock({ nav, doc, onChange })
  const becomeVisible = async (visible) => {
    doc.visibilityState = visible ? 'visible' : 'hidden'
    await onVisibility()
  }
  return { lock, nav, doc, onChange, sentinels, becomeVisible }
}

describe('createWakeLock', () => {
  it('is unsupported without the Wake Lock API', async () => {
    const lock = createWakeLock({ nav: {}, doc: { addEventListener: vi.fn() } })
    expect(lock.supported).toBe(false)
    await expect(lock.update(true)).resolves.toBeUndefined()
  })

  it('requests a screen lock when wanted', async () => {
    const { lock, nav, onChange } = setup()
    await lock.update(true)
    expect(nav.wakeLock.request).toHaveBeenCalledWith('screen')
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('does not request twice while already held', async () => {
    const { lock, nav } = setup()
    await lock.update(true)
    await lock.update(true)
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1)
  })

  it('releases the lock when no longer wanted', async () => {
    const { lock, sentinels, onChange } = setup()
    await lock.update(true)
    await lock.update(false)
    expect(sentinels[0].release).toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('waits for the page to be visible before requesting', async () => {
    const { lock, nav, becomeVisible } = setup()
    await becomeVisible(false)
    await lock.update(true)
    expect(nav.wakeLock.request).not.toHaveBeenCalled()
    await becomeVisible(true)
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1)
  })

  it('takes the lock back when the page returns after the system dropped it', async () => {
    const { lock, nav, sentinels, onChange, becomeVisible } = setup()
    await lock.update(true)
    sentinels[0].systemRelease()
    expect(onChange).toHaveBeenLastCalledWith(false)
    await becomeVisible(true)
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('does not take the lock back when it is no longer wanted', async () => {
    const { lock, nav, becomeVisible } = setup()
    await lock.update(true)
    await lock.update(false)
    await becomeVisible(true)
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1)
  })

  it('lets go of a lock granted after it stopped being wanted', async () => {
    let grant
    const sentinel = fakeSentinel()
    const request = vi.fn(() => new Promise((resolve) => (grant = () => resolve(sentinel))))
    const { lock } = setup({ request })
    const pending = lock.update(true)
    await lock.update(false)
    grant()
    await pending
    expect(sentinel.release).toHaveBeenCalled()
  })

  it('stays quiet when the browser refuses the lock', async () => {
    const request = vi.fn(async () => {
      throw new Error('NotAllowedError')
    })
    const { lock, onChange } = setup({ request })
    await expect(lock.update(true)).resolves.toBeUndefined()
    expect(onChange).not.toHaveBeenCalledWith(true)
  })

  it('cleans up on destroy', async () => {
    const { lock, doc, sentinels } = setup()
    await lock.update(true)
    await lock.destroy()
    expect(doc.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(sentinels[0].release).toHaveBeenCalled()
  })
})
