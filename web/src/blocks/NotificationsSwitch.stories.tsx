import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import type { PushSwitch } from '../lib/pushSwitch.ts'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

// The Notifications switch of d-118 in each state, inline as the phone's More drawer draws it and stacked as the
// desktop rail does. Figma has no such switch; each frame with the drawer or the rail records it as a deviation.

const push = (change: Partial<PushSwitch>): PushSwitch => ({
  state: 'off',
  busy: false,
  failed: false,
  onCheckedChange: fn(),
  ...change,
})

const meta = {
  title: 'Blocks/Notifications switch',
  component: NotificationsSwitch,
  args: { push: push({}), layout: 'inline' },
} satisfies Meta<typeof NotificationsSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Notifications' })
    await expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    await expect(args.push.onCheckedChange).toHaveBeenCalledWith(true)
  },
}

export const On: Story = {
  args: { push: push({ state: 'on' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeChecked()
  },
}

export const Denied: Story = {
  args: { push: push({ state: 'denied' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Blocked in Settings')).toBeVisible()
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeDisabled()
  },
}

export const SafariTab: Story = {
  args: { push: push({ state: 'homeScreen' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Add The Bridge to the Home Screen to get notifications')).toBeVisible()
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeDisabled()
  },
}

export const Failed: Story = {
  args: { push: push({ failed: true }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Not turned on. Try again.')).toBeVisible()
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeEnabled()
  },
}

export const Busy: Story = {
  args: { push: push({ busy: true }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeDisabled()
  },
}

export const RailOn: Story = {
  args: { push: push({ state: 'on' }), layout: 'stacked' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch', { name: 'Notifications' })).toBeChecked()
  },
}

export const RailDenied: Story = {
  args: { push: push({ state: 'denied' }), layout: 'stacked' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Blocked in Settings')).toBeVisible()
  },
}
