import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchLatestVersion, isUpdateAvailable, watchForUpdate, applyUpdate } from './version.js'

const respond = (body, ok = true) => vi.fn(async () => ({ ok, json: async () => body }))
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function fakeDoc(visibilityState = 'visible') {
  const listeners = new Set()
  return {
    visibilityState,
    addEventListener: vi.fn((_, fn) => listeners.add(fn)),
    removeEventListener: vi.fn((_, fn) => listeners.delete(fn)),
    fire: () => listeners.forEach((fn) => fn()),
  }
}

describe('fetchLatestVersion', () => {
  it('returns the deployed version', async () => {
    expect(await fetchLatestVersion({ fetch: respond({ version: 'b' }) })).toBe('b')
  })

  it('bypasses every cache', async () => {
    const fetch = respond({ version: 'b' })
    await fetchLatestVersion({ fetch })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toMatch(/^\/version\.json\?t=\d+$/)
    expect(init).toEqual({ cache: 'no-store' })
  })

  it('returns null on an HTTP error', async () => {
    expect(await fetchLatestVersion({ fetch: respond({ version: 'b' }, false) })).toBeNull()
  })

  it('returns null when offline', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await fetchLatestVersion({ fetch })).toBeNull()
  })

  it('returns null on a malformed body', async () => {
    expect(await fetchLatestVersion({ fetch: respond({ version: 42 }) })).toBeNull()
    const fetch = vi.fn(async () => ({ ok: true, json: async () => JSON.parse('<html>') }))
    expect(await fetchLatestVersion({ fetch })).toBeNull()
  })
})

describe('isUpdateAvailable', () => {
  it('is true when the deployed version differs', () => {
    expect(isUpdateAvailable('a', 'b')).toBe(true)
  })

  it('is false for the same version or an unknown one', () => {
    expect(isUpdateAvailable('a', 'a')).toBe(false)
    expect(isUpdateAvailable('a', null)).toBe(false)
  })
})

describe('watchForUpdate', () => {
  it('checks right away and reports a newer version', async () => {
    const onAvailable = vi.fn()
    watchForUpdate({ current: 'a', onAvailable, fetch: respond({ version: 'b' }), doc: fakeDoc() })
    await flush()
    expect(onAvailable).toHaveBeenCalledWith('b')
  })

  it('stays quiet when up to date', async () => {
    const onAvailable = vi.fn()
    watchForUpdate({ current: 'a', onAvailable, fetch: respond({ version: 'a' }), doc: fakeDoc() })
    await flush()
    expect(onAvailable).not.toHaveBeenCalled()
  })

  it('checks again when the app comes back to the foreground', async () => {
    const fetch = respond({ version: 'a' })
    const doc = fakeDoc()
    watchForUpdate({ current: 'a', onAvailable: vi.fn(), fetch, doc })
    doc.fire()
    await flush()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not check while hidden', async () => {
    const fetch = respond({ version: 'a' })
    const doc = fakeDoc()
    watchForUpdate({ current: 'a', onAvailable: vi.fn(), fetch, doc })
    doc.visibilityState = 'hidden'
    doc.fire()
    await flush()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('stops listening once stopped', () => {
    const doc = fakeDoc()
    const stop = watchForUpdate({ current: 'a', onAvailable: vi.fn(), fetch: respond({ version: 'a' }), doc })
    stop()
    expect(doc.removeEventListener).toHaveBeenCalledWith('visibilitychange', doc.addEventListener.mock.calls[0][1])
  })
})

describe('applyUpdate', () => {
  function fakeServiceWorker(registration) {
    const listeners = new Set()
    return {
      getRegistration: vi.fn(async () => registration),
      addEventListener: vi.fn((_, fn) => listeners.add(fn)),
      takeControl: () => listeners.forEach((fn) => fn()),
    }
  }

  function fakeWorker() {
    const listeners = new Set()
    return {
      state: 'installing',
      addEventListener: vi.fn((_, fn) => listeners.add(fn)),
      become(state) {
        this.state = state
        listeners.forEach((fn) => fn())
      },
    }
  }

  const registrationWith = (worker = {}) => ({ update: vi.fn(async () => {}), installing: null, waiting: null, ...worker })

  afterEach(() => vi.useRealTimers())

  it('just reloads without a service worker', async () => {
    const reload = vi.fn()
    await applyUpdate({ nav: {}, reload })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads right away when the worker is already current', async () => {
    const registration = registrationWith()
    const reload = vi.fn()
    await applyUpdate({ nav: { serviceWorker: fakeServiceWorker(registration) }, reload })
    expect(registration.update).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('waits for the new worker to take control before reloading', async () => {
    const serviceWorker = fakeServiceWorker(registrationWith({ installing: fakeWorker() }))
    const reload = vi.fn()
    const done = applyUpdate({ nav: { serviceWorker }, reload, timeoutMs: 10_000 })
    await flush()
    expect(reload).not.toHaveBeenCalled()
    serviceWorker.takeControl()
    await done
    expect(reload).toHaveBeenCalledOnce()
  })

  it('gives a slow install up to 12 seconds by default', async () => {
    vi.useFakeTimers()
    const reload = vi.fn()
    const serviceWorker = fakeServiceWorker(registrationWith({ waiting: fakeWorker() }))
    const done = applyUpdate({ nav: { serviceWorker }, reload })
    await vi.advanceTimersByTimeAsync(11_999)
    expect(reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await done
    expect(reload).toHaveBeenCalledOnce()
  })

  it('stops waiting as soon as the new worker fails to install', async () => {
    const worker = fakeWorker()
    const reload = vi.fn()
    const done = applyUpdate({
      nav: { serviceWorker: fakeServiceWorker(registrationWith({ installing: worker })) },
      reload,
      timeoutMs: 10_000,
    })
    await flush()
    worker.become('installed')
    await flush()
    expect(reload).not.toHaveBeenCalled()
    worker.become('redundant')
    await done
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads anyway if the registration lookup never settles', async () => {
    const serviceWorker = { getRegistration: () => new Promise(() => {}), addEventListener: vi.fn() }
    const reload = vi.fn()
    await applyUpdate({ nav: { serviceWorker }, reload, timeoutMs: 1 })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads anyway when the service worker cannot be reached', async () => {
    const nav = {
      get serviceWorker() {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    }
    const reload = vi.fn()
    await applyUpdate({ nav, reload })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads even when the update check fails', async () => {
    const registration = { ...registrationWith(), update: vi.fn(async () => Promise.reject(new Error('offline'))) }
    const reload = vi.fn()
    await applyUpdate({ nav: { serviceWorker: fakeServiceWorker(registration) }, reload })
    expect(reload).toHaveBeenCalledOnce()
  })
})
