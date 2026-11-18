// Erik's decision (2026-11-18): the installed app never zooms the page. The
// viewport meta of index.html sets `maximum-scale=1, user-scalable=no` and
// index.css sets `touch-action: pan-x pan-y`, but iOS Safari ignores
// `user-scalable=no`, so on iOS a pinch is stopped here: each `gesturestart`
// and `gesturechange` on the document is cancelled, unless it starts inside
// an element marked `data-allow-pinch` (a part that zooms itself).

/** The parts of `navigator` that tell iOS apart. */
export type NavigatorLike = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>

/** True on iPhone, iPad and iPod, and on iPadOS, which reports a Mac but has touch. */
export function isIos(nav: NavigatorLike): boolean {
  if (/iPhone|iPad|iPod/.test(nav.userAgent)) return true
  const looksLikeMac = nav.userAgent.includes('Macintosh') || nav.platform === 'MacIntel'
  return looksLikeMac && nav.maxTouchPoints > 1
}

/** True unless the gesture starts inside an element marked `data-allow-pinch`. */
export function shouldBlockGesture(target: EventTarget | null): boolean {
  return !(target instanceof Element && target.closest('[data-allow-pinch]') !== null)
}

const GESTURES = ['gesturestart', 'gesturechange']

function cancelPageZoom(event: Event): void {
  if (shouldBlockGesture(event.target)) event.preventDefault()
}

/** On iOS, cancels page-zoom gestures on `doc`; returns the function that removes the listeners. */
export function blockPageZoom(nav: NavigatorLike = navigator, doc: Document = document): () => void {
  if (!isIos(nav)) return () => undefined
  for (const type of GESTURES) doc.addEventListener(type, cancelPageZoom, { passive: false })
  return () => {
    for (const type of GESTURES) doc.removeEventListener(type, cancelPageZoom)
  }
}
