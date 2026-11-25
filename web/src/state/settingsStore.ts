// The owner's settings on this device (d-119; the shape and the rules are in
// lib/deviceSettings.ts). They stay in this browser's localStorage under one
// key; only `pushPreview` goes to the server, with the push subscription. The store starts at the defaults; the app
// calls startSettingsStorage() once (main.ts), which loads the saved
// settings and saves each change after, so a test or a story never reads or
// writes the owner's storage. A page entry reads the values with the hooks
// below and passes them to its screen as props.
import {
  type ChatDefaults,
  type ChatWidth,
  defaultSettings,
  type DeviceSettings,
  type Mode,
  moveNavPage,
  type NavEntry,
  type BarPage,
  type NavPage,
  type NavProblem,
  parseStoredSettings,
  type RichTextFeature,
  type RichTextFeatures,
  setNavPageVisible,
  settingsKey,
  type TextSize,
  visibleNavPages,
} from '../lib/deviceSettings.ts'
import { createAppStore } from './createAppStore.ts'

type SettingsState = DeviceSettings & {
  actions: {
    setMode: (mode: Mode) => void
    setTextSize: (textSize: TextSize) => void
    setChatWidth: (chatWidth: ChatWidth) => void
    /** Turns one rich text feature on or off; the others keep their value. */
    setRichText: (feature: RichTextFeature, on: boolean) => void
    setChatDefaults: (chat: Partial<ChatDefaults>) => void
    setPushPreview: (pushPreview: boolean) => void
    /** Moves `page` one place up (-1) or down (1) in the nav order. */
    moveNavPage: (page: BarPage, by: -1 | 1) => void
    /**
     * Shows or hides `page`. Refused, with the reason, when it would hide
     * `current` (the page on screen) or leave no shown page besides Home.
     */
    setNavPageVisible: (page: NavPage, visible: boolean, current: NavPage | undefined) => NavProblem | undefined
    /** Puts every setting back to its default. */
    reset: () => void
  }
}

const useSettingsStore = createAppStore<SettingsState>('settings', (set, get) => ({
  ...defaultSettings,
  actions: {
    setMode: (mode) => {
      set({ mode }, undefined, 'settings/setMode')
    },
    setTextSize: (textSize) => {
      set({ textSize }, undefined, 'settings/setTextSize')
    },
    setChatWidth: (chatWidth) => {
      set({ chatWidth }, undefined, 'settings/setChatWidth')
    },
    setRichText: (feature, on) => {
      set((s) => ({ richText: { ...s.richText, [feature]: on } }), undefined, 'settings/setRichText')
    },
    setChatDefaults: (chat) => {
      set((s) => ({ chat: { ...s.chat, ...chat } }), undefined, 'settings/setChatDefaults')
    },
    setPushPreview: (pushPreview) => {
      set({ pushPreview }, undefined, 'settings/setPushPreview')
    },
    moveNavPage: (page, by) => {
      set((s) => ({ nav: moveNavPage(s.nav, page, by) }), undefined, 'settings/moveNavPage')
    },
    setNavPageVisible: (page, visible, current) => {
      const next = setNavPageVisible(get().nav, page, visible, current)
      if (!next.ok) return next.error
      set({ nav: next.value }, undefined, 'settings/setNavPageVisible')
      return undefined
    },
    reset: () => {
      set(defaultSettings, undefined, 'settings/reset')
    },
  },
}))

/** The settings without the actions: what the key holds. */
function saved(s: DeviceSettings): DeviceSettings {
  return {
    mode: s.mode,
    textSize: s.textSize,
    chatWidth: s.chatWidth,
    richText: s.richText,
    nav: s.nav,
    chat: s.chat,
    pushPreview: s.pushPreview,
  }
}

export type SettingsStorageOptions = {
  /** This browser's localStorage; a getter, as reading `window.localStorage` itself throws when storage is blocked. */
  readonly storage: () => Pick<Storage, 'getItem' | 'setItem'>
  /** Gets each failed read or write, such as `(e) => report(e, 'handler')` (errors/reporter.ts). */
  readonly report: (error: unknown) => void
  /** Called with the settings after the load and after each change, such as to apply the mode. */
  readonly onChange?: ((settings: DeviceSettings) => void) | undefined
}

/**
 * Loads the settings saved on this device into the store and saves each
 * change after (main.ts, once). Storage that is blocked or full keeps the
 * settings in memory for this visit, and `report` gets the error; a saved
 * value that does not parse gives the defaults. Returns the stop.
 */
export function startSettingsStorage({ storage, report, onChange }: SettingsStorageOptions): () => void {
  let text: string | null = null
  try {
    text = storage().getItem(settingsKey)
  } catch (error) {
    report(error)
  }
  useSettingsStore.setState(parseStoredSettings(text))
  onChange?.(saved(useSettingsStore.getState()))
  return useSettingsStore.subscribe((s, before) => {
    if (
      s.mode === before.mode &&
      s.textSize === before.textSize &&
      s.chatWidth === before.chatWidth &&
      s.richText === before.richText &&
      s.nav === before.nav &&
      s.chat === before.chat &&
      s.pushPreview === before.pushPreview
    )
      return
    try {
      storage().setItem(settingsKey, JSON.stringify(saved(s)))
    } catch (error) {
      report(error)
    }
    onChange?.(saved(s))
  })
}

/** The colour mode: Light, Dark or System. @public */
export const useSettingsMode = (): Mode => useSettingsStore((s) => s.mode)
/** The text size. @public */
export const useSettingsTextSize = (): TextSize => useSettingsStore((s) => s.textSize)
/** How wide the Workspaces chats draw on the tablet and the desktop. @public */
export const useSettingsChatWidth = (): ChatWidth => useSettingsStore((s) => s.chatWidth)
/** Which rich text features a message draws; the object changes only with setRichText. @public */
export const useSettingsRichText = (): RichTextFeatures => useSettingsStore((s) => s.richText)
/** The nav order with each page's visibility (d-038). @public */
export const useSettingsNav = (): readonly NavEntry[] => useSettingsStore((s) => s.nav)
/** The new chat defaults; saved on this device, which chats do not use yet. @public */
export const useSettingsChatDefaults = (): ChatDefaults => useSettingsStore((s) => s.chat)
/** Whether a push to this browser shows a preview line. @public */
export const useSettingsPushPreview = (): boolean => useSettingsStore((s) => s.pushPreview)
/** The preview choice now, for the app's start (app/push/startPush.ts), which runs outside React. */
export const readPushPreview = (): boolean => useSettingsStore.getState().pushPreview
/** The settings actions; a stable reference. @public */
export const useSettingsActions = (): SettingsState['actions'] => useSettingsStore((s) => s.actions)

/**
 * The shown nav pages in order, for a page entry to pass to its screen. The
 * nav array changes only with a nav action, so the list is made once per
 * change.
 */
export function useVisibleNavPages(): readonly BarPage[] {
  return visibleFor(useSettingsNav())
}

const visibleCache = new WeakMap<readonly NavEntry[], readonly BarPage[]>()
function visibleFor(nav: readonly NavEntry[]): readonly BarPage[] {
  const known = visibleCache.get(nav)
  if (known !== undefined) return known
  const visible = visibleNavPages(nav)
  visibleCache.set(nav, visible)
  return visible
}

/** The store itself, for tests only: `settingsStore.getState()`. */
export const settingsStore = useSettingsStore
