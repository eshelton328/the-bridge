// The URL an image in a message loads (bridge-richtext), or undefined when it may not load. Only a file in the brain
// loads, through the server's image route (`GET /api/files/raw`), which sends a PNG, JPEG, GIF or WebP file that the
// brain's index lists and nothing else. A path relative to the brain (`images/chart.png`) names it by root and path;
// an absolute path or a `file:` URL names it by its absolute path, and the server finds its root. Any other URL
// (http, https, data, javascript, a protocol-relative `//host`) loads nothing, so a message loads nothing from
// another site; the image then shows its alt text, as before.
import { FileRawQuery } from '@bridge/contract'

/** The image route's query for `src`, or undefined when `src` is not a local file. */
function imageQuery(src: string | undefined): FileRawQuery | undefined {
  const raw = src?.trim() ?? ''
  if (raw === '' || raw.startsWith('//')) return undefined
  let path: string
  if (/^file:/i.test(raw)) {
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      return undefined
    }
    if (url.host !== '' && url.host !== 'localhost') return undefined
    path = url.pathname
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return undefined
  } else {
    path = raw.replace(/[?#].*$/, '')
  }
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return undefined
  }
  const relative = decoded.replace(/^(\.\/)+/, '')
  const query = FileRawQuery.safeParse(decoded.startsWith('/') ? { path: decoded } : { root: 'brain', path: relative })
  return query.success ? query.data : undefined
}

/** The image route's URL for `src` on this origin, or undefined when `src` is not a local file. */
export function imageUrl(src: string | undefined): string | undefined {
  const query = imageQuery(src)
  if (query === undefined) return undefined
  const params = new URLSearchParams('root' in query ? { root: query.root, path: query.path } : { path: query.path })
  return `/api/files/raw?${params.toString()}`
}
