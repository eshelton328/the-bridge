// The grid of a card group (CardGroup), shared with its skeleton (CardGroupSkeleton), so a loading page lays its
// cards out in the same columns and gaps as the loaded one.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'

export const cardColumns = { desktop: '4', tablet: '2', phone: '1' } as const satisfies Record<Viewport, string>
// T1 (405:159 to 405:166, 405:166 to 405:229): the header and the card rows 10 apart; the columns 12 apart (Figma 14,
// on the 4 px grid, d-100), so with the page's 20 px sides a card is 352 wide (Figma 349) and its text column, inside
// Card's 16 px padding, is 320 (Figma 319 inside 14): Hono server spike's description (405:220) shows whole, as in Figma.
export const tabletCardRows = css({ rowGap: '10' })
export const cardGap = { desktop: '16', tablet: '12', phone: '16' } as const satisfies Record<Viewport, string>
// T1: GroupHeader is 36 high against Figma's 34 (405:159), so the cards come 8 under it, not Figma's 10, and sit
// where Figma has them (the label is centred, so it keeps Figma's distance to the cards within a pixel).
export const groupGap = (layout: Viewport) => (layout === 'tablet' ? '8' : '12')
