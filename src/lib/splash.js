export function hideSplash(splash, { delay = 300, fade = 200 } = {}) {
  if (!splash) return
  setTimeout(() => {
    splash.classList.add('is-hidden')
    setTimeout(() => splash.remove(), fade)
  }, delay)
}
