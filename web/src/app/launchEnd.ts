// Ends the launch view (index.html's #launch) once the app draws: when #root gets its first element, the page or its
// pending skeleton (router.ts's pendingMs), the view is marked leaving in the next frame. From that moment it takes no
// tap, and index.html's style fades it out with duration.fade and easing.fade (screen review R66); when the fade ends
// it goes from the DOM. It is removed, never only hidden, so no full-screen layer stays over the app
// (bridge-workbench, R57). With reduced motion the style has no transition, and the view goes at once.

/** The longest of a computed `transition-duration` list ("0.25s", "250ms, 0s"), in milliseconds. */
function longestMs(durations: string): number {
  let longest = 0
  for (const part of durations.split(',')) {
    const value = Number.parseFloat(part)
    if (Number.isNaN(value)) continue
    longest = Math.max(longest, part.trim().endsWith('ms') ? value : value * 1000)
  }
  return longest
}

/** Watches `container` and fades out, then removes, `doc`'s #launch after the app's first element; returns the stop. */
export function endLaunchOnFirstDraw(container: Element, doc: Document = document): () => void {
  const launch = doc.getElementById('launch')
  if (launch === null) return () => undefined
  let frame: number | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const end = () => {
    observer.disconnect()
    frame = requestAnimationFrame(() => {
      launch.dataset.leaving = ''
      const fade = longestMs(getComputedStyle(launch).transitionDuration)
      if (fade === 0) launch.remove()
      else
        timer = setTimeout(() => {
          launch.remove()
        }, fade)
    })
  }
  const observer = new MutationObserver(() => {
    if (container.firstElementChild !== null) end()
  })
  if (container.firstElementChild === null) observer.observe(container, { childList: true })
  else end()
  return () => {
    observer.disconnect()
    if (frame !== undefined) cancelAnimationFrame(frame)
    if (timer !== undefined) clearTimeout(timer)
  }
}
