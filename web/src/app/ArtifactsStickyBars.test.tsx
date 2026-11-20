import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Artifacts discussion's sticky bars through the real route (d-107): the discussion panel beside the open
// artifact keeps its header (the title and Close) at the top and its reply box at the bottom while only the messages
// between them scroll; the artifact's column scrolls on its own. The app's styles and fonts load as in main.ts, and
// the root has the theme and mode of index.html, so the tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderArtifacts(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/artifacts?state=${state}`] }),
  })
  return { router, rendered: testRender(<RouterProvider router={router} />) }
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

/** The render of this test: earlier tests leave theirs in the page. Its root fills the window, as `#root` does. */
async function renderRoot(state: string) {
  const view = await renderArtifacts(state).rendered
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return { view, root }
}

// The discussion's frames on the desktop: D7 (empty), D8 (a proposed change) and D9 (the change applied).
const states = [
  { name: 'the empty discussion (D7)', state: 'discussOpen' },
  { name: 'the proposed change (D8)', state: 'changeProposed' },
  { name: 'the applied change (D9)', state: 'changeApplied' },
]

describe('the sticky bars (d-107)', () => {
  for (const c of states)
    it(`keeps the header and the reply box in view while the messages scroll: ${c.name}`, async () => {
      await page.viewport(1512, 982)
      const { view, root } = await renderRoot(c.state)
      const panel = root.querySelector('[data-figma="discussion panel"]')
      await expect.poll(() => root.querySelector('[data-figma="composer · discussion"]')).not.toBeNull()
      const top = root.querySelector('button[aria-label="Close the discussion"]')
      const bottom = root.querySelector('[data-figma="composer · discussion"]')
      if (!(panel instanceof HTMLElement) || top === null || bottom === null) throw new Error('no discussion')
      // The content that scrolls: the panel's messages and the artifact's column, each a ScrollFrame body, made to
      // overflow as a long discussion would.
      const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
      const messages = panel.querySelector<HTMLElement>('.scroll-frame__body')
      expect(messages).not.toBeNull()
      expect(bodies.length).toBeGreaterThan(1)
      for (const body of bodies) {
        const long = document.createElement('div')
        long.style.height = '3000px'
        long.style.flexShrink = '0'
        ;(body.firstElementChild ?? body).append(long)
      }
      for (const body of bodies) expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      const before = { top: box(top).top, bottom: box(bottom).bottom }
      for (const body of bodies) body.scrollTop = body.scrollHeight
      // The page and the AppShell detail do not scroll; only the content between the bars.
      const detail = root.querySelector('.app-shell__detail')
      expect(detail?.scrollTop ?? 0).toBe(0)
      await expect.poll(() => bodies.every((b) => b.scrollTop > 0)).toBe(true)
      expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
      expect(box(bottom).bottom).toBe(before.bottom)
      expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(box(bottom).top).toBeGreaterThanOrEqual(0)
      expect(box(top).top).toBe(before.top)
      expect(box(top).top).toBeGreaterThanOrEqual(0)
      expect(box(top).bottom).toBeLessThanOrEqual(box(bottom).top)
      await view.unmount()
    })
})

describe('the Back bar on the tablet (d-107)', () => {
  it('keeps the Back bar at the top and the tab bar at the bottom while the artifact page scrolls (T2)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('artifactTablet')
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    const top = root.querySelector('[data-figma="top bar"]')
    const back = root.querySelector('button[aria-label="Back to Artifacts"]')
    const bottom = root.querySelector('[data-figma="tab bar"]')
    if (top === null || back === null || bottom === null) throw new Error('no artifact page')
    // The page under the Back bar: one ScrollFrame body, made to overflow as a long artifact page would.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no page body')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { top: box(top).top, back: box(back).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    // The page and the AppShell detail do not scroll; only the artifact page under the Back bar.
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(top).top).toBe(before.top)
    expect(box(back).top).toBe(before.back)
    expect(box(top).top).toBeGreaterThanOrEqual(0)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    // The scrolled page starts under the Back bar and runs under the tab bar to the bottom of the screen, as
    // Figma draws the tablet pages (AppShell tabBarOverlay); scrolled to its end, the whole page sits above the bar.
    expect(box(body).top).toBeGreaterThanOrEqual(box(top).bottom)
    expect(box(body).bottom).toBeGreaterThan(box(bottom).top)
    const content = body.firstElementChild
    if (content === null) throw new Error('no page content')
    // Half a pixel for the subpixel scroll position, as WorkspacesStickyBars.test.tsx allows.
    expect(box(content).bottom).toBeLessThanOrEqual(box(bottom).top + 0.5)
    await view.unmount()
  })

  it('returns to the library when Back is pressed (T2 to T1)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('artifactTablet')
    await expect.poll(() => root.querySelector('button[aria-label="Back to Artifacts"]')).not.toBeNull()
    const back = root.querySelector('button[aria-label="Back to Artifacts"]')
    if (!(back instanceof HTMLElement)) throw new Error('no Back')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('h1')?.textContent).toBe('Artifacts')
    expect(root.querySelector('[data-figma="top bar"]')).toBeNull()
    await view.unmount()
  })
})

describe('the Back bar on the phone (d-107)', () => {
  it('keeps the Back bar at the top and the tab bar at the bottom while the artifact page scrolls (M2)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('artifactPhone')
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    const top = root.querySelector('[data-figma="top bar"]')
    const back = root.querySelector('button[aria-label="Back to Artifacts"]')
    const bottom = root.querySelector('[data-figma="tab bar"]')
    if (top === null || back === null || bottom === null) throw new Error('no artifact page')
    // The page under the Back bar: one ScrollFrame body, made to overflow as a long artifact page would.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no page body')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { top: box(top).top, back: box(back).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    // The page and the AppShell detail do not scroll; only the artifact page under the Back bar.
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(top).top).toBe(before.top)
    expect(box(back).top).toBe(before.back)
    expect(box(top).top).toBeGreaterThanOrEqual(0)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    // The scrolled page starts under the Back bar and runs under the tab bar to the bottom of the screen, as
    // Figma draws the phone pages (AppShell tabBarOverlay); scrolled to its end, the whole page sits above the bar.
    expect(box(body).top).toBeGreaterThanOrEqual(box(top).bottom)
    expect(box(body).bottom).toBeGreaterThan(box(bottom).top)
    const content = body.firstElementChild
    if (content === null) throw new Error('no page content')
    // Half a pixel for the subpixel scroll position, as WorkspacesStickyBars.test.tsx allows.
    expect(box(content).bottom).toBeLessThanOrEqual(box(bottom).top + 0.5)
    await view.unmount()
  })

  it('returns to the library when Back is pressed (M2 to M1)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('artifactPhone')
    await expect.poll(() => root.querySelector('button[aria-label="Back to Artifacts"]')).not.toBeNull()
    const back = root.querySelector('button[aria-label="Back to Artifacts"]')
    if (!(back instanceof HTMLElement)) throw new Error('no Back')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('h1')?.textContent).toBe('Artifacts')
    expect(root.querySelector('[data-figma="top bar"]')).toBeNull()
    await view.unmount()
  })
})

describe('the discussion page on the tablet (d-107)', () => {
  it('keeps the nav and the card at the top and the reply box at the bottom while the messages scroll (T4)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('discussTablet')
    await expect.poll(() => root.querySelector('[data-figma="composer · discussion"]')).not.toBeNull()
    const nav = root.querySelector('[data-figma="nav"]')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    const bottom = root.querySelector('[data-figma="composer · discussion"]')
    if (nav === null || card === null || bottom === null) throw new Error('no discussion page')
    // The tab bar hides, as in a chat.
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    // The messages under the card: one ScrollFrame body, made to overflow as a long discussion would.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no messages')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { nav: box(nav).top, card: box(card).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    // The page and the AppShell detail do not scroll; only the messages between the card and the reply box.
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(nav).top).toBe(before.nav)
    expect(box(card).top).toBe(before.card)
    expect(box(nav).top).toBeGreaterThanOrEqual(0)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(card).bottom).toBeLessThanOrEqual(box(bottom).top)
    await view.unmount()
  })

  it('keeps Send in reach of the wheel when the reply box holds 70 lines (T4)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('discussTablet')
    await expect.poll(() => root.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
    const field = root.querySelector('[data-figma="composer · discussion"] textarea')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    if (!(field instanceof HTMLTextAreaElement) || card === null) throw new Error('no reply box')
    await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
    await new Promise((resolve) => setTimeout(resolve, 300))
    const reply = field.closest('.composer__root')?.parentElement ?? field
    // The reply box keeps the desktop panel's cap: inside the window, at most half of it, under the card.
    expect(box(reply).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(reply).top).toBeGreaterThanOrEqual(box(card).bottom)
    expect(box(reply).height).toBeLessThanOrEqual(window.innerHeight / 2 + 1)
    reply.scrollTop = reply.scrollHeight
    const send = [...reply.querySelectorAll('button')].at(-1)
    if (send === undefined) throw new Error('no Send')
    await expect
      .poll(() => send.getBoundingClientRect().bottom <= Math.min(window.innerHeight, box(reply).bottom) + 1)
      .toBe(true)
    expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(box(reply).top)
    await view.unmount()
  })

  it('opens the discussion from Discuss on the artifact page, and its card returns to the artifact (T2 to T4 to T2)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('artifactTablet')
    await expect.poll(() => root.querySelector('[data-figma="button · Discuss"] button')).not.toBeNull()
    const discuss = root.querySelector('[data-figma="button · Discuss"] button')
    if (!(discuss instanceof HTMLElement)) throw new Error('no Discuss')
    await userEvent.click(discuss)
    await expect.poll(() => root.querySelector('[data-figma="artifact · discussing"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    const card = root.querySelector('button[aria-label="Back to Skill eval pass rates"]')
    if (!(card instanceof HTMLElement)) throw new Error('no card')
    await userEvent.click(card)
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="artifact · discussing"]')).toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    await view.unmount()
  })
})

describe('the discussion page on the phone (d-107)', () => {
  it('keeps the nav and the card at the top and the reply box at the bottom while the messages scroll (M9)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('discussPhone')
    await expect.poll(() => root.querySelector('[data-figma="composer · discussion"]')).not.toBeNull()
    const nav = root.querySelector('[data-figma="nav"]')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    const bottom = root.querySelector('[data-figma="composer · discussion"]')
    if (nav === null || card === null || bottom === null) throw new Error('no discussion page')
    // The tab bar hides, as in a chat; the model and context sit in the card.
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    expect(card.querySelector('[data-figma="model and context"]')).not.toBeNull()
    // The messages under the card: one ScrollFrame body, made to overflow as a long discussion would.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no messages')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { nav: box(nav).top, card: box(card).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    // The page and the AppShell detail do not scroll; only the messages between the card and the reply box.
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(nav).top).toBe(before.nav)
    expect(box(card).top).toBe(before.card)
    expect(box(nav).top).toBeGreaterThanOrEqual(0)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(card).bottom).toBeLessThanOrEqual(box(bottom).top)
    await view.unmount()
  })

  it('keeps Send in reach of the wheel when the reply box holds 70 lines (M9)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('discussPhone')
    await expect.poll(() => root.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
    const field = root.querySelector('[data-figma="composer · discussion"] textarea')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    if (!(field instanceof HTMLTextAreaElement) || card === null) throw new Error('no reply box')
    await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
    await new Promise((resolve) => setTimeout(resolve, 300))
    const reply = field.closest('.composer__root')?.parentElement ?? field
    // The reply box keeps the desktop panel's cap: inside the window, at most half of it, under the card.
    expect(box(reply).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(reply).top).toBeGreaterThanOrEqual(box(card).bottom)
    expect(box(reply).height).toBeLessThanOrEqual(window.innerHeight / 2 + 1)
    reply.scrollTop = reply.scrollHeight
    const send = [...reply.querySelectorAll('button')].at(-1)
    if (send === undefined) throw new Error('no Send')
    await expect
      .poll(() => send.getBoundingClientRect().bottom <= Math.min(window.innerHeight, box(reply).bottom) + 1)
      .toBe(true)
    expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(box(reply).top)
    await view.unmount()
  })

  it('opens the discussion from Discuss on the artifact page, and Back returns to the artifact (M2 to M9 to M2)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('artifactPhone')
    await expect.poll(() => root.querySelector('[data-figma="button · Discuss"] button')).not.toBeNull()
    const discuss = root.querySelector('[data-figma="button · Discuss"] button')
    if (!(discuss instanceof HTMLElement)) throw new Error('no Discuss')
    await userEvent.click(discuss)
    await expect.poll(() => root.querySelector('[data-figma="artifact · discussing"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    // M9's card says the source in full, and its one Open in workspace has M9's node id.
    expect(root.querySelector('[data-figma="artifact · discussing"]')?.textContent).toContain('Claude artifact')
    expect(root.querySelector('[data-figma="452:4076"]')).not.toBeNull()
    const back = root.querySelector('button[aria-label="Back to Artifact"]')
    if (!(back instanceof HTMLElement)) throw new Error('no Back')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="artifact · discussing"]')).toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    await view.unmount()
  })

  it("opens File in a project from the artifact page's ⋯ (M2 to M7)", async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('artifactPhone')
    await expect.poll(() => root.querySelector('button[aria-label="File in a project"]')).not.toBeNull()
    const more = root.querySelector('button[aria-label="File in a project"]')
    if (!(more instanceof HTMLElement)) throw new Error('no ⋯')
    await userEvent.click(more)
    await expect.element(page.getByRole('dialog', { name: 'File in a project' })).toBeVisible()
    await expect
      .element(page.getByRole('dialog', { name: 'File in a project' }).getByRole('radio', { name: /skill-evals/ }))
      .toBeChecked()
    await view.unmount()
  })

  it("keeps the discussion open when the card's model picker is pressed (M9)", async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('discussPhone')
    await expect.poll(() => root.querySelector('[data-figma="artifact · discussing"]')).not.toBeNull()
    const model = root.querySelector('[data-figma="artifact · discussing"] [data-figma="model and context"] button')
    if (!(model instanceof HTMLElement)) throw new Error('no model picker')
    await userEvent.click(model)
    await expect.poll(() => document.querySelector('[role="menu"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="artifact · discussing"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="top bar"]')).toBeNull()
    await view.unmount()
  })
})

describe('the proposed update on the tablet (T5)', () => {
  it('keeps the nav, the card and the reply box in view while the messages scroll (T5)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('changeProposedTablet')
    await expect.poll(() => root.querySelector('[data-figma="proposal · UPDATE THIS ARTIFACT"]')).not.toBeNull()
    const nav = root.querySelector('[data-figma="nav"]')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    const bottom = root.querySelector('[data-figma="composer · discussion"]')
    if (nav === null || card === null || bottom === null) throw new Error('no discussion page')
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no messages')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { nav: box(nav).top, card: box(card).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(nav).top).toBe(before.nav)
    expect(box(card).top).toBe(before.card)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(card).bottom).toBeLessThanOrEqual(box(bottom).top)
    await view.unmount()
  })

  it('returns to the artifact page, Updated, on Apply, and shows the applied proposal when reopened (T5 to T2)', async () => {
    await page.viewport(756, 1158)
    const { view, root } = await renderRoot('changeProposedTablet')
    await expect.poll(() => root.querySelector('[data-figma="proposal · UPDATE THIS ARTIFACT"]')).not.toBeNull()
    const apply = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Apply')
    if (apply === undefined) throw new Error('no Apply')
    await userEvent.click(apply)
    // T2: the artifact's page with the tab bar, the pill Updated and where the update came from.
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="artifact · discussing"]')).toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="status"]')?.textContent).toContain('Updated')
    expect(root.querySelector('[data-figma="status"]')?.textContent).toContain('updated just now from the discussion')
    expect(root.textContent).toContain('updated just now')
    // Discuss reopens the discussion, with the applied proposal and no buttons.
    const discuss = root.querySelector('[data-figma="button · Discuss"] button')
    if (!(discuss instanceof HTMLElement)) throw new Error('no Discuss')
    await userEvent.click(discuss)
    await expect.poll(() => root.querySelector('[data-figma="proposal · applied"]')).not.toBeNull()
    expect([...root.querySelectorAll('button')].some((b) => b.textContent === 'Apply')).toBe(false)
    await view.unmount()
  })
})

describe('the proposed update on the phone (M10)', () => {
  it('keeps the nav, the card and the reply box in view while the messages scroll (M10)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('changeProposedPhone')
    await expect.poll(() => root.querySelector('[data-figma="proposal · UPDATE THIS ARTIFACT"]')).not.toBeNull()
    const nav = root.querySelector('[data-figma="nav"]')
    const card = root.querySelector('[data-figma="artifact · discussing"]')
    const bottom = root.querySelector('[data-figma="composer · discussion"]')
    if (nav === null || card === null || bottom === null) throw new Error('no discussion page')
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (body === undefined) throw new Error('no messages')
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    ;(body.firstElementChild ?? body).append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { nav: box(nav).top, card: box(card).top, bottom: box(bottom).bottom }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(nav).top).toBe(before.nav)
    expect(box(card).top).toBe(before.card)
    expect(box(bottom).bottom).toBe(before.bottom)
    expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box(card).bottom).toBeLessThanOrEqual(box(bottom).top)
    await view.unmount()
  })

  it('returns to the artifact page, Updated, on Apply, and shows the applied proposal when reopened (M10 to M2)', async () => {
    await page.viewport(390, 844)
    const { view, root } = await renderRoot('changeProposedPhone')
    await expect.poll(() => root.querySelector('[data-figma="proposal · UPDATE THIS ARTIFACT"]')).not.toBeNull()
    const apply = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Apply')
    if (apply === undefined) throw new Error('no Apply')
    await userEvent.click(apply)
    // M2: the artifact's page with the tab bar, and Updated where the update came from.
    await expect.poll(() => root.querySelector('[data-figma="top bar"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="artifact · discussing"]')).toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    expect(root.textContent).toContain('Updated')
    expect(root.textContent).toContain('updated just now from the discussion')
    // Discuss reopens the discussion, with the applied proposal and no buttons.
    const discuss = root.querySelector('[data-figma="button · Discuss"] button')
    if (!(discuss instanceof HTMLElement)) throw new Error('no Discuss')
    await userEvent.click(discuss)
    await expect.poll(() => root.querySelector('[data-figma="proposal · applied"]')).not.toBeNull()
    expect([...root.querySelectorAll('button')].some((b) => b.textContent === 'Apply')).toBe(false)
    await view.unmount()
  })
})

describe('a long draft (d-107)', () => {
  for (const c of states)
    it(`keeps Send in reach of the wheel when the reply box holds 70 lines: ${c.name}`, async () => {
      await page.viewport(1512, 982)
      const { root } = await renderRoot(c.state)
      await expect.poll(() => root.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
      const field = root.querySelector('[data-figma="composer · discussion"] textarea')
      if (!(field instanceof HTMLTextAreaElement)) throw new Error('no reply box')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      // The box grows to its text a frame or more after the input: let the layout settle before measuring.
      await new Promise((resolve) => setTimeout(resolve, 300))
      // The element around the Composer: the reply layer, which caps the box.
      const reply = field.closest('.composer__root')?.parentElement ?? field
      // The reply box stays inside the window; past its cap it scrolls, and scrolled to its end Send is in view.
      expect(reply.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(reply.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
      expect(reply.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight / 2 + 1)
      reply.scrollTop = reply.scrollHeight
      const send = [...reply.querySelectorAll('button')].at(-1)
      if (send === undefined) throw new Error('no Send')
      await expect
        .poll(
          () =>
            send.getBoundingClientRect().bottom <=
            Math.min(window.innerHeight, reply.getBoundingClientRect().bottom) + 1,
        )
        .toBe(true)
      expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(reply.getBoundingClientRect().top)
    })

  for (const c of states)
    it(`keeps the messages and all of Send in view in a short window: ${c.name}`, async () => {
      // 1232 x 400: the header and a half-window reply box would leave the messages no height.
      await page.viewport(1232, 400)
      const { root } = await renderRoot(c.state)
      await expect.poll(() => root.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
      const field = root.querySelector('[data-figma="composer · discussion"] textarea')
      const panel = root.querySelector('[data-figma="discussion panel"]')
      if (!(field instanceof HTMLTextAreaElement) || panel === null) throw new Error('no discussion')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      await new Promise((resolve) => setTimeout(resolve, 300))
      const messages = panel.querySelector<HTMLElement>('.scroll-frame__body')
      if (messages === null) throw new Error('no messages')
      // The messages keep at least a line of reading (a 20 px line, with room to spare).
      expect(messages.clientHeight).toBeGreaterThanOrEqual(40)
      const reply = field.closest('.composer__root')?.parentElement ?? field
      reply.scrollTop = reply.scrollHeight
      const send = [...reply.querySelectorAll('button')].at(-1)
      if (send === undefined) throw new Error('no Send')
      await expect
        .poll(() => send.getBoundingClientRect().bottom <= Math.min(window.innerHeight, box(reply).bottom) + 1)
        .toBe(true)
      expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(Math.max(0, box(reply).top))
    })
})
