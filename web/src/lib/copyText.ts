// Copies text to the clipboard and says what happened (audit W-6), so a
// caller can show "Copied" or "Copy failed". 'unavailable': the page has no
// Clipboard API (an insecure origin, such as plain HTTP that is not
// localhost). 'refused': the write threw or rejected. A refusal that is not
// the browser's NotAllowedError is a fault, so it goes to `report`; lib
// imports no other layer, so the caller passes the reporter. Tested in
// copyText.test.ts.
import { err, ok, type Result } from '@bridge/shared'

/** The part of `navigator.clipboard` this needs; null when the page has none. */
type ClipboardWriter = Pick<Clipboard, 'writeText'> | null

export type CopyTextOptions = {
  /** Gets a refusal that is not NotAllowedError, such as `(e) => report(e, 'handler')` (errors/reporter.ts). */
  readonly report: (error: unknown) => void
  /** The clipboard to write; the page's own by default, null for none. */
  readonly clipboard?: ClipboardWriter
}

/** What a browser can give: some keep the key with no value on an insecure origin, which the DOM type does not show. */
type PageNavigator = { readonly clipboard?: Clipboard | undefined }

function pageClipboard(page: PageNavigator = navigator): ClipboardWriter {
  return page.clipboard ?? null
}

/** The browser refused the write (no permission or no user gesture): expected, not a fault. */
function isNotAllowed(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError'
}

export async function copyText(
  text: string,
  { report, clipboard = pageClipboard() }: CopyTextOptions,
): Promise<Result<void, 'unavailable' | 'refused'>> {
  if (clipboard === null) return err('unavailable')
  try {
    await clipboard.writeText(text)
    return ok(undefined)
  } catch (error) {
    if (!isNotAllowed(error)) report(error)
    return err('refused')
  }
}
