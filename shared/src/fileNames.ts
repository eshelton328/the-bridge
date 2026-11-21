// The name the server gives an uploaded file (W1b): the server stores it under
// this name, and the transcript shows a prompt's files by it, so the page can
// tell which entry holds the files it sent (the pending send's match).

/** Whether a file name is a HEIC or HEIF photo, by its extension. */
export const isHeic = (name: string): boolean => /\.(heic|heif)$/i.test(name)

/** The name of a HEIC photo's JPEG copy: the same name with the extension .jpg. */
export const jpegName = (name: string): string => name.replace(/\.[^.]*$/, '.jpg')

/** A file name with no folder and only letters, digits and . _ -, at most 100 characters with its extension. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).at(-1) ?? ''
  const safe = base
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._]+/, '')
    .slice(-100)
  return safe === '' ? 'file' : safe
}

/** The name a file sent as `name` has in the transcript: its safe name, and a HEIC photo's JPEG copy's. */
export function sentFileName(name: string): string {
  const safe = safeFileName(name)
  return isHeic(safe) ? jpegName(safe) : safe
}
