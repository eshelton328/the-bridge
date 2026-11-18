import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Files tab of an open item through the real route (D6, `file browser` 432:2141), as ToolkitCodeWrap.test.tsx
// tests the phone's code: on the desktop the tree and the viewer sit side by side, the browser runs to the item
// pane's foot with no space under it, the pane does not scroll, and a click on a file in the tree opens it in the
// viewer. The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderToolkit(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  return testRender(<RouterProvider router={router} />)
}

afterEach(() => {
  resetAllStores()
})

describe('the Files tab of an open item (D6)', () => {
  it('lays the tree and the viewer side by side, down to the pane’s foot, and opens the file clicked', async () => {
    await page.viewport(1512, 982)
    const view = await renderToolkit('skillFiles')
    onTestFinished(view.unmount)
    // Earlier tests leave their renders in the page, so each query looks only in this one.
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="file browser"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    const browser = box('[data-figma="file browser"]')
    const tree = box('[data-figma="tree"]')
    const viewer = box('[data-figma="viewer"]')
    const item = box('[data-figma="toolkit item"]')
    // Side by side: the viewer starts where the tree ends, both as high as the browser.
    expect(viewer.left).toBeCloseTo(tree.right, 0)
    expect(tree.top).toBeCloseTo(viewer.top, 0)
    expect(tree.height).toBeCloseTo(viewer.height, 0)
    // The browser ends at the item pane's foot, and the pane does not scroll.
    expect(browser.bottom).toBeCloseTo(item.bottom, 0)
    const detail = root.querySelector('main.app-shell__detail')
    if (detail === null) throw new Error('no detail')
    expect(detail.scrollHeight).toBeLessThanOrEqual(detail.clientHeight)
    // The script check is selected at first; a click on another file opens it in the viewer, with its bar only.
    expect(root.querySelector('[aria-label="scripts/check"]')).not.toBeNull()
    const doc = [...root.querySelectorAll('[role="treeitem"]')].find((el) => el.textContent.startsWith('doc.md'))
    if (doc === undefined) throw new Error('no doc.md row')
    await userEvent.click(doc)
    await expect.poll(() => root.querySelector('[aria-label="references/doc.md"]')).not.toBeNull()
    expect(root.querySelector('[aria-label="scripts/check"]')).toBeNull()
    await view.unmount()
  })
})

describe('a script explained on the Files tab (D10)', () => {
  it('opens on Explain under the bar’s switch, goes to Code and back, and opens another script on Explain', async () => {
    await page.viewport(1512, 982)
    const view = await renderToolkit('scriptExplained')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    const bar = box('[data-figma="viewer bar"]')
    const toggle = box('[data-figma="toggle · Explain | Code"]')
    const explain = box('[data-figma="explain"]')
    const usedBy = box('[data-figma="used by"]')
    // D10 440:1418: the switch sits in the bar, before the copy icon; the explanation starts under the bar and the
    // line on what uses the file follows it.
    expect(toggle.top).toBeGreaterThanOrEqual(bar.top)
    expect(toggle.bottom).toBeLessThanOrEqual(bar.bottom)
    const copy = root.querySelector('[aria-label="Copy scripts/check"]')
    if (copy === null) throw new Error('no copy button')
    expect(toggle.right).toBeLessThan(copy.getBoundingClientRect().left)
    expect(explain.top).toBeCloseTo(bar.bottom, 0)
    expect(usedBy.top).toBeCloseTo(explain.bottom, 0)
    // The browser still ends at the item pane's foot, and the pane does not scroll.
    expect(box('[data-figma="file browser"]').bottom).toBeCloseTo(box('[data-figma="toolkit item"]').bottom, 0)
    const detail = root.querySelector('main.app-shell__detail')
    if (detail === null) throw new Error('no detail')
    expect(detail.scrollHeight).toBeLessThanOrEqual(detail.clientHeight)
    // Code shows the source in place of the explanation; Explain brings it back.
    const item = (name: string) => {
      const label = [...root.querySelectorAll('[data-figma="toggle · Explain | Code"] label')].find(
        (el) => el.textContent === name,
      )
      if (label === undefined) throw new Error(`no ${name} item`)
      return label
    }
    await userEvent.click(item('Code'))
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="explain"]')).toBeNull()
    await userEvent.click(item('Explain'))
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    // A step's line link shows the source on Code (D10 440:1477, Tap a line to see it in Code).
    const link = [...root.querySelectorAll('[data-figma="explain"] button')].find((el) => el.textContent === 'line 433')
    if (link === undefined) throw new Error('no line 433 link')
    await userEvent.click(link)
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    await userEvent.click(item('Explain'))
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    // On Code, another file opens on its own default view; the script opened again is on Explain.
    await userEvent.click(item('Code'))
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    const row = (name: string) => {
      const el = [...root.querySelectorAll('[role="treeitem"]')].find((r) => r.textContent.startsWith(name))
      if (el === undefined) throw new Error(`no ${name} row`)
      return el
    }
    await userEvent.click(row('doc.md'))
    await expect.poll(() => root.querySelector('[aria-label="references/doc.md"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="toggle · Explain | Code"]')).toBeNull()
    await userEvent.click(row('check'))
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    await view.unmount()
  })
})

// The Files tab of the other kinds (D33 to D36): the same browser with each item's own files, the selected one in the
// viewer. Each lays out as D6's does: the tree and the viewer side by side, down to the item pane's foot.
const otherKinds = [{ state: 'ruleFiles', item: 'skills', file: 'skills.md', rows: 1 }]
otherKinds.push({ state: 'agentFiles', item: 'writing-reviewer', file: 'writing-reviewer.md', rows: 1 })
otherKinds.push({ state: 'workflowFiles', item: 'skill-eval-round', file: 'skill-eval-round.md', rows: 8 })
otherKinds.push({ state: 'hookFiles', item: 'commit-msg', file: 'test-commit-msg', rows: 2 })

describe('the Files tab of a rule, an agent, a workflow and a hook (D33 to D36)', () => {
  it.each(otherKinds)('draws $state’s $rows tree rows beside $file, down to the pane’s foot', async (kind) => {
    await page.viewport(1512, 982)
    const view = await renderToolkit(kind.state)
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="file browser"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    expect(root.querySelector(`article[aria-label="${kind.item}"] [data-figma="file browser"]`)).not.toBeNull()
    const tree = box('[data-figma="tree"]')
    const viewer = box('[data-figma="viewer"]')
    expect(viewer.left).toBeCloseTo(tree.right, 0)
    expect(tree.height).toBeCloseTo(viewer.height, 0)
    expect(box('[data-figma="file browser"]').bottom).toBeCloseTo(box('[data-figma="toolkit item"]').bottom, 0)
    const detail = root.querySelector('main.app-shell__detail')
    if (detail === null) throw new Error('no detail')
    expect(detail.scrollHeight).toBeLessThanOrEqual(detail.clientHeight)
    // The visible rows (a closed folder hides its files) and the selected file in the viewer.
    expect(root.querySelectorAll('[data-figma="tree"] [role="treeitem"]')).toHaveLength(kind.rows)
    expect(root.querySelector(`[data-figma="viewer"][aria-label="${kind.file}"]`)).not.toBeNull()
    await view.unmount()
  })
})

// The Files tab on a tablet (T4): no kind badge, the path row names the skill's folder and its files, and the tree and
// the viewer are two boxes, the viewer under the tree. A Markdown file opens rendered, with the Rendered and Source
// switch under its text and no copy button in the bar.
describe('the Files tab on a tablet (T4)', () => {
  it('puts the viewer under the tree, renders doc.md, shows its source and opens another file', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('skillFilesTablet')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="rendered markdown"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    const tree = box('[data-figma="tree"]')
    const viewer = box('[data-figma="viewer"]')
    // T4 434:408, 434:485: two boxes as wide as the item, the viewer under the tree.
    expect(viewer.left).toBeCloseTo(tree.left, 0)
    expect(viewer.width).toBeCloseTo(tree.width, 0)
    expect(viewer.top).toBeGreaterThan(tree.bottom)
    expect(root.querySelector('[data-figma="file browser"]')).toBeNull()
    // No kind badge; the path row names the skill's folder and its files.
    expect(root.querySelector('[data-figma="kind badge"]')).toBeNull()
    const path = root.querySelector('[data-figma="path row"]')
    expect(path?.textContent).toContain('skills/writer/')
    expect(path?.textContent).toContain('11 files')
    expect(path?.textContent).not.toContain('toolkit/skills/writer/')
    // The viewer's bar has no copy button on a tablet.
    expect(root.querySelector('[aria-label="Copy references/doc.md"]')).toBeNull()
    // The switch sits under the rendered text; Source shows the file's source and keeps the switch.
    const toggle = box('[data-figma="view toggle"]')
    expect(toggle.top).toBeGreaterThan(box('[data-figma="rendered markdown"] p').bottom)
    const item = (name: string) => {
      const label = [...root.querySelectorAll('[data-figma="view toggle"] label')].find((el) => el.textContent === name)
      if (label === undefined) throw new Error(`no ${name} item`)
      return label
    }
    await userEvent.click(item('Source'))
    await expect.poll(() => root.querySelector('[data-figma="viewer"] [data-figma="code"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="viewer"] [data-figma="code"]')?.textContent).toContain('# Docs')
    expect(root.querySelector('[data-figma="rendered markdown"]')).toBeNull()
    await userEvent.click(item('Rendered'))
    await expect.poll(() => root.querySelector('[data-figma="rendered markdown"]')).not.toBeNull()
    // Another file opens under the tree, with its bar only.
    const ticket = [...root.querySelectorAll('[role="treeitem"]')].find((el) => el.textContent.startsWith('ticket.md'))
    if (ticket === undefined) throw new Error('no ticket.md row')
    await userEvent.click(ticket)
    await expect.poll(() => root.querySelector('[aria-label="references/ticket.md"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tree"]')).not.toBeNull()
    await view.unmount()
  })
})

// A script explained on a tablet (T6): the script opens on a page of its own, under Back to Files, with its name and
// path in the item's header, the Explain and Code switch over the box. Back to Files shows the tree with the script
// selected under it; selected again from another file, the script opens its page again.
describe('a script explained on a tablet (T6)', () => {
  it('opens the script on its own page, switches to Code and back, and goes back to the tree', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('scriptExplainedTablet')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    // No tree and no viewer bar: the page names the script.
    expect(root.querySelector('[data-figma="tree"]')).toBeNull()
    expect(root.querySelector('[data-figma="viewer bar"]')).toBeNull()
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toContain('Files')
    expect(root.querySelector('article h2')?.textContent).toBe('check')
    const path = root.querySelector('[data-figma="path row"]')
    expect(path?.textContent).toContain('skills/writer/scripts/check')
    expect(path?.textContent).toContain('Python · 437 lines')
    // T6 440:1918, 440:1925: the switch's row over the box, the box as wide as the item.
    const mode = box('[data-figma="mode row"]')
    const explain = box('[data-figma="explain"]')
    expect(explain.top).toBeGreaterThan(mode.bottom)
    expect(explain.width).toBeCloseTo(mode.width, 0)
    const item = (name: string) => {
      const label = [...root.querySelectorAll('[data-figma="toggle · Explain | Code"] label')].find(
        (el) => el.textContent === name,
      )
      if (label === undefined) throw new Error(`no ${name} item`)
      return label
    }
    // A line link shows the source on Code; Explain brings the explanation back.
    const link = [...root.querySelectorAll('[data-figma="explain"] button')].find((el) => el.textContent === 'line 406')
    if (link === undefined) throw new Error('no line 406 link')
    await userEvent.click(link)
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="explain"]')).toBeNull()
    await userEvent.click(item('Explain'))
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    // Back to Files shows the tree and the item's header; the script in the tree opens its page again.
    const back = [...root.querySelectorAll('[data-figma="back row"] button')].find((el) =>
      el.textContent.includes('Files'),
    )
    if (back === undefined) throw new Error('no Back to Files')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    expect(root.querySelector('article h2')?.textContent).toBe('writer')
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toContain('Toolkit')
    // Back keeps the script selected, shown under the tree; another file opens under the tree, and the script
    // selected again opens its page.
    expect(root.querySelector('[aria-label="scripts/check"]')).not.toBeNull()
    const row = (name: string) => {
      const el = [...root.querySelectorAll('[role="treeitem"]')].find((r) => r.textContent.startsWith(name))
      if (el === undefined) throw new Error(`no ${name} row`)
      return el
    }
    await userEvent.click(row('doc.md'))
    await expect.poll(() => root.querySelector('[aria-label="references/doc.md"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tree"]')).not.toBeNull()
    await userEvent.click(row('check'))
    await expect.poll(() => root.querySelector('[data-figma="mode row"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tree"]')).toBeNull()
    await view.unmount()
  })
})
