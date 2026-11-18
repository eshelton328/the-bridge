// An address with some search params set or removed and the others kept,
// for a router `navigate({ href })` that must not know the route's search
// type, such as the dev pane's state picker.

/** `pathname` with `searchStr`'s params, each of `changes` set, or removed when `undefined`. */
export function searchHref(pathname: string, searchStr: string, changes: Record<string, string | undefined>): string {
  const params = new URLSearchParams(searchStr)
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) params.delete(key)
    else params.set(key, value)
  }
  const search = params.toString()
  return search === '' ? pathname : `${pathname}?${search}`
}
