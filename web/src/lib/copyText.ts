// Copies text to the clipboard when the page can. A page without the
// Clipboard API (an insecure origin, such as plain HTTP that is not
// localhost) or one that refuses the write copies nothing and throws
// nothing. Tested in copyText.test.ts.

/** The part of `navigator.clipboard` this needs; undefined when the page has none. */
export type ClipboardWriter = Pick<Clipboard, 'writeText'> | undefined

function pageClipboard(): ClipboardWriter {
  return 'clipboard' in navigator ? navigator.clipboard : undefined
}

export function copyText(text: string, clipboard: ClipboardWriter = pageClipboard()): void {
  if (clipboard === undefined) return
  try {
    void clipboard.writeText(text).catch(() => undefined)
  } catch {
    // A writeText that throws at once copies nothing, as one that rejects does.
  }
}
