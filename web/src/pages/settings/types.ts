// The Settings page's view models (d-119), each from its Zod schema: the
// owner's settings on this device as lib/deviceSettings.ts shapes them, the
// Notifications switch's state (d-118) and the Inbox badge of the rail and
// the tab bar.
import { z } from 'zod'
import {
  barPages,
  chatEfforts,
  chatModels,
  chatPermissions,
  chatWidths,
  modes,
  navPages,
  textSizes,
} from '../../lib/deviceSettings.ts'

const NavEntry = z.object({ page: z.enum(barPages), visible: z.boolean() })

export const SettingsValues = z.object({
  mode: z.enum(modes),
  textSize: z.enum(textSizes),
  chatWidth: z.enum(chatWidths),
  nav: z.array(NavEntry),
  chat: z.object({ model: z.enum(chatModels), effort: z.enum(chatEfforts), permission: z.enum(chatPermissions) }),
})
export type SettingsValues = z.infer<typeof SettingsValues>

/** The Notifications switch as a state draws it; the live page passes the store's switch (state/pushStore.ts). */
const PushView = z.object({
  state: z.enum(['unknown', 'unsupported', 'homeScreen', 'denied', 'off', 'on']),
  busy: z.boolean(),
  failed: z.boolean(),
})

export const SettingsData = z.object({
  /** The number of Inbox items that need the owner, on the rail's and the tab bar's Inbox. */
  railBadge: z.number(),
  settings: SettingsValues,
  push: PushView,
})
export type SettingsData = z.infer<typeof SettingsData>

/** Why a nav switch did not change: the one shown page besides Home cannot be hidden. */
export const NavNotice = z.object({ page: z.enum(navPages), problem: z.literal('noVisiblePage') })
export type NavNotice = z.infer<typeof NavNotice>

/** The view state a frame shows. */
export const SettingsUi = z.object({
  /** The phone's and the tablet's More drawer is open (M3). */
  moreOpen: z.boolean().optional(),
  /** The line under a nav switch the owner could not turn off. */
  navNotice: NavNotice.optional(),
})
export type SettingsUi = z.infer<typeof SettingsUi>

/** The schema of one Settings state, for the state checks. */
export const SettingsState = z.object({ data: SettingsData, ui: SettingsUi })
