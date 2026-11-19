import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'
import type { WorkbenchPane } from './types.ts'

// A skill picked from the list that "/" opens goes into the message box: the typed "/word" becomes the skill and a
// space, the list closes, and the focus and caret stay in the box at the end of the skill, so typing goes on (and the
// phone's keyboard stays up). Each surface that lists skills: a pane of the split (D1), the chat alone beside the
// sidebar (D2), the phone's chat (M3) and the tablet's (T6).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const surfaces = [
  { name: 'a pane of the split (D1)', state: 'workbench', viewport: 'desktop', size: [1512, 982] },
  { name: 'the chat alone beside the sidebar (D2)', state: 'sideChat', viewport: 'desktop', size: [1512, 982] },
  { name: 'the chat on the phone (M3)', state: 'phoneChat', viewport: 'phone', size: [390, 844] },
  { name: 'the chat on the tablet (T6)', state: 'tabletOneChat', viewport: 'tablet', size: [756, 1158] },
] as const

type Surface = (typeof surfaces)[number]

// The surface's state with the skills and D1's pane menu closed, and `text` in each chat's message box.
function screen(surface: Surface, text: string) {
  const { data, ui } = workspacesStates[surface.state]
  const panes: WorkbenchPane[] = data.panes.map((p) =>
    p.type === 'chat' ? { ...p, composer: { ...p.composer, text } } : p,
  )
  return (
    <WorkspacesScreen
      data={{ ...data, panes }}
      ui={{ ...ui, skillsFor: null, menuFor: null, moveOpen: false, messageFocus: false }}
      viewport={surface.viewport}
    />
  )
}

const box = () => page.getByRole('textbox', { name: 'Message, or / for a skill' })
// A row of the open list (a closed list stays in the page, hidden).
const row = (name: string) => page.getByRole('group', { name: /^SKILLS/ }).getByText(name, { exact: true })

function area() {
  const el = box().element()
  if (!(el instanceof HTMLTextAreaElement)) throw new Error('the message box is not a textarea')
  return el
}

// The box holds `text` with the list closed, and has the focus with the caret at `caret`.
async function expectPicked(text: string, caret: number) {
  await expect.element(box()).toHaveValue(text)
  await expect.element(page.getByRole('group', { name: /^SKILLS/ })).not.toBeInTheDocument()
  await expect.element(box()).toHaveFocus()
  expect(area().selectionStart).toBe(caret)
  expect(area().selectionEnd).toBe(caret)
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe.each(surfaces)('a skill picked in $name', (surface) => {
  it('replaces the typed "/" with the skill on a click, closes the list and keeps the focus in the box', async () => {
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ''))
    await userEvent.click(box())
    await userEvent.keyboard('/')
    await expect.element(row('/readme')).toBeVisible()
    await userEvent.click(row('/readme'))
    await expectPicked('/readme ', 8)
    await userEvent.keyboard('the bridge')
    await expect.element(box()).toHaveValue('/readme the bridge')
    // The list stays closed as the owner types on, so Enter sends the message, which empties the box.
    await expect.element(page.getByRole('group', { name: /^SKILLS/ })).not.toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    await expect.element(box()).toHaveValue('')
  })

  it('empties the box when the owner sends a message with the list closed', async () => {
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ''))
    await userEvent.click(box())
    await userEvent.keyboard('half a thought{Enter}')
    await expect.element(box()).toHaveValue('')
  })

  it('replaces the whole "/" word when the caret is inside it', async () => {
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ''))
    await userEvent.click(box())
    await userEvent.keyboard('/wrter')
    area().setSelectionRange(3, 3)
    await userEvent.keyboard('i')
    await expect.element(box()).toHaveValue('/writer')
    await expect.element(row('/writer')).toBeVisible()
    await userEvent.click(row('/writer'))
    await expectPicked('/writer ', 8)
  })

  it('picks the highlighted skill with Enter, after the word the owner typed from "/" in his message (M10)', async () => {
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ''))
    await userEvent.click(box())
    await userEvent.keyboard('Turn the notes into a doc with /wri')
    await expect.element(row('/writer')).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await expectPicked('Turn the notes into a doc with /writer ', 39)
  })

  it('moves the highlight with the arrow keys and picks that skill with Enter', async () => {
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ''))
    await userEvent.click(box())
    await userEvent.keyboard('/')
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).toBeChecked()
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('radio', { name: /\/readme/ })).toBeChecked()
    await userEvent.keyboard('{Enter}')
    await expectPicked('/readme ', 8)
  })
})

describe('a skill picked before words', () => {
  it('replaces the "/word" before the caret and keeps the space after it, with the caret after that space', async () => {
    const surface = surfaces[2]
    await page.viewport(surface.size[0], surface.size[1])
    view = await testRender(screen(surface, ' layouts'))
    await userEvent.click(box())
    area().setSelectionRange(0, 0)
    await userEvent.keyboard('/re')
    await expect.element(row('/readme')).toBeVisible()
    await userEvent.click(row('/readme'))
    await expectPicked('/readme layouts', 8)
  })
})
