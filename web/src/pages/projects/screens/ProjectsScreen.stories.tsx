import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { projectsStates } from '../states/index.ts'
import { ProjectsScreen } from './ProjectsScreen.tsx'

// One story per state of the page (scripts/checkStates.ts). Each state is a
// PNG reference in references/projects/ (d-133): the fidelity tools render
// its story at the reference's size and mode. A story renders at the test
// runner's width, so these check the cards and the menu, not the bars;
// app/ProjectsHome.test.tsx checks the home at each width, with Projects selected.
const meta = {
  title: 'Pages/Projects/States',
  component: ProjectsScreen,
} satisfies Meta<typeof ProjectsScreen>

export default meta
type Story = StoryObj<typeof meta>
type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas']

/** What every state shows: the title with the count, New project, and the three cards in order, NCC-1701 pinned. */
async function expectHome(canvas: Canvas) {
  await expect(canvas.getByRole('heading', { name: /^Projects/ })).toBeVisible()
  await expect(canvas.getByText('3', { exact: true })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'New project' })).toBeVisible()
  const cards = canvas.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
  await expect(cards).toEqual(['NCC-1701', 'Pinpoint', 'omni'])
  await expect(canvas.getByText('Pinned')).toBeVisible()
  await expect(canvas.getByText(/^A Chrome extension that pins comments/)).toBeVisible()
}

export const MenuOpen: Story = {
  name: 'D10: The Projects home on the desktop with the Pinpoint menu open',
  args: { data: projectsStates.menuOpen.data, ui: projectsStates.menuOpen.ui, viewport: 'desktop' },
  play: async ({ canvas, canvasElement }) => {
    await expectHome(canvas)
    const menu = within(canvasElement.ownerDocument.body).getByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: 'Pin to top' })).toBeVisible()
    await expect(within(menu).getByRole('menuitem', { name: 'Edit details' })).toBeVisible()
  },
}

export const ProjectsTablet: Story = {
  name: 'T10: The Projects home on an iPad in portrait',
  args: { data: projectsStates.projectsTablet.data, ui: projectsStates.projectsTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expectHome(canvas)
    await expect(canvas.queryByRole('menu')).toBeNull()
  },
}

export const ProjectsTabletWide: Story = {
  name: 'T10b: The Projects home on an iPad in landscape',
  args: {
    data: projectsStates.projectsTabletWide.data,
    ui: projectsStates.projectsTabletWide.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas, canvasElement }) => {
    await expectHome(canvas)
    await expect(canvas.queryByRole('menu')).toBeNull()
    // In landscape the header starts 24 down, as T10b draws it; in portrait (T10) 40.
    const home = canvasElement.querySelector('[data-figma="header"]')?.parentElement
    await expect(home === null || home === undefined ? '' : getComputedStyle(home).paddingTop).toBe('24px')
  },
}
