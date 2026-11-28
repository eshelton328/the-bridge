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

export const ProjectsPhone: Story = {
  name: 'M10: The Projects home on the phone',
  args: { data: projectsStates.projectsPhone.data, ui: projectsStates.projectsPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    await expectHome(canvas)
    await expect(canvas.getByRole('button', { name: 'Actions for omni' })).toBeInTheDocument()
  },
}

/** What a project's page shows (R4): Back to Projects, the name, Quick chat and the tabs Overview, Repositories and Ideas. */
async function expectProject(canvas: Canvas) {
  await expect(canvas.getByRole('button', { name: 'Back to Projects' })).toBeVisible()
  await expect(canvas.getByRole('heading', { level: 1, name: 'NCC-1701' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Quick chat' })).toBeVisible()
  await expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Overview', 'Repositories', 'Ideas'])
  await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
}

export const ProjectOverview: Story = {
  name: "D01: NCC-1701's page on the desktop, on its Overview tab",
  args: { data: projectsStates.projectOverview.data, ui: projectsStates.projectOverview.ui, viewport: 'desktop' },
  play: async ({ canvas, canvasElement }) => {
    await expectProject(canvas)
    // The panels sit in the Overview tab's panel, and each Inbox row's kind tile is named.
    const panelId = canvas.getByRole('tab', { name: 'Overview' }).getAttribute('aria-controls')
    await expect(panelId).toBeTruthy()
    const named = canvasElement.ownerDocument.getElementById(panelId ?? '')
    await expect(named).not.toBeNull()
    if (named === null) return
    const panel = within(named)
    await expect(panel.getByRole('heading', { level: 2, name: /^Inbox/ })).toBeVisible()
    await expect(panel.getByRole('heading', { level: 2, name: /^Queue/ })).toBeVisible()
    for (const kind of ['Question', 'Action', 'Review']) {
      await expect(panel.getByRole('img', { name: kind })).toBeVisible()
    }
  },
}

export const ProjectOverviewTablet: Story = {
  name: "T01: NCC-1701's page on an iPad in portrait, on its Overview tab",
  args: {
    data: projectsStates.projectOverviewTablet.data,
    ui: projectsStates.projectOverviewTablet.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas }) => {
    await expectProject(canvas)
  },
}

export const ProjectOverviewTabletWide: Story = {
  name: "T01b: NCC-1701's page on an iPad in landscape, on its Overview tab",
  args: {
    data: projectsStates.projectOverviewTabletWide.data,
    ui: projectsStates.projectOverviewTabletWide.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas }) => {
    await expectProject(canvas)
  },
}

export const ProjectOverviewPhone: Story = {
  name: "M01: NCC-1701's page on the phone, on its Overview tab",
  args: {
    data: projectsStates.projectOverviewPhone.data,
    ui: projectsStates.projectOverviewPhone.ui,
    viewport: 'phone',
  },
  play: async ({ canvas }) => {
    await expectProject(canvas)
  },
}
