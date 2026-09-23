import '@testing-library/jest-dom/vitest'
import { beforeEach, afterEach, vi } from 'vitest'

// The app polls /version.json on mount; keep tests offline unless one serves a version.
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Promise.reject(new TypeError('offline in tests'))),
  ),
)
afterEach(() => vi.unstubAllGlobals())
