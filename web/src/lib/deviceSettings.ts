// The owner's settings on this device (d-119): mode, text size, the nav
// pages' order and visibility (d-038) and the new chat defaults. They live
// in this browser's localStorage under one key and are never sent to the
// server; each device keeps its own on purpose. This file holds the shape,
// the parse of what is stored, the nav rules and which bar shows which
// page; state/settingsStore.ts keeps the values and reads and writes the key.
// index.html reads the same key's `mode` before the first paint
// (app/colorMode.ts).
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'

/** The localStorage key of the settings; index.html's mode script reads only this key. */
export const settingsKey = 'bridge/settings'

/** The pages the rail, the tab bar and the More drawer can show, in the default order. */
export const navPages = ['home', 'inbox', 'workspaces', 'projects', 'artifacts', 'toolkit'] as const
export type NavPage = (typeof navPages)[number]

/**
 * The entries of the owner's bar order: the nav pages, then Settings (d-119). Settings can move into the tab bar
 * but has no off switch: when it is not in the bar it is in More (and the rail's gear on the desktop), so it is
 * never lost. Last by default, so the default bar is today's.
 */
export const barPages = [...navPages, 'settings'] as const
export type BarPage = (typeof barPages)[number]

export const modes = ['light', 'dark', 'system'] as const
export type Mode = (typeof modes)[number]

export const textSizes = ['small', 'default', 'large'] as const
export type TextSize = (typeof textSizes)[number]

export const chatModels = ['fable', 'opus', 'sonnet', 'haiku'] as const
export const chatEfforts = ['low', 'medium', 'high', 'xhigh', 'max'] as const
export const chatPermissions = ['default', 'auto', 'plan'] as const

const navEntry = z.strictObject({ page: z.enum(barPages), visible: z.boolean() })
export type NavEntry = z.infer<typeof navEntry>

const chatDefaults = z.strictObject({
  model: z.enum(chatModels),
  effort: z.enum(chatEfforts),
  permission: z.enum(chatPermissions),
})
export type ChatDefaults = z.infer<typeof chatDefaults>

export type DeviceSettings = {
  readonly mode: Mode
  readonly textSize: TextSize
  readonly nav: readonly NavEntry[]
  readonly chat: ChatDefaults
}

/** Today's look: Dark, default text, every page shown in the default order, Settings last. */
export const defaultSettings: DeviceSettings = {
  mode: 'dark',
  textSize: 'default',
  nav: barPages.map((page) => ({ page, visible: true })),
  chat: { model: 'opus', effort: 'high', permission: 'default' },
}

/** Why a nav change or a stored nav is refused. */
export type NavProblem = 'unknownPage' | 'repeatedPage' | 'noVisiblePage' | 'currentPage'

/**
 * The nav rules: each entry at most once, and at least one shown page
 * besides Home and Settings, so the desktop rail (which has no Home and
 * draws Settings as its gear) and every tab bar keep a page item. Settings
 * is always shown: a stored hidden Settings is shown again. An entry the
 * stored list lacks, such as Settings in a save from before it was an
 * entry, is added at the end, shown.
 */
export function checkNav(nav: readonly NavEntry[]): Result<readonly NavEntry[], NavProblem> {
  const seen = new Set<BarPage>()
  for (const entry of nav) {
    if (seen.has(entry.page)) return err('repeatedPage')
    seen.add(entry.page)
  }
  const full = [
    ...nav.map((entry) => (entry.page === 'settings' ? { page: entry.page, visible: true } : entry)),
    ...barPages.filter((page) => !seen.has(page)).map((page) => ({ page, visible: true })),
  ]
  if (!full.some((entry) => entry.visible && entry.page !== 'home' && entry.page !== 'settings'))
    return err('noVisiblePage')
  return ok(full)
}

const stored = z.object({
  mode: z.unknown(),
  textSize: z.unknown(),
  nav: z.unknown(),
  chat: z.unknown(),
})

/**
 * The settings in a stored value: each field that does not parse, or a nav
 * that breaks the rules (`checkNav`), keeps its default. Never throws.
 */
export function parseSettings(value: unknown): DeviceSettings {
  const fields = stored.partial().safeParse(value)
  if (!fields.success) return defaultSettings
  const { data } = fields
  const mode = z.enum(modes).safeParse(data.mode)
  const textSize = z.enum(textSizes).safeParse(data.textSize)
  const nav = z.array(navEntry).safeParse(data.nav)
  const checked = nav.success ? checkNav(nav.data) : undefined
  const chat = chatDefaults.safeParse(data.chat)
  return {
    mode: mode.success ? mode.data : defaultSettings.mode,
    textSize: textSize.success ? textSize.data : defaultSettings.textSize,
    nav: checked?.ok === true ? checked.value : defaultSettings.nav,
    chat: chat.success ? chat.data : defaultSettings.chat,
  }
}

/** The settings in a stored string; text that is not JSON gives the defaults. */
export function parseStoredSettings(text: string | null): DeviceSettings {
  if (text === null) return defaultSettings
  try {
    return parseSettings(JSON.parse(text))
  } catch {
    // Not JSON (a hand edit or another version's format): the defaults, as with no save.
    return defaultSettings
  }
}

/** `nav` with `page` moved one place up (-1) or down (1); unchanged at either end. */
export function moveNavPage(nav: readonly NavEntry[], page: BarPage, by: -1 | 1): readonly NavEntry[] {
  const from = nav.findIndex((entry) => entry.page === page)
  const to = from + by
  const moved = nav[from]
  if (moved === undefined || to < 0 || to >= nav.length) return nav
  const rest = nav.filter((_, i) => i !== from)
  return [...rest.slice(0, to), moved, ...rest.slice(to)]
}

/**
 * `nav` with `page` shown or hidden. Refused when it would hide `current`,
 * the page on screen, or leave no shown page besides Home (`checkNav`).
 */
export function setNavPageVisible(
  nav: readonly NavEntry[],
  page: NavPage,
  visible: boolean,
  current: NavPage | undefined,
): Result<readonly NavEntry[], NavProblem> {
  if (!visible && page === current) return err('currentPage')
  return checkNav(nav.map((entry) => (entry.page === page ? { page, visible } : entry)))
}

/** The shown entries in order, Settings included. */
export function visibleNavPages(nav: readonly NavEntry[]): readonly BarPage[] {
  return nav.filter((entry) => entry.visible).map((entry) => entry.page)
}

/** How many tabs the tab bar holds, More included when it shows (d-119: 5 on the phone, 6 on the iPad). */
const barSlots = { tablet: 6, phone: 5 } as const

export type NavLayout = {
  /** The desktop rail's pages: the logo is Home and the gear is Settings, so it has neither as an item. */
  readonly rail: readonly NavPage[]
  /** The tab bar's tabs on a tablet or phone, before More when More shows. */
  readonly tabs: readonly BarPage[]
  /** The shown entries that do not fit in the tab bar; the More drawer lists them. Empty: the bar has no More. */
  readonly more: readonly BarPage[]
}

/** The rail's pages: the shown nav pages but Home and Settings. */
function railPages(visible: readonly BarPage[]): NavPage[] {
  const pages: NavPage[] = []
  for (const page of visible) if (page !== 'home' && page !== 'settings') pages.push(page)
  return pages
}

/**
 * Which bar shows which of the shown entries `visible` on a device. When they all fit in the tab bar's slots, the bar
 * shows them all and no More; else the last slot is More and the rest go to the More drawer (d-119).
 */
export function navLayout(visible: readonly BarPage[], device: 'desktop' | 'tablet' | 'phone'): NavLayout {
  const slots = device === 'desktop' ? barSlots.tablet : barSlots[device]
  const fit = visible.length <= slots ? visible.length : slots - 1
  return { rail: railPages(visible), tabs: visible.slice(0, fit), more: visible.slice(fit) }
}

/** The shown entries of the default settings: what every story and Figma frame draws. */
export const defaultVisiblePages: readonly BarPage[] = visibleNavPages(defaultSettings.nav)
