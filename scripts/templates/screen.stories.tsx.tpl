import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { {{page}}States } from '../states/index.ts'
import { {{Name}} } from './{{Name}}.tsx'

// One story per Figma state of the page (scripts/checkStates.ts checks the
// page's main screen). `pnpm new state <id> --page {{page}}` adds one there.
const meta = {
  title: 'Pages/{{Title}}/{{Name}}',
  component: {{Name}},
} satisfies Meta<typeof {{Name}}>

export default meta
type Story = StoryObj<typeof meta>
{{stories}}
