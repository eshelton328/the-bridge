// Settings D1 (references/settings/D01, a PNG reference: lab a52ab2d4 +
// d-119; Settings has no Figma page): the page on the desktop in Dark, the
// default settings, with the rail's Settings gear selected. Its copy is the
// lab page's, word for word, except where a decision changed it: Text size's
// line names the new scale (d-122: Small is the designs' size), and the
// Notifications section is new (bridge-coord, 2026-11-23, from the owner's
// "maybe notifications should go in there too"). It holds what the other
// states share.
import { defaultSettings } from '../../../lib/deviceSettings.ts'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { SettingsData, SettingsUi } from '../types.ts'

export const settingsDesktop = {
  title: 'The Settings page on the desktop in Dark',
  frames: [{ id: 'D1', node: 'lab a52ab2d4', viewport: 'desktop' }],
  data: {
    // The lab page's rail draws no Inbox count.
    railBadge: 0,
    settings: { ...defaultSettings, nav: [...defaultSettings.nav] },
    push: { state: 'off', busy: false, failed: false },
  },
  ui: {},
} satisfies ScreenState<SettingsData, SettingsUi>
