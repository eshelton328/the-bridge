// The chain-link mark before an artifact's link (Figma "icon/link", D2
// 403:500, T2 405:472). Figma draws the two links across its whole 13 px
// box; the library's LinkMarkIcon fills its box, at 12 on the 4 px icon
// scale. The colour comes from the row (`fg.muted`), as the link's text.
// Props only.
import { LinkMarkIcon } from '@eshelton328/component-library-1701'

export function LinkMark() {
  return <LinkMarkIcon size="12" />
}
