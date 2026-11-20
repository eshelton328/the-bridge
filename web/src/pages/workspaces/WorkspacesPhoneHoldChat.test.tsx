import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { resetAllStores } from '../../state/resetStores.ts'
import { loadWorkspacesState } from './loadWorkspacesState.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesSearch } from './search.ts'
import { workspacesStates } from './states/index.ts'
import { WorkspacesPage } from './WorkspacesPage.tsx'

// A chat held in the phone's list (M9): the hold opens the chat's actions in a sheet and lifts the row.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Presses a pointer on the element, moves it `drift` px down after 100 ms, and lets go after `ms`. */
async function press(element: Element, ms: number, drift = 0) {
  const box = element.getBoundingClientRect()
  const at = { bubbles: true, button: 0, pointerId: 1, clientX: box.x + 20, clientY: box.y + 20 }
  element.dispatchEvent(new PointerEvent('pointerdown', at))
  await wait(100)
  if (drift > 0) element.dispatchEvent(new PointerEvent('pointermove', { ...at, clientY: at.clientY + drift }))
  await wait(ms - 100)
  element.dispatchEvent(new PointerEvent('pointerup', at))
}

// The M1 list with M9's actions, so a hold can open them.
const withActions = {
  data: { ...workspacesStates.phoneHome.data, phone: workspacesStates.phoneHoldChat.data.phone },
  ui: workspacesStates.phoneHome.ui,
}

describe('a chat held in the phone list', () => {
  it('shows the held chat lifted and its actions, Rename first and highlighted', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneHoldChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    const labels = ['Rename', 'Fork', 'Side chat', 'Subtask', 'Subagents · 2', 'Folders · 2', 'Move to workspace']
    for (const label of labels)
      await expect.element(sheet.getByRole('radio', { name: label, exact: true })).toBeVisible()
    await expect.element(sheet.getByRole('radio', { name: 'Rename' })).toBeChecked()
    await expect.element(sheet.getByRole('radio', { name: 'Close chat' })).toBeVisible()
    // Move to workspace is closed: no workspace shows under it.
    await expect.element(sheet.getByText('New workspace…')).not.toBeInTheDocument()
    await expect.element(page.getByText('drift check').first()).toBeInTheDocument()
    expect(document.querySelector('[data-figma="146:252"]')).not.toBeNull()
  })

  it('opens the actions after a still hold, and the release does not open the chat', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    const row = page.getByRole('button', { name: /drift check/ }).first()
    await expect.element(row).toBeVisible()
    await press(row.element(), 700)
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: 'Rename' })).toBeChecked()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).not.toBeInTheDocument()
  })

  it('does not open the actions when the finger moves', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    const row = page.getByRole('button', { name: /drift check/ }).first()
    await expect.element(row).toBeVisible()
    await press(row.element(), 700, 20)
    await wait(100)
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).not.toBeInTheDocument()
  })

  it("opens the same actions from the row's ⋯", async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'drift check actions' }))
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    await userEvent.click(sheet.getByText('Move to workspace'))
    await expect.element(sheet.getByText('New workspace…')).toBeVisible()
  })
})

// The page entry, its loader and its store as routes/workspaces.tsx wires them; a page may not import the app's route
// tree (as in WorkspacesSendDraft.test.tsx).
function renderRoute(path: string) {
  const root = createRootRoute()
  const workspaces = createRoute({
    getParentRoute: () => root,
    path: 'workspaces',
    validateSearch: workspacesSearch,
    loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
    loader: ({ deps }) => loadWorkspacesState(deps.state, deps.source),
    component: WorkspacesPage,
  })
  const router = createRouter({
    routeTree: root.addChildren([workspaces]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return testRender(<RouterProvider router={router} />)
}

/** drift check's row in the list: the anchor that the actions sheet lifts (M9 146:117). */
const heldRow = () => {
  const el = document.querySelector('[data-figma="146:117"]')
  if (!(el instanceof HTMLElement)) throw new Error('no drift check row')
  return el
}
/** The lifted copy (146:252) and the sheet's scrim, while the sheet is open. */
const copy = () => document.querySelector('[data-figma="146:252"]')
const scrim = () => document.querySelector('.bottom-sheet__backdrop')
const round = (r: DOMRect) => [r.left, r.top, r.width, r.height].map(Math.round)

/** The element drawn on top at the centre of `el`, with `el`'s own pointer events on, so the hit test sees it. */
function topAt(el: HTMLElement): Element | null {
  const r = el.getBoundingClientRect()
  const before = el.style.pointerEvents
  const box = el.closest<HTMLElement>('.bottom-sheet__lifted')
  const boxBefore = box?.style.pointerEvents ?? ''
  el.style.pointerEvents = 'auto'
  if (box) box.style.pointerEvents = 'auto'
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  el.style.pointerEvents = before
  if (box) box.style.pointerEvents = boxBefore
  return top
}

/** The held row is lifted: its copy sits at the row's place, over the scrim, and the row keeps its place hidden. */
async function expectLifted(at: number[]) {
  await expect.poll(() => copy()?.closest('.bottom-sheet__lifted[data-placed]')).not.toBeNull()
  const lifted = copy()?.closest<HTMLElement>('.bottom-sheet__lifted')
  const back = scrim()
  if (!lifted || !(back instanceof HTMLElement)) throw new Error('no lifted copy or scrim')
  expect(round(lifted.getBoundingClientRect())).toEqual(at)
  // Drawn after the scrim in the sheet's layer, and on top at its centre: nothing of the page paints over it.
  expect(back.compareDocumentPosition(lifted) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const copyEl = copy()
  if (!(copyEl instanceof HTMLElement)) throw new Error('no copy')
  expect(copyEl.contains(topAt(copyEl))).toBe(true)
  expect(getComputedStyle(heldRow()).visibility).toBe('hidden')
  expect(round(heldRow().getBoundingClientRect())).toEqual(at)
}

describe('a chat held in the phone list, on the owner path at 390 x 844', () => {
  it('lifts the row over the scrim, closes on a tap of the scrim and lifts it again on a hold', async () => {
    await page.viewport(390, 844)
    view = await renderRoute('/workspaces?state=phoneHoldChat')
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    await expect.poll(() => document.querySelector('[data-figma="146:117"]')).not.toBeNull()
    const at = round(heldRow().getBoundingClientRect())
    await expectLifted(at)
    // A tap at the copy's place closes the sheet, and the row shows again.
    const lifted = copy()
    if (!(lifted instanceof HTMLElement)) throw new Error('no copy')
    const r = lifted.getBoundingClientRect()
    // The copy and the scrim take no pointer events: the tap lands on the page's root, outside the sheet, and the
    // sheet closes as on a tap of the scrim anywhere.
    const point = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
    expect(document.elementFromPoint(point.x, point.y)).toBe(document.documentElement)
    await userEvent.click(document.documentElement, { position: point })
    await expect.element(sheet).not.toBeInTheDocument()
    await expect.poll(() => copy()).toBeNull()
    await expect.poll(() => getComputedStyle(heldRow()).visibility).toBe('visible')
    // Holding the row opens its actions again, with the row lifted at the same place.
    await press(heldRow(), 700)
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).toBeVisible()
    await expectLifted(at)
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).not.toBeInTheDocument()
  })
})

// The owner opens the app with no ?state=: the page's home (home.ts) with M1's layers, where the list's rows must
// still open their actions on a hold or on their ⋯, and lift the row over the scrim.
describe('a chat held in the home list, on the owner path at 390 x 844', () => {
  /** drift check's row in the home's list (M1 105:2367). */
  const homeRow = () => {
    const el = document.querySelector('[data-figma="105:2367"]')
    if (!(el instanceof HTMLElement)) throw new Error('no drift check row')
    return el
  }
  /** The sheet's lifted copy of the held row, once placed. */
  const placed = () => document.querySelector<HTMLElement>('.bottom-sheet__lifted[data-placed]')

  /** The sheet is open, the row hidden at its place and its copy at the same box, drawn over the scrim. */
  async function expectHomeLifted(at: number[]) {
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: 'Rename' })).toBeChecked()
    await expect.poll(() => placed()).not.toBeNull()
    const lifted = placed()
    const back = scrim()
    if (!lifted || !(back instanceof HTMLElement)) throw new Error('no lifted copy or scrim')
    expect(lifted.textContent).toContain('drift check')
    expect(round(lifted.getBoundingClientRect())).toEqual(at)
    expect(back.compareDocumentPosition(lifted) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const inner = lifted.firstElementChild
    if (!(inner instanceof HTMLElement)) throw new Error('no copy in the lifted box')
    expect(inner.contains(topAt(inner))).toBe(true)
    expect(getComputedStyle(homeRow()).visibility).toBe('hidden')
    expect(round(homeRow().getBoundingClientRect())).toEqual(at)
  }

  /** A tap on the scrim above the sheet closes it, and the row shows again. */
  async function tapScrim() {
    const point = { x: 195, y: 60 }
    const back = scrim()
    if (!(back instanceof HTMLElement)) throw new Error('no scrim')
    const r = back.getBoundingClientRect()
    expect(point.y >= r.top && point.y <= r.bottom).toBe(true)
    await userEvent.click(document.documentElement, { position: point })
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).not.toBeInTheDocument()
    await expect.poll(() => placed()).toBeNull()
    await expect.poll(() => getComputedStyle(homeRow()).visibility).toBe('visible')
  }

  it('opens the actions on a hold, lifts the row over the scrim and closes on a tap of the scrim', async () => {
    await page.viewport(390, 844)
    view = await renderRoute('/workspaces')
    await expect.poll(() => document.querySelector('[data-figma="105:2367"]')).not.toBeNull()
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).not.toBeInTheDocument()
    const at = round(homeRow().getBoundingClientRect())
    await press(homeRow(), 700)
    await expectHomeLifted(at)
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).not.toBeInTheDocument()
    await tapScrim()
  })

  it("opens the same actions from the row's ⋯ and closes on a tap of the scrim", async () => {
    await page.viewport(390, 844)
    view = await renderRoute('/workspaces')
    await expect.poll(() => document.querySelector('[data-figma="105:2367"]')).not.toBeNull()
    const at = round(homeRow().getBoundingClientRect())
    await userEvent.click(page.getByRole('button', { name: 'drift check actions' }))
    await expectHomeLifted(at)
    await tapScrim()
  })
  it('runs a picked action in the held chat: Rename opens the chat with its name as a field', async () => {
    await page.viewport(390, 844)
    view = await renderRoute('/workspaces')
    // bridge themes has a pane to show (the mock's only openable chat), so its actions can run in it.
    await expect.poll(() => document.querySelector('[data-figma="105:2350"]')).not.toBeNull()
    const row = document.querySelector('[data-figma="105:2350"]')
    if (!(row instanceof HTMLElement)) throw new Error('no bridge themes row')
    await press(row, 700)
    const sheet = page.getByRole('dialog', { name: 'bridge themes' })
    await expect.element(sheet).toBeVisible()
    await userEvent.click(sheet.getByText('Rename', { exact: true }))
    await expect.element(sheet).not.toBeInTheDocument()
    // The chat fills the screen: its back button (labelled with the list's title in the home) and its name as a field.
    await expect.element(page.getByRole('button', { name: 'Workspaces', exact: true })).toBeVisible()
    await expect.element(page.getByRole('searchbox', { name: 'Rename bridge themes' })).toBeVisible()
  })
})
