// The Settings page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import { settingsStates } from './states/index.ts'
import { SettingsState, type SettingsData, type SettingsUi } from './types.ts'

export const settingsPage = {
  id: 'settings',
  title: 'Settings',
  schema: SettingsState,
  states: settingsStates,
  render: (state, viewport) => createElement(SettingsScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<SettingsData, SettingsUi, keyof typeof settingsStates>
