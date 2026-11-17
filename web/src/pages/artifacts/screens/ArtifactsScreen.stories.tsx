import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { artifactsStates } from '../states/index.ts'
import { ArtifactsScreen } from './ArtifactsScreen.tsx'

// One story per Figma state of the page (scripts/checkStates.ts checks the
// page's main screen). `pnpm new state <id> --page artifacts` adds one there.
const meta = {
  title: 'Pages/Artifacts/ArtifactsScreen',
  component: ArtifactsScreen,
} satisfies Meta<typeof ArtifactsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Library: Story = {
  name: 'D1: The Artifacts page before it is built',
  args: { data: artifactsStates.library.data, ui: artifactsStates.library.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
  },
}
