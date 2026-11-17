import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { {{Name}} } from './{{Name}}.tsx'

const meta = {
  title: '{{storyGroup}}/{{Name}}',
  component: {{Name}},
} satisfies Meta<typeof {{Name}}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'TODO: Figma copy' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('TODO: Figma copy')).toBeVisible()
  },
}
