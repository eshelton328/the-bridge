// What the rail, the tab bar and the More drawer draw for each nav page
// (d-038, d-119): its label, its icon and its drawer line. Which page goes
// in which bar comes from the owner's order (lib/deviceSettings.ts
// navLayout), which the page entry reads and passes down as props.
import {
  ArtifactsIcon,
  HomeIcon,
  InboxIcon,
  ProjectsIcon,
  SettingsIcon,
  ToolkitIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'
import type { ComponentType } from 'react'
import type { NavPage } from '../lib/deviceSettings.ts'

export type NavPageItem = {
  readonly label: string
  readonly Icon: ComponentType
  /** The line under the label in the More drawer. */
  readonly description: string
  /** The Figma layer of its icon in the More drawer, where Figma draws the page there (Toolkit M4). */
  readonly drawerIconLayer?: string
}

/**
 * Settings (d-119): the rail's gear item before More and the More drawer's
 * row after the shown pages. It is not a nav page: the owner cannot hide or
 * move it, so it is always reachable.
 */
export const settingsItem: NavPageItem = {
  label: 'Settings',
  Icon: SettingsIcon,
  description: 'Appearance, navigation and chat defaults',
}

export const navPageItems: Readonly<Record<NavPage, NavPageItem>> = {
  home: { label: 'Home', Icon: HomeIcon, description: 'Where the app opens' },
  inbox: { label: 'Inbox', Icon: InboxIcon, description: 'What needs you' },
  workspaces: { label: 'Workspaces', Icon: WorkspacesIcon, description: 'Chats and their panes' },
  projects: { label: 'Projects', Icon: ProjectsIcon, description: 'Each project and its work' },
  artifacts: {
    label: 'Artifacts',
    Icon: ArtifactsIcon,
    description: 'Every Claude artifact and Codex site',
    drawerIconLayer: 'icon/layers',
  },
  toolkit: {
    label: 'Toolkit',
    Icon: ToolkitIcon,
    description: 'Agents, skills, workflows, rules and hooks',
    drawerIconLayer: 'icon/toolkit',
  },
}
