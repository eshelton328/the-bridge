import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settingsStates } from '../states/index.ts'
import { SettingsScreen } from './SettingsScreen.tsx'

// One story per state of the page (scripts/checkStates.ts). Each state is a
// PNG reference in references/settings/ (d-119): the fidelity tools render
// its story at the reference's size and mode. A Light state's colours come
// from the story's `mode` global, as the app's come from the html class.
// A story renders at the test runner's width, so the tablet and phone states
// check no bar here; app/SettingsRoute.test.tsx checks More at 390 and 744.
const meta = {
  title: 'Pages/Settings/States',
  component: SettingsScreen,
} satisfies Meta<typeof SettingsScreen>

export default meta
type Story = StoryObj<typeof meta>
type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas']

/** What every state shows: the title, the five sections, Text size on and every rich text switch on. */
async function expectSections(canvas: Canvas) {
  await expect(canvas.getByRole('heading', { name: 'Settings' })).toBeVisible()
  // Each section's title; Notifications is also the switch's label, so the title is the first match.
  for (const section of ['Appearance', 'Rich text', 'Navigation', 'Notifications', 'New chat defaults'])
    await expect(canvas.getAllByText(section, { exact: true })[0]).toBeVisible()
  await expect(canvas.getByText('Scales the text of the whole app. Small is the size of the designs.')).toBeVisible()
  await expect(canvas.getByRole('radio', { name: 'Large' })).toBeEnabled()
  await expect(canvas.getByRole('switch', { name: 'Notifications' })).not.toBeChecked()
  await expect(canvas.getByText('Off shows the plain Markdown. No text is hidden.')).toBeVisible()
  for (const feature of ['Callouts', 'Code highlighting', 'Chat links', 'Mermaid diagrams', 'Math', 'Images'])
    await expect(canvas.getByRole('switch', { name: feature })).toBeChecked()
  await expect(canvas.getByRole('switch', { name: 'Chat links' })).toHaveAccessibleDescription(
    'Chat bubbles in messages',
  )
}

export const SettingsDesktop: Story = {
  name: 'D1: Settings on the desktop, Dark, the gear selected',
  args: { data: settingsStates.settingsDesktop.data, ui: settingsStates.settingsDesktop.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked()
    await expect(canvas.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
  },
}

export const SettingsDesktopLight: Story = {
  name: 'D2: Settings on the desktop with Mode set to Light',
  args: {
    data: settingsStates.settingsDesktopLight.data,
    ui: settingsStates.settingsDesktopLight.ui,
    viewport: 'desktop',
  },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeChecked()
    await expect(canvas.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
  },
}

export const SettingsTablet: Story = {
  name: 'T1: Settings on an iPad in portrait, More selected',
  args: { data: settingsStates.settingsTablet.data, ui: settingsStates.settingsTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked()
  },
}

export const SettingsTabletLight: Story = {
  name: 'T2: Settings on an iPad in portrait, Light',
  args: {
    data: settingsStates.settingsTabletLight.data,
    ui: settingsStates.settingsTabletLight.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeChecked()
  },
}

export const SettingsTabletWide: Story = {
  name: 'T3: Settings on an iPad in landscape keeps the tablet layout',
  args: { data: settingsStates.settingsTabletWide.data, ui: settingsStates.settingsTabletWide.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked()
  },
}

export const SettingsTabletWideLight: Story = {
  name: 'T4: Settings on an iPad in landscape, Light',
  args: {
    data: settingsStates.settingsTabletWideLight.data,
    ui: settingsStates.settingsTabletWideLight.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeChecked()
  },
}

export const SettingsPhone: Story = {
  name: 'M1: Settings on the phone, More selected',
  args: { data: settingsStates.settingsPhone.data, ui: settingsStates.settingsPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked()
  },
}

export const SettingsPhoneLight: Story = {
  name: 'M2: Settings on the phone, Light',
  args: { data: settingsStates.settingsPhoneLight.data, ui: settingsStates.settingsPhoneLight.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    await expectSections(canvas)
    await expect(canvas.getByRole('radio', { name: 'Light' })).toBeChecked()
  },
}

export const MoreDrawer: Story = {
  name: 'M3: the More drawer over Settings, Settings selected after Artifacts and Toolkit',
  args: { data: settingsStates.moreDrawer.data, ui: settingsStates.moreDrawer.ui, viewport: 'phone' },
  play: async () => {
    // The drawer renders in a portal, outside the story's canvas.
    const drawer = await within(document.body).findByRole('dialog', { name: 'More' })
    await expect(within(drawer).getByRole('button', { name: /Settings/ })).toHaveAttribute('aria-current', 'page')
    await expect(within(drawer).getByText('Appearance, navigation and chat defaults')).toBeVisible()
    await expect(within(drawer).getByRole('button', { name: /Toolkit/ })).toBeEnabled()
    await expect(within(drawer).getByRole('button', { name: /Brain/ })).toBeDisabled()
    // The Notifications switch is on the Settings page now, not in the drawer (d-119).
    await expect(within(drawer).queryByRole('switch', { name: 'Notifications' })).toBeNull()
  },
}
