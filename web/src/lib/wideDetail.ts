// Whether the shell detail around an element is as wide as `shell.detailWideFrom` (1600 px), where the library
// `Container size="detail"` widens to `shell.detailWide`. A part that must change more than its CSS at that size, such
// as a `Clamp`'s line count, reads it here (screen review R2: show more of the prompt on a wide screen).
import { type RefObject, useLayoutEffect, useState } from 'react'
import { token } from '../../styled-system/tokens/index.js'

const wideFrom = Number.parseFloat(token('sizes.shell.detailWideFrom'))

export function useWideDetail(ref: RefObject<HTMLElement | null>): boolean {
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const detail = ref.current?.closest<HTMLElement>('.app-shell__detail')
    if (detail === null || detail === undefined) return
    // The container query measures the detail's content box, as the observer does.
    const sizes = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWide(entry.contentRect.width >= wideFrom)
    })
    sizes.observe(detail)
    return () => {
      sizes.disconnect()
    }
  }, [ref])
  return wide
}
