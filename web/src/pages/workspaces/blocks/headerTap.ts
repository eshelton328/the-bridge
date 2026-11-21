// A deliberate tap or click on a chat's header (slice W2): what sends a focus
// to herdr, which moves the focus in the owner's real terminal. Only a click
// counts, so a scroll or a drag never does, and only on the header itself:
// never on one of its buttons (the menu's ⋯, Maximise), in an open menu, in
// a text field, or at the end of a text selection. The library's `Pane`
// reports a press anywhere in the pane (`onActivate`), so the page finds
// the header in the DOM (LIBRARY_GAPS.md: Layout writes).

/** Controls in a header whose click is their own, never a tap on the header. */
const controls = 'button, a, input, textarea, select, [role="menu"], [role="menuitem"], [contenteditable="true"]'

/**
 * The click whose `target` hit `header` is a tap on the header itself: not on a control in it, and not one that ends a
 * text selection.
 */
export function isHeaderTap(target: EventTarget | null, header: Element | null | undefined): boolean {
  if (!(target instanceof Element) || header === null || header === undefined) return false
  if (!header.contains(target) || target.closest(controls) !== null) return false
  const selection = window.getSelection()
  return selection === null || selection.isCollapsed
}
