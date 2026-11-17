import type { Decorator, Preview } from '@storybook/react-vite'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../src/index.css'
import './preview.css'
import { resetAllStores } from '../src/state/resetStores.ts'
import { resetRetries } from '../src/errors/retryGuard.ts'

// The library's theme and mode, as the app sets them in index.html:
// Panda reads `data-panda-theme` and the `dark` class.
const withThemeAndMode: Decorator = (Story, { globals }) => {
  const root = document.documentElement
  root.classList.toggle('dark', globals.mode !== 'light')
  root.dataset.pandaTheme = 'viewscreen'
  return Story()
}

// The Figma frame sizes of the three devices. A story picks its device
// with `globals: { viewport: { value: 'desktop' } }`, from its state's
// frame; the toolbar's viewport menu switches it by hand, and a link can
// pick one with `&globals=viewport.value:phone`.
const viewports = {
  desktop: { name: 'Desktop (Figma 1512 × 982)', styles: { width: '1512px', height: '982px' }, type: 'desktop' },
  tablet: { name: 'Tablet (Figma 756 × 1158)', styles: { width: '756px', height: '1158px' }, type: 'tablet' },
  phone: { name: 'iPhone 14 (390 × 844)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
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
  initialGlobals: { mode: 'dark' },
  parameters: {
    // An accessibility violation fails the story test.
    a11y: { test: 'error' },
    layout: 'fullscreen',
    viewport: { options: viewports },
    // Pages first, so Storybook opens on a screen, not on the error
    // boundary demos (Errors/*), which crash on purpose.
    options: { storySort: { order: ['Pages', '*', 'Errors'] } },
  },
}

export default preview
