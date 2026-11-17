import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { artifactsStates } from '../states/index.ts'
import { ArtifactsScreen } from './ArtifactsScreen.tsx'

// One story per Figma state of the Artifacts page, named after its state
// file (scripts/checkStates.ts checks it). Each play test checks the
// state's own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Artifacts/ArtifactsScreen',
  component: ArtifactsScreen,
} satisfies Meta<typeof ArtifactsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Library: Story = {
  name: 'D1: the library, newest first',
  args: { data: artifactsStates.library.data, ui: artifactsStates.library.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Artifacts' })).toBeVisible()
    await expect(canvas.getByText('Checked Claude and Codex 2m ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Found since you last looked/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(canvas.getByRole('heading', { level: 3, name: 'Skill eval pass rates' })).toBeVisible()
    await expect(canvas.getAllByText('New', { selector: '.badge__root, .badge__root *' })).toHaveLength(4)
  },
}

export const ArtifactOpen: Story = {
  name: 'D2: an artifact open beside the list',
  args: { data: artifactsStates.artifactOpen.data, ui: artifactsStates.artifactOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Skill eval pass rates' })).toBeVisible()
    await expect(canvas.getByText('found 12m ago by the Artifact hook')).toBeVisible()
    await expect(canvas.getByText('Published from chat quiet-nebula')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open artifact' })).toBeVisible()
    await expect(canvas.getByText('Skill eval pass rates', { selector: '.list-row__title' })).toBeVisible()
  },
}
