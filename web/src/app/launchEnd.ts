// Ends the launch view (index.html's #launch) once the app draws: when #root gets its first element, the page or its
// pending skeleton (router.ts's pendingMs), the view goes from the DOM in the next frame. It is removed, never hidden,
// so no full-screen layer stays over the app (bridge-workbench, R57), and it never takes a tap. No fade yet: the library
// has no duration token for one (duration.fade comes with the shared shimmer).

/** Watches `container` and removes `doc`'s #launch after the app's first element; returns the stop. */
export function endLaunchOnFirstDraw(container: Element, doc: Document = document): () => void {
  const launch = doc.getElementById('launch')
  if (launch === null) return () => undefined
  let frame: number | undefined
  const end = () => {
    observer.disconnect()
    frame = requestAnimationFrame(() => {
      launch.remove()
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
  }
}
