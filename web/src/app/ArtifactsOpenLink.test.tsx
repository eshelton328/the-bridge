import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { type Device, devices, plan, tablet, tapArtifacts, withServer } from './artifactsLiveHelpers.ts'
import { routeTree } from './routeTree.gen.ts'

// R40, the owner's report from the phone ("I can't open the artifacts"): Open artifact did nothing on any layout. It is
// now a plain link to the artifact's https address that opens a new tab (so the Home Screen app opens Safari), with Copy
// link next to it. The owner's path: the app with no URL parameters, Artifacts from the rail, the tablet's tab bar or
// More on the phone, the live library from the contract-checked fake (lib/fakeArtifactsServer.ts), then a tap on the
// artifact's card or row. Every link and title is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const [desktop, phone] = devices
const layouts: readonly Device[] = [phone, tablet, desktop]

/** A made-up Codex site the owner added, whose link the server keeps with an upper-case scheme. */
const shouting = {
  ...plan,
  id: '00000000000000aa',
  title: 'Sample shouting site',
  link: 'HTTPS://sample-shouting.example.com/page',
  source: 'codex',
  chat: null,
  foundBy: 'owner',
}

/** Taps the card or row titled `title` and waits for its artifact to open. */
async function openCard(device: Device, title: string) {
  const opener = () => document.querySelector(`[data-figma="${device.item} · ${title}"] button`)
  await expect.poll(opener).not.toBeNull()
  const button = opener()
  if (!(button instanceof HTMLElement)) throw new Error(`no ${device.item} for ${title}`)
  await userEvent.click(button)
  await expect.poll(() => document.querySelector('[data-figma="title block"] h2')?.textContent).toBe(title)
  await openActionsShown()
}

/** Open artifact and the Copy link next to it; the test waits for them first (`openActionsShown`). */
const openActionsSelector = '[data-figma="open actions"]'
const openActions = () => {
  const group = document.querySelector(openActionsSelector)
  if (group === null) throw new Error('no Open artifact group')
  return page.elementLocator(group)
}
const openActionsShown = () => expect.poll(() => document.querySelector(openActionsSelector)).not.toBeNull()
const openLink = () => openActions().getByRole('link', { name: 'Open artifact' })
/** The button next to Open artifact whose accessible name is `name` now, or null. */
const actionNamed = (name: string) => openActions().getByRole('button', { name, exact: true }).query()

/** Swaps the clipboard's writeText for a fake for this test, and returns what it was given. */
function fakeClipboard(): string[] {
  const copied: string[] = []
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = (text) => {
    copied.push(text)
    return Promise.resolve()
  }
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
  return copied
}

/** Swaps the clipboard's writeText for one that rejects with `error` for this test. */
function rejectingClipboard(error: Error): void {
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = () => Promise.reject(error)
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
}

/** Whether a status region says `text`. */
const statusSays = (text: string) => page.getByRole('status').filter({ hasText: text }).query() !== null

describe('Open artifact on the owner path', () => {
  for (const device of layouts) {
    it(`is a link to the artifact's https address in a new tab, on ${device.name}`, async () => {
      withServer()
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      const link = openLink()
      await expect.element(link).toBeVisible()
      await expect.element(link).toHaveAttribute('href', plan.link)
      await expect.element(link).toHaveAttribute('target', '_blank')
      await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
      // The library's primary button look, from its recipe.
      expect(link.element().getAttribute('class')).toContain('button--variant_primary')
    })
  }

  it('links a link the server keeps with an upper-case scheme to its https address, on the phone', async () => {
    withServer([shouting])
    await tapArtifacts(phone)
    await openCard(phone, shouting.title)
    await expect.element(openLink()).toHaveAttribute('href', 'https://sample-shouting.example.com/page')
  })
})

describe('Copy link next to Open artifact on the owner path', () => {
  for (const device of layouts) {
    it(`copies the https link and shows Copied for 2 s, on ${device.name}`, async () => {
      withServer()
      const copied = fakeClipboard()
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await expect.element(openLink()).toBeVisible()
      const button = actionNamed('Copy link')
      if (button === null) throw new Error('no Copy link next to Open artifact')
      // "Copied" waits for the test's clock (lib/holdTimers.ts): a DOM click and rendering steps move it not.
      const release = holdTimers()
      clickNow(button)
      await renderedUntil(() => copied.length > 0)
      expect(copied).toEqual([plan.link])
      await renderedUntil(() => actionNamed('Copied') === button)
      await renderedUntil(() => statusSays('Copied'))
      await renderedUntil(() => vi.getTimerCount() > 0)
      vi.advanceTimersByTime(1500)
      await afterRendering()
      expect(actionNamed('Copied')).toBe(button)
      vi.advanceTimersByTime(500)
      await renderedUntil(() => actionNamed('Copy link') === button)
      release()
    })
  }

  for (const device of [phone, tablet]) {
    it(`shows Copy failed when the clipboard refuses, and reports no link, on ${device.name}`, async () => {
      withServer()
      const broken = new Error('the clipboard broke')
      rejectingClipboard(broken)
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await expect.element(openLink()).toBeVisible()
      const button = actionNamed('Copy link')
      if (button === null) throw new Error('no Copy link next to Open artifact')
      const release = holdTimers()
      clickNow(button)
      await renderedUntil(() => actionNamed('Copy failed') === button)
      await renderedUntil(() => statusSays('Copy failed'))
      release()
      expect(getReports().map((r) => r.error)).toContain(broken)
      const reported = getReports().map((r) => `${r.error.message} ${r.route} ${r.componentStack ?? ''}`)
      for (const line of reported) expect(line).not.toContain('00000000-0000-0000-0000-000000000001')
    })
  }
})

// The fixture states (?state=) keep working: Open artifact links to the state's artifact.
describe('Open artifact on the fixture states', () => {
  it.each([
    ['artifactOpen', 1512, 982],
    ['artifactTablet', 756, 1158],
    ['artifactPhone', 390, 844],
  ] as const)('%s links to its artifact', async (state, width, height) => {
    await setViewport(width, height)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/artifacts?state=${state}`] }),
    })
    await testRender(<RouterProvider router={router} />)
    await openActionsShown()
    const link = openLink()
    await expect.element(link).toHaveAttribute('href', 'https://claude.ai/artifact/8f3c2a91-skill-evals')
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
