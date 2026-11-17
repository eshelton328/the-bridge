// The library Container size of a detail column for each layout: the
// desktop's detail column (748 wide, 40 in), the tablet's 24 in and the
// phone's 12 in.
import type { Viewport } from './screenState.ts'

export function detailContainerSize(layout: Viewport): 'detail' | 'tablet' | 'phone' {
  return layout === 'desktop' ? 'detail' : layout
}
