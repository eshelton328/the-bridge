// The Settings route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts). The page reads no server: the
// entry puts the settings saved on this device over the state's (d-119).
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { settingsHome } from './home.ts'
import { settingsStates } from './states/index.ts'
import { SettingsState, type SettingsData, type SettingsUi } from './types.ts'

export function loadSettingsState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<SettingsData, SettingsUi> {
  const read = readState<ScreenState<SettingsData, SettingsUi>>(
    settingsStates,
    { state: requested, source },
    { key: 'home', state: settingsHome },
  )
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(SettingsState, read.value.state, `settings/${read.value.key}`)
}
