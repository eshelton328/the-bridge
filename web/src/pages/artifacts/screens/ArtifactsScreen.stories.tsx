import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { expectTrapFocus } from '../../../lib/focusTrap.ts'
import { artifactsStates } from '../states/index.ts'
import { ArtifactsScreen } from './ArtifactsScreen.tsx'

// One story per Figma state of the Artifacts page, named after its state
// file (scripts/checkStates.ts checks it). Each play test checks the
// state's own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Artifacts/States',
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
    // R40: Open artifact is a link to the artifact's https address in a new tab.
    const open = canvas.getByRole('link', { name: 'Open artifact' })
    await expect(open).toBeVisible()
    await expect(open).toHaveAttribute('href', 'https://claude.ai/artifact/8f3c2a91-skill-evals')
    await expect(open).toHaveAttribute('target', '_blank')
    await expect(canvas.getByText('Skill eval pass rates', { selector: '.list-row__title' })).toBeVisible()
  },
}

export const FilterOpen: Story = {
  name: 'D3: the Filter menu open over the library',
  args: { data: artifactsStates.filterOpen.data, ui: artifactsStates.filterOpen.ui, viewport: 'desktop' },
  play: async () => {
    // The menu is a popover outside the story's root.
    const page = within(document.body)
    await expect(await page.findByRole('dialog', { name: 'Filter the artifacts' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Claude artifacts' })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Codex sites' })).not.toBeChecked()
    await expect(page.getByText('Claude artifacts in ncc-1701')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show 7' })).toBeVisible()
  },
}

export const SearchList: Story = {
  name: 'D4: a search in the list view',
  args: { data: artifactsStates.searchList.data, ui: artifactsStates.searchList.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /3 matches for “eval”/i })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('in title')).toBeVisible()
    await expect(canvas.getByText('in description')).toBeVisible()
    await expect(canvas.getByText('in link')).toBeVisible()
    await expect(canvas.getAllByText('eval', { selector: 'mark' })).toHaveLength(3)
    await expect(
      canvas.getByText(
        'Search reads titles, descriptions, projects and links. Filters and the source chips still apply.',
      ),
    ).toBeVisible()
    // Figma draws the search focused while the owner types (403:7799), and the state opens with the focus in it.
    await expect(canvas.getByRole('searchbox')).toHaveFocus()
  },
}

export const AddLink: Story = {
  name: 'D5: the Add a link dialog over the library',
  args: { data: artifactsStates.addLink.data, ui: artifactsStates.addLink.ui, viewport: 'desktop' },
  play: async () => {
    // The dialog is a portal outside the story's root.
    const page = within(document.body)
    await expect(await page.findByRole('dialog', { name: 'Add a link' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Link' })).toHaveValue('https://panda-tokens.example.com/playground')
    // The dialog's focus trap moves the focus to the link in the frame after it opens.
    await expectTrapFocus(page.getByRole('textbox', { name: 'Link' }))
    await expect(page.getByRole('radio', { name: 'Codex site' })).toBeChecked()
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Panda tokens playground')
    await expect(page.getByText('Read from the page’s <title>.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add artifact' })).toBeVisible()
  },
}

export const SortOpen: Story = {
  name: 'D6: the Sort menu open over the library',
  args: { data: artifactsStates.sortOpen.data, ui: artifactsStates.sortOpen.ui, viewport: 'desktop' },
  play: async () => {
    // The menu is a popover outside the story's root.
    const page = within(document.body)
    await expect(await page.findByRole('menuitemradio', { name: 'Newest first' })).toBeChecked()
    await expect(page.getByRole('menuitemradio', { name: 'Oldest first' })).not.toBeChecked()
    await expect(page.getByText('Least recently updated at the top')).toBeVisible()
    await expect(page.getByText('Found since you last looked stays at the top.')).toBeVisible()
  },
}

export const DiscussOpen: Story = {
  name: 'D7: the open artifact’s discussion beside it',
  args: { data: artifactsStates.discussOpen.data, ui: artifactsStates.discussOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Discuss this artifact' })).toBeVisible()
    await expect(canvas.getByText('Talk this artifact through')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Sort the bars by pass rate' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toHaveAttribute('aria-pressed', 'true')
    // The library list closes while the discussion is open.
    await expect(canvas.queryByText('Skill eval pass rates', { selector: '.list-row__title' })).toBeNull()
  },
}

export const ChangeProposed: Story = {
  name: 'D8: A proposed update to the artifact',
  args: { data: artifactsStates.changeProposed.data, ui: artifactsStates.changeProposed.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Bars sorted from the lowest pass rate to the highest')).toBeVisible()
    await expect(canvas.getByText('A dashed line at the median pass rate, 71%')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Apply' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Edit first' })).toBeVisible()
    // The empty state goes once the discussion has entries.
    await expect(canvas.queryByText('Talk this artifact through')).toBeNull()
  },
}

export const ChangeApplied: Story = {
  name: 'D9: The artifact after Apply',
  args: { data: artifactsStates.changeApplied.data, ui: artifactsStates.changeApplied.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('updated just now from the discussion')).toBeVisible()
    await expect(canvas.getByText('Updated', { selector: '.badge__root, .badge__root *' })).toBeVisible()
    await expect(
      canvas.getByText('Applied just now. Republished to the same link, claude.ai/artifact/8f3c2a91-skill-evals.'),
    ).toBeVisible()
    // The applied proposal shows the lines it put in, and no buttons.
    await expect(canvas.queryByText('Bars in the order of the method log')).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Apply' })).toBeNull()
  },
}

export const LibraryTablet: Story = {
  name: 'T1: the library on a tablet, in two columns',
  args: { data: artifactsStates.libraryTablet.data, ui: artifactsStates.libraryTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Artifacts' })).toBeVisible()
    await expect(canvas.getByRole('searchbox', { name: /Search artifacts/i })).toBeVisible()
    await expect(canvas.getByText('Viewscreen, Captain’s Log, Engineering and Console')).toBeInTheDocument()
  },
}

export const ArtifactTablet: Story = {
  name: 'T2: an artifact on its own page on a tablet',
  args: { data: artifactsStates.artifactTablet.data, ui: artifactsStates.artifactTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Skill eval pass rates' })).toBeVisible()
    // The story renders at the width Storybook gives it; app/ArtifactsStickyBars.test.tsx checks T2's Back bar.
    await expect(canvas.getByText('claude.ai/artifact/8f3c2a91-skill-evals')).toBeVisible()
  },
}

export const FilterTablet: Story = {
  name: 'T3: the Filter sheet open over the library on a tablet',
  args: { data: artifactsStates.filterTablet.data, ui: artifactsStates.filterTablet.ui, viewport: 'tablet' },
  play: async () => {
    // The menu is portalled outside the story's root: a sheet at the tablet's width, a popover at a wider one
    // (the story renders at the width Storybook gives it; app/ArtifactsRoute.test.tsx checks the tablet's sheet).
    const menu = within(await within(document.body).findByRole('dialog', { name: /^Filter/ }))
    await expect(menu.getByRole('button', { name: 'Show 7 artifacts' })).toBeVisible()
    await expect(menu.getByRole('checkbox', { name: 'Claude artifacts' })).toBeChecked()
    await expect(menu.getByRole('checkbox', { name: 'Codex sites' })).not.toBeChecked()
  },
}

export const DiscussTablet: Story = {
  name: 'T4: the open artifact’s discussion on its own page on a tablet',
  args: { data: artifactsStates.discussTablet.data, ui: artifactsStates.discussTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    // The story renders at the width Storybook gives it: the tablet's page or the desktop's panel.
    // app/ArtifactsStickyBars.test.tsx checks T4's page at the tablet's width.
    await expect(canvas.getByText('Talk this artifact through')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Why did readme drop?' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Ask about this artifact' })).toBeVisible()
    await expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '46')
  },
}

export const ChangeProposedTablet: Story = {
  name: 'T5: a proposed update in the discussion page on a tablet',
  args: {
    data: artifactsStates.changeProposedTablet.data,
    ui: artifactsStates.changeProposedTablet.ui,
    viewport: 'tablet',
  },
  play: async ({ canvas, canvasElement }) => {
    // The story renders at the width Storybook gives it: the tablet's page or the desktop's panel.
    // app/ArtifactsStickyBars.test.tsx checks T5's page at the tablet's width, and that Apply shows T2 Updated.
    await expect(canvas.getByText('A dashed line at the median pass rate, 71%')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Apply' })).toBeVisible()
    await expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '48')
    // T5's own node id of its one Open in workspace.
    await expect(canvasElement.querySelector('[data-figma="452:3978"]')).not.toBeNull()
  },
}

export const LibraryPhone: Story = {
  name: 'M1: the library on a phone, as a list with small previews',
  args: { data: artifactsStates.libraryPhone.data, ui: artifactsStates.libraryPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The story renders at the width Storybook gives it; pnpm fidelity checks M1's list at the phone's width.
    await expect(canvas.getByRole('heading', { level: 1, name: 'Artifacts' })).toBeVisible()
    await expect(canvas.getByRole('searchbox', { name: /Search artifacts/i })).toBeVisible()
    await expect(canvas.getByText('Brain map prototype')).toBeInTheDocument()
    await expect(canvas.queryByText('Type safety in agentic systems')).toBeNull()
  },
}

export const ArtifactPhone: Story = {
  name: 'M2: an artifact on its own page on a phone',
  args: { data: artifactsStates.artifactPhone.data, ui: artifactsStates.artifactPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The story renders at the width Storybook gives it: the phone's page or the desktop's detail.
    // app/ArtifactsStickyBars.test.tsx checks M2's Back bar at the phone's width.
    await expect(canvas.getByRole('heading', { level: 2, name: 'Skill eval pass rates' })).toBeVisible()
    await expect(canvas.getByText('Chat quiet-nebula')).toBeVisible()
  },
}

export const FilterPhone: Story = {
  name: 'M3: the Filter sheet open over the library on a phone',
  args: { data: artifactsStates.filterPhone.data, ui: artifactsStates.filterPhone.ui, viewport: 'phone' },
  play: async () => {
    // The menu is portalled outside the story's root: a sheet at the phone's width, a popover at a wider one
    // (the story renders at the width Storybook gives it; pnpm fidelity checks M3's sheet at the phone's width).
    const menu = within(await within(document.body).findByRole('dialog', { name: /^Filter/ }))
    await expect(menu.getByRole('button', { name: 'Show 7 artifacts' })).toBeVisible()
    await expect(menu.getByRole('checkbox', { name: 'ncc-1701' })).toBeChecked()
    await expect(menu.getByRole('checkbox', { name: 'omni' })).not.toBeChecked()
  },
}

export const SortPhone: Story = {
  name: 'M4: the Sort sheet open over the library on a phone',
  args: { data: artifactsStates.sortPhone.data, ui: artifactsStates.sortPhone.ui, viewport: 'phone' },
  play: async () => {
    // The menu is portalled outside the story's root: a sheet at the phone's width, a popover at a wider one
    // (the story renders at the width Storybook gives it; pnpm fidelity checks M4's sheet at the phone's width).
    const page = within(document.body)
    await expect(await page.findByText('Grouped by project, then newest')).toBeVisible()
    await expect(page.getByText('Least recently updated at the top')).toBeVisible()
    await expect(page.getByText('Found since you last looked stays at the top.')).toBeVisible()
  },
}

export const SearchPhone: Story = {
  name: 'M5: a search on a phone, each match with the line that matched',
  args: { data: artifactsStates.searchPhone.data, ui: artifactsStates.searchPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The story renders at the width Storybook gives it; pnpm fidelity checks M5's rows at the phone's width.
    await expect(canvas.getByText('Writer cross-family round x1')).toBeVisible()
    // Figma draws the search focused (its cyan border), with the keyboard open, and the state opens with the focus in it.
    await expect(canvas.getByRole('searchbox', { name: /Search artifacts/i })).toHaveFocus()
  },
}

export const AddLinkPhone: Story = {
  name: 'M6: the Add a link sheet open over the library on a phone',
  args: { data: artifactsStates.addLinkPhone.data, ui: artifactsStates.addLinkPhone.ui, viewport: 'phone' },
  play: async () => {
    // The form is portalled outside the story's root: a sheet at the phone's width, a dialog at a wider one (the story
    // renders at the width Storybook gives it; pnpm fidelity checks M6's sheet at the phone's width).
    const page = within(document.body)
    const form = within(await page.findByRole('dialog', { name: 'Add a link' }))
    await expect(form.getByText('For an artifact the library did not find.')).toBeVisible()
    await expect(form.getByRole('button', { name: /^Add$/ })).toBeVisible()
    await expect(form.getByRole('radio', { name: 'Codex site' })).toBeChecked()
    await expect(form.queryByText('Chosen from the link; change it if it is wrong.')).toBeNull()
    // The focus trap moves the focus to the link in the frame after it opens.
    await expectTrapFocus(form.getByRole('textbox', { name: 'Link' }))
  },
}

export const FilePhone: Story = {
  name: 'M7: File in a project open over an artifact on a phone',
  args: { data: artifactsStates.filePhone.data, ui: artifactsStates.filePhone.ui, viewport: 'phone' },
  play: async () => {
    // The sheet is portalled outside the story's root. It opens over the artifact at any width (the story renders at
    // the width Storybook gives it; pnpm fidelity checks M7's sheet over the phone's page).
    const sheet = within(await within(document.body).findByRole('dialog', { name: 'File in a project' }))
    await expect(sheet.getByRole('radio', { name: /skill-evals/ })).toBeChecked()
    await expect(sheet.getByRole('button', { name: 'Remove from the library' })).toBeVisible()
    await expect(
      sheet.getByText('Removing takes the link out of the library only; the artifact stays where it was published.'),
    ).toBeVisible()
  },
}

export const MorePhone: Story = {
  name: 'M8: the More drawer open over the library on a phone',
  args: { data: artifactsStates.morePhone.data, ui: artifactsStates.morePhone.ui, viewport: 'phone' },
  play: async () => {
    // The drawer is portalled outside the story's root. It opens at any width (the story renders at the width Storybook
    // gives it; pnpm fidelity checks M8's drawer at the phone's width).
    const drawer = within(await within(document.body).findByRole('dialog', { name: 'More' }))
    await expect(drawer.getByText('Every Claude artifact and Codex site')).toBeVisible()
    await expect(drawer.getByRole('button', { name: /Artifacts/ })).toHaveAttribute('aria-current', 'page')
    await expect(drawer.getByRole('button', { name: /Workflows/ })).toBeDisabled()
  },
}

export const DiscussPhone: Story = {
  name: 'M9: the open artifact’s discussion on its own page on a phone',
  args: { data: artifactsStates.discussPhone.data, ui: artifactsStates.discussPhone.ui, viewport: 'phone' },
  play: async ({ canvas }) => {
    // The story renders at the width Storybook gives it: the phone's page or the desktop's panel.
    // app/ArtifactsStickyBars.test.tsx checks M9's page at the phone's width.
    await expect(canvas.getByText('Talk this artifact through')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Ask about this artifact' })).toBeVisible()
    await expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '46')
  },
}

export const ChangeProposedPhone: Story = {
  name: 'M10: a proposed update to the artifact in its discussion page on a phone',
  args: {
    data: artifactsStates.changeProposedPhone.data,
    ui: artifactsStates.changeProposedPhone.ui,
    viewport: 'phone',
  },
  play: async ({ canvas, canvasElement }) => {
    // The story renders at the width Storybook gives it: the phone's page or the desktop's panel.
    // app/ArtifactsStickyBars.test.tsx checks M10's page at the phone's width, and that Apply shows M2 Updated.
    await expect(canvas.getByText('A dashed line at the median pass rate, 71%')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Apply' })).toBeVisible()
    await expect(canvas.getByRole('meter')).toHaveAttribute('aria-valuenow', '48')
    // M10's own node id of its one Open in workspace.
    await expect(canvasElement.querySelector('[data-figma="452:4181"]')).not.toBeNull()
  },
}
