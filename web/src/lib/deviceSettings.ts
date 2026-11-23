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

/** The pages the rail, the tab bar and the More drawer can show, in the default order. Settings is not one. */
export const navPages = ['home', 'inbox', 'workspaces', 'projects', 'artifacts', 'toolkit'] as const
export type NavPage = (typeof navPages)[number]

export const modes = ['light', 'dark', 'system'] as const
export type Mode = (typeof modes)[number]

export const textSizes = ['small', 'default', 'large'] as const
export type TextSize = (typeof textSizes)[number]

export const chatModels = ['fable', 'opus', 'sonnet', 'haiku'] as const
export const chatEfforts = ['low', 'medium', 'high', 'xhigh', 'max'] as const
export const chatPermissions = ['default', 'auto', 'plan'] as const

const navEntry = z.strictObject({ page: z.enum(navPages), visible: z.boolean() })
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

/** Today's look: Dark, default text, every page shown in the default order. */
export const defaultSettings: DeviceSettings = {
  mode: 'dark',
  textSize: 'default',
  nav: navPages.map((page) => ({ page, visible: true })),
  chat: { model: 'opus', effort: 'high', permission: 'default' },
}

/** Why a nav change or a stored nav is refused. */
export type NavProblem = 'unknownPage' | 'repeatedPage' | 'noVisiblePage' | 'currentPage'

/**
 * The nav rules: each nav page at most once, and at least one shown page
 * besides Home, so the desktop rail (which has no Home) and every tab bar
 * keep a page item. Settings is not a nav page, so it is never hidden: it
 * is always reachable from More. A page the stored list lacks, such as a
 * page added after the save, is added at the end, shown.
 */
export function checkNav(nav: readonly NavEntry[]): Result<readonly NavEntry[], NavProblem> {
  const seen = new Set<NavPage>()
  for (const entry of nav) {
    if (seen.has(entry.page)) return err('repeatedPage')
    seen.add(entry.page)
  }
  const full = [...nav, ...navPages.filter((page) => !seen.has(page)).map((page) => ({ page, visible: true }))]
  if (!full.some((entry) => entry.visible && entry.page !== 'home')) return err('noVisiblePage')
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
export function moveNavPage(nav: readonly NavEntry[], page: NavPage, by: -1 | 1): readonly NavEntry[] {
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

/** The shown pages in order. */
export function visibleNavPages(nav: readonly NavEntry[]): readonly NavPage[] {
  return nav.filter((entry) => entry.visible).map((entry) => entry.page)
}

/** How many pages the tab bar shows before More (the brief of d-119). */
const tabCount = { tablet: 5, phone: 4 } as const

export type NavLayout = {
  /** The desktop rail's pages: the logo is Home, so it has no Home item. */
  readonly rail: readonly NavPage[]
  /** The tab bar's pages before More on a tablet or phone. */
  readonly tabs: readonly NavPage[]
  /** The shown pages that do not fit in the tab bar; the More drawer lists them. */
  readonly more: readonly NavPage[]
}

/** Which bar shows which of the shown pages `visible` on a device. */
export function navLayout(visible: readonly NavPage[], device: 'desktop' | 'tablet' | 'phone'): NavLayout {
  const count = device === 'desktop' ? tabCount.tablet : tabCount[device]
  return {
    rail: visible.filter((page) => page !== 'home'),
    tabs: visible.slice(0, count),
    more: visible.slice(count),
  }
}

/** The shown pages of the default settings: what every story and Figma frame draws. */
export const defaultVisiblePages: readonly NavPage[] = visibleNavPages(defaultSettings.nav)
