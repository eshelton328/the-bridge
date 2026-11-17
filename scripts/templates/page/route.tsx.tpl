// /{{page}}: the {{Title}} page. A thin route; everything comes from pages/{{page}}.
import { createFileRoute } from '@tanstack/react-router'
import { {{Page}}Page, {{page}}Search, load{{Page}}State } from '../pages/{{page}}/index.ts'

export const Route = createFileRoute('/{{page}}')({
  validateSearch: {{page}}Search,
  loaderDeps: ({ search }) => ({ state: search.state }),
  loader: ({ deps }) => load{{Page}}State(deps.state),
  component: {{Page}}Page,
})
