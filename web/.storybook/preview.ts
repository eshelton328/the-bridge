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
    // Pages first, so Storybook opens on a screen, not on the error
    // boundary demos (Errors/*), which crash on purpose.
    options: { storySort: { order: ['Pages', '*', 'Errors'] } },
  },
}

export default preview
