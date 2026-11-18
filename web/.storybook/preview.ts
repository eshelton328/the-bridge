import type { Decorator, Preview } from '@storybook/react-vite'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../src/index.css'
import './preview.css'
import { resetAllStores } from '../src/state/resetStores.ts'
import { resetRetries } from '../src/errors/retryGuard.ts'
import { frameSizes } from '../src/lib/screenMap.ts'

// The library's theme and mode, as the app sets them in index.html:
// Panda reads `data-panda-theme` and the `dark` class.
const withThemeAndMode: Decorator = (Story, { globals }) => {
  const root = document.documentElement
  root.classList.toggle('dark', globals.mode !== 'light')
  root.dataset.pandaTheme = 'viewscreen'
  return Story()
}

// The Figma frame sizes of the three devices. Storybook opens at
// desktop, the size of most frames; the toolbar's viewport menu switches
// it, and a link can pick one with `&globals=viewport.value:phone`. A
// story must not set `globals.viewport`: that locks the menu and the link.
const px = (n: number) => `${String(n)}px`
const { desktop, tablet, phone } = frameSizes
export const viewports = {
  desktop: {
    name: `Desktop (Figma ${String(desktop.width)} × ${String(desktop.height)})`,
    styles: { width: px(desktop.width), height: px(desktop.height) },
    type: 'desktop',
  },
  tablet: {
    name: `Tablet (Figma ${String(tablet.width)} × ${String(tablet.height)})`,
    styles: { width: px(tablet.width), height: px(tablet.height) },
    type: 'tablet',
  },
  phone: {
    name: `iPhone 14 (${String(phone.width)} × ${String(phone.height)})`,
    styles: { width: px(phone.width), height: px(phone.height) },
    type: 'mobile',
  },
} as const

const preview: Preview = {
  decorators: [withThemeAndMode],
  beforeEach: () => {
    resetAllStores()
    resetRetries()
  },
  globalTypes: {
    mode: {
      description: 'Mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: ['dark', 'light'], dynamicTitle: true },
    },
  },
  initialGlobals: { mode: 'dark', viewport: { value: 'desktop', isRotated: false } },
  parameters: {
    // An accessibility violation fails the story test.
    a11y: { test: 'error' },
    layout: 'fullscreen',
    viewport: { options: viewports },
    // Pages first, so Storybook opens on a screen, not on the error
    // boundary demos (Errors/*), which crash on purpose. In each page the
    // side-by-side Screens come first, then the per-state States, then
    // the page's Blocks (screen review R10).
    options: { storySort: { order: ['Pages', ['*', ['Screens', 'States', 'Blocks']], '*', 'Errors'] } },
  },
}

export default preview
