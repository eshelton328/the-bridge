// The tablet and phone tab bar of every page: the first shown pages in the
// owner's order (d-038, d-119; `pages`, from navLayout's `tabs`: five on
// the tablet, four on the phone, when More shows), with the needs-you
// count on Inbox (d-045, d-047: More comes last). When the shown entries
// all fit (six on the tablet, five on the phone) the bar has them all and
// no More (d-119); Settings is an entry the owner can move into the bar.
// The default order gives the tablet Home to Artifacts and opens Toolkit
// and Settings from More; the phone shows Home to Projects and opens
// Artifacts, Toolkit and Settings from More (d-105). It takes the
// place of the desktop rail (AppRail). On the tablet the tabs are one centred
// group, as Figma draws them (`size="tablet"`); each tab carries its Figma
// layer name (`tab · Home`) for the fidelity check. Props only; the page
// entry does the navigation.
import { MoreIcon, TabBar } from '@eshelton328/component-library-1701'
import type { BarPage } from '../lib/deviceSettings.ts'
import { barPageItems } from './navPages.ts'

export type AppTabBarProps = {
  /** The page on screen; a page the tab bar does not show selects More. */
  selected: BarPage | 'more'
  /** The tabs, in order: navLayout's `tabs` for the device. */
  pages: readonly BarPage[]
  /** Whether the bar ends with More: navLayout's `more` is not empty. */
  more: boolean
  device: 'tablet' | 'phone'
  /** The number of Inbox items that need the owner. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
}

export function AppTabBar({ selected, pages, more, device, inboxBadge, onSelect }: AppTabBarProps) {
  return (
    <div data-figma="tab bar">
      <TabBar
        size={device}
        selected={selected !== 'more' && pages.includes(selected) ? selected : more ? 'more' : undefined}
        onSelect={onSelect}
        items={[
          ...pages.map((page) => {
            const { label, Icon } = barPageItems[page]
            return {
              value: page,
              label,
              figma: `tab · ${label}`,
              icon: <Icon />,
              ...(page === 'inbox' ? { badge: inboxBadge } : {}),
            }
          }),
          ...(more ? [{ value: 'more', label: 'More', figma: 'tab · More', icon: <MoreIcon /> }] : []),
        ]}
      />
    </div>
  )
}
