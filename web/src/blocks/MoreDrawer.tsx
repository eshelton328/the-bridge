// The phone's More drawer of every page (Toolkit M4 424:6940): a bottom
// sheet over the tab bar that the tab bar's More opens. Its first group is
// the shown pages that do not fit in the tab bar, in the owner's order
// (d-038, d-119; `pages`, from navLayout's `more`): Artifacts and Toolkit in
// the default order. Brain and Workflows wait under Later (d-105).
// Settings follows them in the same group (d-119), on every page: the owner
// cannot hide it. The drawer draws it when the screen passes `settings`,
// which every page entry does; a Figma page's states pass none, as Figma
// draws no Settings row. It draws the library's MoreDrawer as it is. The tablet's
// More opens it too (d-119; d-105 sent it to Toolkit). The Notifications
// switch is on the Settings page (d-118, d-119).
// Props only; the page entry does the navigation, and the screen keeps
// whether it is open.
import { BrainIcon, BranchIcon, MoreDrawer as LibraryMoreDrawer } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import type { NavPage } from '../lib/deviceSettings.ts'
import { navPageItems, settingsItem } from './navPages.ts'
import { css } from '../../styled-system/css/index.js'

// A box around each icon, so the fidelity check can measure the Figma icon layer; the tile sizes the icon.
const iconBox = css({ display: 'inline-flex' })

function Icon({ layer, children }: { layer: string | undefined; children: ReactNode }) {
  return (
    <span className={iconBox} data-figma={layer}>
      {children}
    </span>
  )
}

export type MoreDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The pages of the first group, in order: navLayout's `more`. */
  pages: readonly NavPage[]
  /** The page on screen; its item has the selected colours. */
  selected?: NavPage | 'settings' | undefined
  /** How many artifacts and toolkit items there are; an item without a count shows none. */
  counts?: { artifacts?: number | undefined; toolkit?: number | undefined } | undefined
  /** Called with the page the owner picks; the drawer then closes. */
  onNavigate?: ((page: string) => void) | undefined
  /** Draws the Settings row after the pages (d-119); see AppRail's `settings`. */
  settings?: boolean | undefined
}

export function MoreDrawer({
  open,
  onOpenChange,
  pages,
  selected,
  counts,
  onNavigate,
  settings = false,
}: MoreDrawerProps) {
  const { label: settingsLabel, description: settingsLine, Icon: SettingsIcon } = settingsItem
  return (
    <LibraryMoreDrawer
      open={open}
      onOpenChange={onOpenChange}
      selected={selected}
      onSelect={onNavigate}
      groups={[
        {
          items: [
            ...pages.map((page) => {
              const { label, description, Icon: PageIcon, drawerIconLayer } = navPageItems[page]
              return {
                value: page,
                label,
                description,
                icon: (
                  <Icon layer={drawerIconLayer}>
                    <PageIcon />
                  </Icon>
                ),
                count: page === 'artifacts' ? counts?.artifacts : page === 'toolkit' ? counts?.toolkit : undefined,
              }
            }),
            ...(settings
              ? [
                  {
                    value: 'settings',
                    label: settingsLabel,
                    description: settingsLine,
                    icon: (
                      <Icon layer={undefined}>
                        <SettingsIcon />
                      </Icon>
                    ),
                  },
                ]
              : []),
          ],
        },
        {
          label: 'Later',
          items: [
            {
              value: 'brain',
              label: 'Brain',
              description: 'Changes, the brain map and drift findings',
              icon: (
                <Icon layer="icon/brain">
                  <BrainIcon />
                </Icon>
              ),
              disabled: true,
            },
            {
              value: 'workflows',
              label: 'Workflows',
              description: 'Workflows and the projects they work on',
              icon: (
                <Icon layer="icon/flow">
                  <BranchIcon />
                </Icon>
              ),
              disabled: true,
            },
          ],
        },
      ]}
    />
  )
}
