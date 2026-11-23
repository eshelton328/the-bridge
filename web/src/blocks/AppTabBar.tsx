// The tablet and phone tab bar of every page: the first shown pages in the
// owner's order (d-038, d-119; `pages`, from navLayout's `tabs`: five on
// the tablet, four on the phone), with the needs-you count on Inbox (d-045,
// d-047: More comes last). The default order gives the tablet Home to
// Artifacts and opens Toolkit from More; the phone shows Home to Projects
// and opens Artifacts and Toolkit from More (d-105). It takes the
// place of the desktop rail (AppRail). On the tablet the tabs are one centred
// group, as Figma draws them (`size="tablet"`); each tab carries its Figma
// layer name (`tab · Home`) for the fidelity check. Props only; the page
// entry does the navigation.
import { MoreIcon, TabBar } from '@eshelton328/component-library-1701'
import type { NavPage } from '../lib/deviceSettings.ts'
import { navPageItems } from './navPages.ts'

export type AppTabBarProps = {
  /** The page on screen; a page the tab bar does not show, such as Settings, selects More. */
  selected: NavPage | 'settings' | 'more'
  /** The tabs before More, in order: navLayout's `tabs` for the device. */
  pages: readonly NavPage[]
  device: 'tablet' | 'phone'
  /** The number of Inbox items that need the owner. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
}

export function AppTabBar({ selected, pages, device, inboxBadge, onSelect }: AppTabBarProps) {
  return (
    <div data-figma="tab bar">
      <TabBar
        size={device}
        selected={selected !== 'more' && selected !== 'settings' && pages.includes(selected) ? selected : 'more'}
        onSelect={onSelect}
        items={[
          ...pages.map((page) => {
            const { label, Icon } = navPageItems[page]
            return {
              value: page,
              label,
              figma: `tab · ${label}`,
              icon: <Icon />,
              ...(page === 'inbox' ? { badge: inboxBadge } : {}),
            }
          }),
          { value: 'more', label: 'More', figma: 'tab · More', icon: <MoreIcon /> },
        ]}
      />
    </div>
  )
}
