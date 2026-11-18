import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { {{page}}States } from '../states/index.ts'
import { {{Name}} } from './{{Name}}.tsx'

// One story per Figma state of the page (scripts/checkStates.ts checks the
// page's main screen). `pnpm new state <id> --page {{page}}` adds one there.
// A page's main screen holds its per-state stories under
// Pages/{{Title}}/States (screen review R10); a second screen has its own
// title. The side-by-side screens of states/screens.ts go under
// Pages/{{Title}}/Screens.
const meta = {
  title: '{{storiesTitle}}',
  component: {{Name}},
} satisfies Meta<typeof {{Name}}>

export default meta
type Story = StoryObj<typeof meta>
{{stories}}
