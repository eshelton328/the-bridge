// The desktop nav rail of every page: the logo and the shown pages in the
// owner's order (d-038, d-119; `pages`, from navLayout's `rail`), with the
// needs-you count on Inbox, then the Settings gear and More (d-047: More
// comes last; d-119: the gear is the last item before More). The default
// order puts Artifacts and Toolkit before More, as the Toolkit page's D1
// draws them (d-105).
// Each item carries its Figma layer name (`rail · Inbox`) for the fidelity
// check. The Notifications switch is on the Settings page (d-118, d-119).
// Props only; the page entry does the navigation.
import { Logo, MoreIcon, NavRail } from '@eshelton328/component-library-1701'
import type { NavPage } from '../lib/deviceSettings.ts'
import { navPageItems, settingsItem } from './navPages.ts'

export type AppRailProps = {
  /** The page on screen; a nav page the rail does not show selects More. */
  selected: NavPage | 'settings' | 'more'
  /** The pages the rail shows, in order: navLayout's `rail`. */
  pages: readonly NavPage[]
  /** The number of Inbox items that need the owner. */
  inboxBadge: number
  onSelect?: ((page: string) => void) | undefined
  /**
   * Draws the Settings gear before More (d-119). Every page entry passes it, so the app always shows the gear; a
   * Figma page's state and story pass none, as Figma draws no gear, so its fidelity checks are unchanged.
   */
  settings?: boolean | undefined
}

/** The item the rail marks: the page on screen, or More for a page it does not show. */
function railSelected(selected: AppRailProps['selected'], pages: readonly NavPage[]): string {
  if (selected === 'settings' || selected === 'more') return selected
  return pages.includes(selected) ? selected : 'more'
}

export function AppRail({ selected, pages, inboxBadge, onSelect, settings = false }: AppRailProps) {
  const { label: settingsLabel, Icon: SettingsIcon } = settingsItem
  return (
    <NavRail
      selected={railSelected(selected, pages)}
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
        ...(settings
          ? [{ value: 'settings', label: settingsLabel, figma: 'rail · Settings', icon: <SettingsIcon /> }]
          : []),
        { value: 'more', label: 'More', figma: 'rail · More', icon: <MoreIcon /> },
      ]}
    />
  )
}
