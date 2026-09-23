/**
 * Detects a newer deployment. Each build bakes its id into the bundle
 * (`__APP_VERSION__`) and publishes it as `/version.json`, which the service worker
 * never precaches — so fetching it past every cache reveals what is live.
 */
export const VERSION_URL = '/version.json'

/**
 * The deployed version, or null when offline, unreachable or malformed.
 * @param {{ fetch?: typeof globalThis.fetch }} [options]
 * @returns {Promise<string | null>}
 */
export async function fetchLatestVersion(options) {
  const { fetch } = { fetch: globalThis.fetch, ...options }
  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
    return response.ok ? readVersion(await response.json()) : null
  } catch {
    return null
  }
}

const readVersion = (body) => (typeof body?.version === 'string' ? body.version : null)

/**
 * @param {string} current
 * @param {string | null} latest
 */
export const isUpdateAvailable = (current, latest) => latest !== null && latest !== current

/**
 * Checks now, then every time the app returns to the foreground (installed PWAs are
 * resumed far more often than reloaded). Returns a function that stops watching.
 * @param {{ current: string, onAvailable: (latest: string) => void, fetch?: typeof globalThis.fetch, doc?: any }} options
 */
export function watchForUpdate({ current, onAvailable, fetch, doc = globalThis.document }) {
  async function check() {
    const latest = await fetchLatestVersion({ ...(fetch && { fetch }) })
    if (isUpdateAvailable(current, latest)) onAvailable(latest)
  }
  const onVisibility = () => doc.visibilityState === 'visible' && check()

  check()
  doc.addEventListener('visibilitychange', onVisibility)
  return () => doc.removeEventListener('visibilitychange', onVisibility)
}

/**
 * Reloads onto the new version. A plain reload could still be served the old build
 * by the service worker, so first ask it to update and, if a new worker turns up,
 * wait for it to take control of the page (or fail to install). Whatever goes wrong,
 * the page reloads after `timeoutMs` at the latest.
 * @param {{ nav?: any, reload?: () => void, timeoutMs?: number }} [options]
 */
export async function applyUpdate(options) {
  const { nav, reload, timeoutMs } = {
    nav: globalThis.navigator,
    reload: () => globalThis.location.reload(),
    timeoutMs: 12_000,
    ...options,
  }
  await Promise.race([activateLatest(nav), wait(timeoutMs)]).catch(() => {})
  reload()
}

async function activateLatest(nav) {
  const container = nav.serviceWorker
  const registration = container && (await container.getRegistration())
  if (registration) await activateLatestWorker(registration, container)
}

async function activateLatestWorker(registration, container) {
  const takenOver = new Promise((resolve) => container.addEventListener('controllerchange', resolve, { once: true }))
  await registration.update().catch(() => {})
  const incoming = registration.installing || registration.waiting
  if (incoming) await Promise.race([takenOver, untilRedundant(incoming)])
}

const untilRedundant = (worker) =>
  new Promise((resolve) => worker.addEventListener('statechange', () => worker.state === 'redundant' && resolve()))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
