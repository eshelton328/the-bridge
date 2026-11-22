import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { OpenArtifactLink } from './OpenArtifactLink.tsx'

// A made-up artifact address; no real link.
const href = 'https://claude.ai/artifact/00000000-0000-0000-0000-000000000000'

const meta = {
  title: 'Pages/Artifacts/Blocks/OpenArtifactLink',
  component: OpenArtifactLink,
} satisfies Meta<typeof OpenArtifactLink>

export default meta
type Story = StoryObj<typeof meta>

// T2 405:467, M2 406:407: Open artifact is a link to the https address that opens a new tab, with no opener.
export const Default: Story = {
  args: { href, size: 'xl' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Open artifact' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  },
}

// Only an https address is a link: a plain http one renders nothing.
export const PlainHttp: Story = {
  args: { href: 'http://claude.ai/artifact/00000000-0000-0000-0000-000000000000' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link')).toBeNull()
    await expect(canvas.queryByText('Open artifact')).toBeNull()
  },
}

// Nor does a script address.
export const ScriptAddress: Story = {
  args: { href: 'javascript:void(0)' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link')).toBeNull()
  },
}
