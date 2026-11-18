// The cap of the discussion's reply box, which the desktop panel (D7) and the
// tablet's discussion page (T4) share. A long draft grows the reply box; past
// half the window it scrolls inside, so Send stays in reach (d-107), as the
// Inbox's discussion. In a short window it also stops at 30% of its container
// (the panel or the page, each `containerType: 'size'`), so the bars leave the
// messages room to read.
import { css } from '../../../../styled-system/css/index.js'

export const discussionReply = css({ maxH: '[min(50vh, 30cqh)]', overflowY: 'auto' })
