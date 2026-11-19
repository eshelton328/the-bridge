// The owner's decision (2026-11-18): the running app's page never scrolls,
// bounces or zooms. index.css locks the document only under this marker on
// <html>, which main.ts sets before the first render. Storybook and the
// fidelity screenshots load index.css too but never set it, so a story
// taller than its frame still scrolls the document.

/** The attribute on <html> that index.css's page lock matches (`html[data-app]`). */
export const APP_MARKER = 'data-app'

/** Marks `doc` as the running app; returns the function that removes the mark. */
export function markApp(doc: Document = document): () => void {
  doc.documentElement.setAttribute(APP_MARKER, '')
  return () => {
    doc.documentElement.removeAttribute(APP_MARKER)
  }
}
