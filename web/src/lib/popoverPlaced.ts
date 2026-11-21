// Ark's positioner draws a popover or menu at translate(var(--x, 0), var(--y, -100vh)) until zag has computed its
// place, a frame or more after the open: until then the popover sits 100vh above the window. A test that measures it,
// or clicks into it with `{ force: true }` (which skips Playwright's visible and stable checks), first polls
// `placed()`: `await expect.poll(() => placed(el)).toBe(true)`.

/** Whether zag has placed the popover of `el`: its positioner has the `--y` that zag sets once it computed it. */
export function placed(el: Element | null): boolean {
  const positioner = el?.closest('[data-part="positioner"]')
  if (!(positioner instanceof HTMLElement)) throw new Error('no positioner')
  return positioner.style.getPropertyValue('--y') !== ''
}
