// /settings: the Settings page. A thin route; everything comes from pages/settings.
import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage, settingsSearch, loadSettingsState } from '../pages/settings/index.ts'

export const Route = createFileRoute('/settings')({
  validateSearch: settingsSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadSettingsState(deps.state, deps.source),
  component: SettingsPage,
})
