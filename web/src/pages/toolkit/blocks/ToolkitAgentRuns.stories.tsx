import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ToolkitAgentRuns } from './ToolkitAgentRuns.tsx'

const meta = {
  title: 'Pages/Toolkit/Blocks/ToolkitAgentRuns',
  component: ToolkitAgentRuns,
} satisfies Meta<typeof ToolkitAgentRuns>

export default meta
type Story = StoryObj<typeof meta>

// D7 433:526: writing-reviewer's four cards.
export const Default: Story = {
  args: {
    runs: {
      label: 'How it runs',
      facts: [
        { icon: 'model', label: 'Claude', value: 'opus', caption: 'model' },
        { icon: 'model', label: 'Codex', value: 'effort high', caption: 'codex_effort; default model' },
        { icon: 'tools', label: 'Tools', value: 'Bash, Read, Grep, Glob', caption: 'no Write or Edit' },
        { icon: 'context', label: 'Context', value: 'Its own', caption: 'gets only what the task hands it' },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'How it runs' })).toBeVisible()
    await expect(canvas.getByText('Bash, Read, Grep, Glob')).toBeVisible()
    await expect(canvas.getByText('gets only what the task hands it')).toBeVisible()
  },
}

// D9 433:1538: the hook commit-msg's four cards, its state as a badge and its captions in small text.
export const Hook: Story = {
  args: {
    kind: 'hook',
    runs: {
      label: 'When it runs',
      facts: [
        { icon: 'event', label: 'Event', value: 'commit-msg', caption: 'git runs it on every commit' },
        {
          icon: 'state',
          label: 'State',
          value: 'Enabled',
          status: 'on',
          caption: 'core.hooksPath = toolkit/hooks, set by link.sh',
        },
        {
          icon: 'rule',
          label: 'Enforces',
          value: 'commits-and-prs.md',
          caption: 'change the rule and the hook together',
        },
        { icon: 'test', label: 'Test', value: 'test-commit-msg', caption: 'runs the rule’s ✗ and ✓ examples' },
      ],
    },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { name: 'When it runs' })).toBeVisible()
    await expect(canvas.getByText('Enabled')).toBeVisible()
    await expect(canvasElement.querySelector('[data-figma="kind section · hook"]')).not.toBeNull()
    // A hook's captions are small text, not mono.
    const caption = canvas.getByText('git runs it on every commit')
    await expect(getComputedStyle(caption).fontFamily).not.toMatch(/Mono/)
  },
}
