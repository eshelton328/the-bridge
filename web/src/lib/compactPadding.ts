// The padding of the library Container's tablet and phone sizes, for a ScrollFrame that must be the shell detail's own
// child. AppShell docks a ScrollFrame's footer (a chat's composer) on the on-screen keyboard only there, and a
// Container around the frame would put it a level deeper (screen review R21). The values are the Container's (tablet
// 12 / 20 / 24, phone 4 / 12 / 12), except a chat page's tablet top and foot. Figma puts the nav 4 under the status
// bar (T5 346:6366), so the page pads 4 at the top. Figma ends the reply box 40 over the frame's end (T5 346:6416,
// T17 402:11226), and AppShell keeps the home indicator's 34 under the page, so the page pads 6.
import { css } from '../../styled-system/css/index.js'

export const compactChatPadding = {
  tablet: css({ pt: '4', pb: '6', px: '24' }),
  phone: css({ pt: '4', pb: '12', px: '12' }),
} as const
