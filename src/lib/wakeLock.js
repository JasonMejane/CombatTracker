/**
 * Keeps the screen awake through the Screen Wake Lock API while `update(true)`.
 * The browser drops the lock whenever the page is hidden, so it is requested again
 * each time the page becomes visible. Every failure is silent: the lock is a comfort,
 * never a requirement.
 * @param {{ nav?: any, doc?: any, onChange?: (held: boolean) => void }} [options]
 */
export function createWakeLock(options) {
  const { nav, doc, onChange } = withDefaults(options)
  const supported = Boolean(nav.wakeLock)
  let wanted = false
  let pending = false
  /** @type {any} */
  let sentinel = null

  function setSentinel(next) {
    sentinel = next
    onChange(Boolean(next))
  }

  const needsLock = () => wanted && !sentinel && !pending
  const isVisible = () => doc.visibilityState === 'visible'

  function acquire() {
    if (!(needsLock() && isVisible())) return Promise.resolve()
    pending = true
    return nav.wakeLock
      .request('screen')
      .then(hold, () => {})
      .finally(() => (pending = false))
  }

  function hold(lock) {
    lock.addEventListener('release', () => forget(lock))
    setSentinel(lock)
    return wanted ? undefined : release()
  }

  function forget(lock) {
    if (sentinel === lock) setSentinel(null)
  }

  function release() {
    const lock = sentinel
    if (!lock) return Promise.resolve()
    setSentinel(null)
    return lock.release().catch(() => {})
  }

  /** @param {boolean} next */
  async function update(next) {
    if (!supported) return
    wanted = next
    await (wanted ? acquire() : release())
  }

  const onVisibility = () => acquire()
  if (supported) doc.addEventListener('visibilitychange', onVisibility)

  function destroy() {
    wanted = false
    if (supported) doc.removeEventListener('visibilitychange', onVisibility)
    return release()
  }

  return { supported, update, destroy }
}

/**
 * @param {{ nav?: any, doc?: any, onChange?: (held: boolean) => void }} [options]
 */
function withDefaults(options) {
  return { nav: globalThis.navigator, doc: globalThis.document, onChange: () => {}, ...options }
}
