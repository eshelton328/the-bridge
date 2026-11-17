import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { inboxStates } from './states/index.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'

// The screen takes its layout from its width, not from the `viewport` prop,
// which only applies until the first measure: a story or a board renders the
// same state at the desktop or the tablet size.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// The tab bar's Home tab: the desktop rail has no Home.
const tabBar = () => page.getByRole('button', { name: 'Home' })
const back = () => page.getByRole('button', { name: 'Back to Inbox' })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the Inbox screen by width', () => {
  it('shows the list, the open item and the rail side by side at the desktop width', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.nextStep
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="tablet" />)
    await expect.element(page.getByText('Try the tablet layout on the iPad mini')).toBeVisible()
    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' }))
      .toBeVisible()
    await expect.element(back()).not.toBeInTheDocument()
    await expect.element(tabBar()).not.toBeInTheDocument()
  })

  it('shows the open item alone, under Back and over the tab bar, at the tablet width', async () => {
    await page.viewport(756, 1158)
    const { data, ui } = inboxStates.nextStep
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' }))
      .toBeVisible()
    await expect.element(back()).toBeVisible()
    await expect.element(tabBar()).toBeVisible()
    await expect.element(page.getByText('Try the tablet layout on the iPad mini')).not.toBeInTheDocument()
  })

  it('shows the list alone when no item is open at the tablet width', async () => {
    await page.viewport(756, 1158)
    const { data, ui } = inboxStates.list
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByText('Try the tablet layout on the iPad mini')).toBeVisible()
    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' }))
      .not.toBeInTheDocument()
    await expect.element(tabBar()).toBeVisible()
  })

  it('hides the tab bar in a chat at the tablet width', async () => {
    await page.viewport(756, 1158)
    const { data, ui } = inboxStates.chat
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByText('Wait for increment two.')).toBeVisible()
    await expect.element(back()).toBeVisible()
    await expect.element(tabBar()).not.toBeInTheDocument()
  })
})
