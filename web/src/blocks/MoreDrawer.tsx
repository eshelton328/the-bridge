// The phone's More drawer of every page (Toolkit M4 424:6940): a bottom
// sheet over the tab bar that the tab bar's More opens. Artifacts and
// Toolkit open their pages; Brain and Workflows wait under Later (d-105).
// It draws the library's MoreDrawer as it is. Props only; the page entry
// does the navigation, and the screen keeps whether it is open.
import {
  ArtifactsIcon,
  BrainIcon,
  BranchIcon,
  MoreDrawer as LibraryMoreDrawer,
  ToolkitIcon,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../styled-system/css/index.js'

// A box around each icon, so the fidelity check can measure the Figma icon layer; the tile sizes the icon.
const iconBox = css({ display: 'inline-flex' })

function Icon({ layer, children }: { layer: string; children: ReactNode }) {
  return (
    <span className={iconBox} data-figma={layer}>
      {children}
    </span>
  )
}

export type MoreDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The page on screen; its item has the selected colours. */
  selected?: 'artifacts' | 'toolkit' | undefined
  /** How many artifacts and toolkit items there are; an item without a count shows none. */
  counts?: { artifacts?: number | undefined; toolkit?: number | undefined } | undefined
  /** Called with `artifacts` or `toolkit` when the owner picks it; the drawer then closes. */
  onNavigate?: ((page: string) => void) | undefined
}

export function MoreDrawer({ open, onOpenChange, selected, counts, onNavigate }: MoreDrawerProps) {
  return (
    <LibraryMoreDrawer
      open={open}
      onOpenChange={onOpenChange}
      selected={selected}
      onSelect={onNavigate}
      groups={[
        {
          items: [
            {
              value: 'artifacts',
              label: 'Artifacts',
              description: 'Every Claude artifact and Codex site',
              icon: (
                <Icon layer="icon/layers">
                  <ArtifactsIcon />
                </Icon>
              ),
              count: counts?.artifacts,
            },
            {
              value: 'toolkit',
              label: 'Toolkit',
              description: 'Agents, skills, workflows, rules and hooks',
              icon: (
                <Icon layer="icon/toolkit">
                  <ToolkitIcon />
                </Icon>
              ),
              count: counts?.toolkit,
            },
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
