import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// R38 follow-up: on the phone a chat row keeps no selected state, so a tap shows a brief pressed fill instead
// (`surface.selected`, the library's ListRow `data-pressed` from 1.0.0-beta.101) that the finger's release clears. The
// chat's back button is named "Back to Workspaces" on the live page, as in the Figma states (M3). Each test takes the
// owner's path: the app with no URL, then Workspaces, with the stubbed live server.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

async function openWorkspacesOnPhone() {
  await page.viewport(390, 844)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.element(page.getByRole('button', { name: 'plan the slice', exact: true })).toBeVisible()
}

/** The ListRow around a chat's title button. */
function rowOf(title: string): HTMLElement {
  const button = page.getByRole('button', { name: title, exact: true }).element()
  const row = button.closest<HTMLElement>('.list-row__root')
  if (row === null) throw new Error(`no ListRow around ${title}`)
  return row
}

/** The colour `surface.selected` resolves to on this page, as a computed background. */
function selectedFill(): string {
  const probe = document.createElement('div')
  probe.style.background = 'var(--colors-surface-selected)'
  document.body.append(probe)
  const fill = getComputedStyle(probe).backgroundColor
  probe.remove()
  return fill
}

const pointer = (type: string) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch' })

describe('a chat row on the phone', () => {
  it('shows the pressed fill while the finger is down and clears it on release', async () => {
    await openWorkspacesOnPhone()
    const title = page.getByRole('button', { name: 'plan the slice', exact: true }).element()
    const row = rowOf('plan the slice')
    expect(row.hasAttribute('data-selected')).toBe(false)
    expect(row.hasAttribute('data-running')).toBe(false)
    const rest = getComputedStyle(row).backgroundColor
    expect(rest).not.toBe(selectedFill())

    title.dispatchEvent(pointer('pointerdown'))
    await expect.poll(() => row.hasAttribute('data-pressed')).toBe(true)
    await expect.poll(() => getComputedStyle(row).backgroundColor).toBe(selectedFill())

    title.dispatchEvent(pointer('pointerup'))
    await expect.poll(() => row.hasAttribute('data-pressed')).toBe(false)
    await expect.poll(() => getComputedStyle(row).backgroundColor).toBe(rest)
  })

  it('clears the pressed fill when the press is cancelled', async () => {
    await openWorkspacesOnPhone()
    const title = page.getByRole('button', { name: 'plan the slice', exact: true }).element()
    const row = rowOf('plan the slice')
    title.dispatchEvent(pointer('pointerdown'))
    await expect.poll(() => row.hasAttribute('data-pressed')).toBe(true)
    title.dispatchEvent(pointer('pointercancel'))
    await expect.poll(() => row.hasAttribute('data-pressed')).toBe(false)
  })

  it('opens the chat on a tap, and after "Back to Workspaces" no row is selected or pressed', async () => {
    await openWorkspacesOnPhone()
    const title = page.getByRole('button', { name: 'plan the slice', exact: true }).element()
    title.dispatchEvent(pointer('pointerdown'))
    title.dispatchEvent(pointer('pointerup'))
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces', exact: true }))
    await expect.element(page.getByRole('button', { name: 'plan the slice', exact: true })).toBeVisible()
    expect(document.querySelectorAll('.list-row__root[data-selected], .list-row__root[data-pressed]')).toHaveLength(0)
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(0)
  })
})

describe('the live phone chat', () => {
  it('names its back button "Back to Workspaces"', async () => {
    await openWorkspacesOnPhone()
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces', exact: true })).toBeVisible()
  })
})
