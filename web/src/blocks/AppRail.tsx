// The desktop nav rail of every page: the logo and the shown pages in the
// owner's order (d-038, d-119; `pages`, from navLayout's `rail`), with the
// needs-you count on Inbox (d-047: More comes last). The default order puts
// Artifacts and Toolkit before More, as the Toolkit page's D1 draws them
// (d-105).
// Each item carries its Figma layer name (`rail · Inbox`) for the fidelity
// check. With `push`, the Notifications switch sits at the rail's end
// (d-118; Figma has none, so each desktop frame records it as a deviation).
// Props only; the page entry does the navigation.
import { Logo, MoreIcon, NavRail } from '@eshelton328/component-library-1701'
import type { NavPage } from '../lib/deviceSettings.ts'
import type { PushSwitch } from '../lib/pushSwitch.ts'
import { navPageItems } from './navPages.ts'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

export type AppRailProps = {
  /** The page on screen; a page the rail does not show selects More. */
  selected: NavPage | 'more'
  /** The pages the rail shows, in order: navLayout's `rail`. */
  pages: readonly NavPage[]
  /** The number of Inbox items that need the owner. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
  /** The Notifications switch (d-118); the rail has none when not set, as in the Figma states. */
  push?: PushSwitch | undefined
}

export function AppRail({ selected, pages, inboxBadge, onSelect, push }: AppRailProps) {
  return (
    <NavRail
      selected={selected !== 'more' && pages.includes(selected) ? selected : 'more'}
      onSelect={onSelect}
      logo={
        <a href="/" aria-label="Home">
          <Logo size="28" />
        </a>
      }
      items={[
        ...pages.map((page) => {
          const { label, Icon } = navPageItems[page]
          return {
            value: page,
            label,
            figma: `rail · ${label}`,
            icon: <Icon />,
            ...(page === 'inbox' ? { badge: inboxBadge } : {}),
          }
        }),
        { value: 'more', label: 'More', figma: 'rail · More', icon: <MoreIcon /> },
      ]}
      footer={push === undefined ? undefined : <NotificationsSwitch push={push} layout="stacked" />}
    />
  )
}
