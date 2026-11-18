// The chain-link mark before an artifact's link (Figma "icon/link", D2
// 403:500, T2 405:472). Figma draws the two links across its whole 13 px
// box; the library's LinkIcon draws them across the middle 15 of its 24,
// so the 20 px size gives a 12.6 px mark, and the negative margins keep
// the 13 px box's place in the row. The colour comes from the row
// (`fg.muted`), as the link's text. Props only.
import { LinkIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const mark = css({ display: 'flex', mx: '-4', my: '-2' })

export function LinkMark() {
  return (
    <span className={mark}>
      <LinkIcon size="20" />
    </span>
  )
}
