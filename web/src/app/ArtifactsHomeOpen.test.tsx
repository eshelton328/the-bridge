import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// On /artifacts with no ?state= (pages/artifacts/home.ts) a card or row opens
// its artifact (pages/artifacts/screens/openView.ts): beside the list with its
// row selected on a desktop (D2), on its own page under Back on a tablet (T2)
// and a phone (M2), and Back returns to the library. Add a link opens its
// dialog (D5) or the phone's sheet (M6) with no link and no title.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const query = (selector: string) => document.querySelector(selector)
const card = (title: string) => query(`[data-figma="artifact card · ${title}"]`)
const row = (title: string) => query(`[data-figma="artifact row · ${title}"]`)
const rowButton = (title: string) => row(title)?.querySelector('button') ?? null
const detailTitle = () => query('[data-figma="title block"] h2')?.textContent
const backButton = () => query('button[aria-label="Back to Artifacts"]')
const madeIn = () => query('[data-figma="section · MADE IN"]')

async function press(el: Element | null) {
  if (!(el instanceof HTMLElement)) throw new Error('nothing to press')
  // Press it from the keyboard: the pointer stays where an earlier test left it, which can be over a card's cut
  // description, whose tooltip then opens over the card's title button and takes a click.
  el.focus()
  await userEvent.keyboard('{Enter}')
}

/** The Card's title button, which a click on the card also presses. */
const cardButton = (title: string) => card(title)?.querySelector('button') ?? null

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('opening an artifact from the Artifacts home', () => {
  it('opens a card beside the list at 1512, its row selected, with no Made in', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await expect.poll(() => card('Hono server spike')).not.toBeNull()
    await press(cardButton('Hono server spike'))
    await expect.poll(() => query('[data-figma="library list"]')).not.toBeNull()
    expect(rowButton('Hono server spike')?.getAttribute('aria-current')).toBe('true')
    expect(rowButton('Skill eval pass rates')?.getAttribute('aria-current')).toBeNull()
    expect(detailTitle()).toBe('Hono server spike')
    expect(query('[data-figma="chip · Codex site"]')).not.toBeNull()
    expect(query('[data-figma="chip · updated 12m ago"]')?.textContent).toBe('updated 40m ago')
    expect(madeIn()).toBeNull()
    // Another row of the list opens its artifact in the same place.
    await press(rowButton('Logo options'))
    await expect.poll(detailTitle).toBe('Logo options')
    expect(rowButton('Logo options')?.getAttribute('aria-current')).toBe('true')
  })

  it('opens a card as its own page at 756, and Back returns to the grid', async () => {
    await page.viewport(756, 1024)
    view = await renderAt('/artifacts')
    await expect.poll(() => card('Inbox task lifecycle')).not.toBeNull()
    await press(cardButton('Inbox task lifecycle'))
    await expect.poll(backButton).not.toBeNull()
    expect(detailTitle()).toBe('Inbox task lifecycle')
    expect(query('[data-figma="tab bar"]')).not.toBeNull()
    expect(card('Inbox task lifecycle')).toBeNull()
    expect(madeIn()).toBeNull()
    await press(backButton())
    await expect.poll(() => card('Inbox task lifecycle')).not.toBeNull()
    expect(backButton()).toBeNull()
  })

  it('opens a row as its own page at 390, and Back returns to the rows', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts')
    await expect.poll(() => row('Tailscale access check')).not.toBeNull()
    await press(rowButton('Tailscale access check'))
    await expect.poll(backButton).not.toBeNull()
    expect(detailTitle()).toBe('Tailscale access check')
    expect(query('[data-figma="chip · Codex site"]')).not.toBeNull()
    expect(query('[data-figma="tab bar"]')).not.toBeNull()
    expect(row('Tailscale access check')).toBeNull()
    expect(madeIn()).toBeNull()
    await press(backButton())
    await expect.poll(() => row('Tailscale access check')).not.toBeNull()
    expect(backButton()).toBeNull()
  })

  it('opens Sort and Filter from the list beside a card it opened at 1512', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await expect.poll(() => card('Hono server spike')).not.toBeNull()
    await press(cardButton('Hono server spike'))
    await expect.poll(() => query('[data-figma="library list"]')).not.toBeNull()
    const list = page.getByRole('region', { name: 'Artifacts list' })
    await userEvent.click(list.getByRole('button', { name: 'Newest' }))
    await expect.element(page.getByRole('menuitemradio', { name: /Newest first/ })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(list.getByRole('button', { name: /^Filter/ }))
    await expect.element(page.getByRole('dialog', { name: /Filter/ })).toBeVisible()
  })
})

describe('Add a link on the Artifacts home', () => {
  const fieldValues = (dialog: Element) =>
    [...dialog.querySelectorAll('input')].filter((input) => input.type === 'text').map((input) => input.value)

  it('opens the dialog at 1512 with no link and no title', async () => {
    await page.viewport(1512, 982)
    view = await renderAt('/artifacts')
    await press(page.getByRole('button', { name: 'Add a link' }).element())
    const dialog = page.getByRole('dialog', { name: 'Add a link' })
    await expect.element(dialog).toBeVisible()
    await expect
      .element(dialog.getByText('Any HTTPS link. A claude.ai/artifact link is saved as a Claude artifact.'))
      .toBeVisible()
    await expect.element(dialog.getByRole('button', { name: 'Add artifact' })).toBeVisible()
    expect(fieldValues(dialog.element())).toEqual(['', ''])
  })

  it('opens the sheet at 390 with no link and no title, in M6\u2019s words', async () => {
    await page.viewport(390, 844)
    view = await renderAt('/artifacts')
    await press(page.getByRole('button', { name: 'Add a link' }).element())
    const sheet = page.getByRole('dialog', { name: 'Add a link' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByRole('textbox', { name: 'Link' })).toHaveValue('')
    await expect.element(sheet.getByRole('textbox', { name: 'Title' })).toHaveValue('')
    // M6's words: the one-line description and Add in the title row.
    await expect.element(sheet.getByText('For an artifact the library did not find.', { exact: true })).toBeVisible()
    await expect.element(sheet.getByRole('button', { name: 'Add', exact: true })).toBeVisible()
  })
})
