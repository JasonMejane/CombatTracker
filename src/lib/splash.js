export function hideSplash(splash, options) {
  if (!splash) return
  const { delay, fade } = { delay: 300, fade: 200, ...options }
  setTimeout(() => {
    splash.classList.add('is-hidden')
    setTimeout(() => splash.remove(), fade)
  }, delay)
}
