import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ProjectCard } from '../types.ts'
import { ProjectCardView, type ProjectCardViewProps } from './ProjectCardView.tsx'

// D10's NCC-1701 (pinned) and Pinpoint, and its menu words.
const ncc: ProjectCard = { slug: 'ncc-1701', name: 'NCC-1701', purpose: 'The workspace.', icon: null, pinned: true }
const pinpoint: ProjectCard = {
  slug: 'pinpoint',
  name: 'Pinpoint',
  purpose: 'A Chrome extension.',
  icon: null,
  pinned: false,
}
const words = { label: 'Actions for {name}', pin: 'Pin to top', unpin: 'Unpin', edit: 'Edit details' }

/** The card with its menu open state kept here, as the page entry keeps it. */
function Kept(props: Omit<ProjectCardViewProps, 'menuOpen' | 'onMenuOpenChange'>) {
  const [open, setOpen] = useState(false)
  return <ProjectCardView {...props} menuOpen={open} onMenuOpenChange={setOpen} />
}

const meta = {
  title: 'Pages/Projects/Blocks/ProjectCardView',
  component: Kept,
  args: { words, layout: 'desktop', onPin: fn() },
} satisfies Meta<typeof Kept>

export default meta
type Story = StoryObj<typeof meta>

// D10 Pinpoint: the letter tile, no pin; ⋯ then Pin to top asks to pin it.
export const Unpinned: Story = {
  args: { project: pinpoint },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvas.getByText('P', { exact: true })).toBeVisible()
    await expect(canvas.queryByText('Pinned')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for Pinpoint' }))
    const body = within(canvasElement.ownerDocument.body)
    await expect(body.getByRole('menuitem', { name: 'Edit details' })).toBeVisible()
    await userEvent.click(body.getByRole('menuitem', { name: 'Pin to top' }))
    await expect(args.onPin).toHaveBeenCalledWith('pinpoint', true)
  },
}

// D10 NCC-1701: pinned, so the menu offers Unpin; Edit details does nothing yet (increment four).
export const Pinned: Story = {
  args: { project: ncc },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvas.getByText('Pinned')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for NCC-1701' }))
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('menuitem', { name: 'Edit details' }))
    await expect(args.onPin).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for NCC-1701' }))
    await userEvent.click(body.getByRole('menuitem', { name: 'Unpin' }))
    await expect(args.onPin).toHaveBeenCalledWith('ncc-1701', false)
  },
}

// A project whose owner set a library icon draws the icon in place of its letter.
export const WithIcon: Story = {
  args: { project: { ...pinpoint, icon: 'compass' } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('P', { exact: true })).toBeNull()
  },
}
