// The phone's More drawer of every page (Toolkit M4 424:6940): a bottom
// sheet over the tab bar that the tab bar's More opens. Its first group is
// the shown pages that do not fit in the tab bar, in the owner's order
// (d-038, d-119; `pages`, from navLayout's `more`): Artifacts and Toolkit in
// the default order. Brain and Workflows wait under Later (d-105).
// It draws the library's MoreDrawer as it is. With `push`, the
// Notifications switch sits below the groups (d-118; Figma has none, so the
// drawer's frames record it as a deviation); it does not close the drawer.
// Props only; the page entry does the navigation, and the screen keeps
// whether it is open.
import { BrainIcon, BranchIcon, MoreDrawer as LibraryMoreDrawer } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import type { NavPage } from '../lib/deviceSettings.ts'
import type { PushSwitch } from '../lib/pushSwitch.ts'
import { navPageItems } from './navPages.ts'
import { css } from '../../styled-system/css/index.js'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

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
  selected?: NavPage | undefined
  /** How many artifacts and toolkit items there are; an item without a count shows none. */
  counts?: { artifacts?: number | undefined; toolkit?: number | undefined } | undefined
  /** Called with the page the owner picks; the drawer then closes. */
  onNavigate?: ((page: string) => void) | undefined
  /** The Notifications switch (d-118); the drawer has none when not set, as in the Figma states. */
  push?: PushSwitch | undefined
}

export function MoreDrawer({ open, onOpenChange, pages, selected, counts, onNavigate, push }: MoreDrawerProps) {
  return (
    <LibraryMoreDrawer
      open={open}
      onOpenChange={onOpenChange}
      selected={selected}
      onSelect={onNavigate}
      footer={push === undefined ? undefined : <NotificationsSwitch push={push} layout="inline" />}
      groups={[
        {
          items: pages.map((page) => {
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
