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
    // T4 434:394, 434:405: the title starts 16 under the 32 px back row, where Figma's is 14 under its 36 px row, so
    // the title's centre stays within a pixel of Figma's; `page`'s 20 is for the meta row it leaves out.
    expect(box('[data-figma="title"]').top - box('[data-figma="back row"]').bottom).toBeCloseTo(16, 0)
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
    // T6 440:1761, 440:1772: the title starts 16 under the back row, as on T4.
    expect(box('[data-figma="title"]').top - box('[data-figma="back row"]').bottom).toBeCloseTo(16, 0)
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

// A script explained on a tablet, tapped again (T6): Back to Files shows the tree with the script still selected; the
// library's FileTree reports no click on the row that is already selected, so the Files tab handles that tap itself
// and the script opens its page again.
describe('the selected script tapped again after Back to Files (T6)', () => {
  it('opens the script’s page again from its selected row', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('scriptExplainedTablet')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="mode row"]')).not.toBeNull()
    const back = [...root.querySelectorAll('[data-figma="back row"] button')].find((el) =>
      el.textContent.includes('Files'),
    )
    if (back === undefined) throw new Error('no Back to Files')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    const check = [...root.querySelectorAll('[role="treeitem"]')].find((r) => r.textContent.startsWith('check'))
    if (check === undefined) throw new Error('no check row')
    expect(check.getAttribute('aria-selected')).toBe('true')
    await userEvent.click(check)
    await expect.poll(() => root.querySelector('[data-figma="mode row"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tree"]')).toBeNull()
    expect(root.querySelector('article h2')?.textContent).toBe('check')
    await view.unmount()
  })
})

// The Files tab of the other kinds on a tablet (T32 to T35): the item keeps its header (the kind badge, the name and the
// path row with where the item is), and the tree and the viewer are two boxes, the viewer under the tree, as on T4.
const tabletKinds = [{ state: 'ruleFilesTablet', item: 'skills', file: 'skills.md', rows: 1, kind: 'Rule' }]
tabletKinds.push({
  state: 'agentFilesTablet',
  item: 'writing-reviewer',
  file: 'writing-reviewer.md',
  rows: 1,
  kind: 'Agent',
})
tabletKinds.push({
  state: 'workflowFilesTablet',
  item: 'skill-eval-round',
  file: 'skill-eval-round.md',
  rows: 8,
  kind: 'Workflow',
})
tabletKinds.push({ state: 'hookFilesTablet', item: 'commit-msg', file: 'test-commit-msg', rows: 2, kind: 'Hook' })

describe('the Files tab of a rule, an agent, a workflow and a hook on a tablet (T32 to T35)', () => {
  it.each(tabletKinds)('keeps $state’s header and puts $file under its $rows tree rows', async (kind) => {
    await page.viewport(756, 1158)
    const view = await renderToolkit(kind.state)
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="viewer"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    expect(root.querySelector(`article[aria-label="${kind.item}"]`)).not.toBeNull()
    // The header of the Overview: the kind badge, and the path row with the item's place in the toolkit.
    expect(root.querySelector('[data-figma="kind badge"]')?.textContent).toBe(kind.kind)
    expect(root.querySelector('[data-figma="path row"]')?.textContent).toContain('toolkit/')
    expect(root.querySelector('[data-figma="path row"]')?.textContent).toContain('changed 6 days ago')
    // Two boxes as wide as the item, the viewer under the tree, and no file browser box around them.
    const tree = box('[data-figma="tree"]')
    const viewer = box('[data-figma="viewer"]')
    expect(viewer.left).toBeCloseTo(tree.left, 0)
    expect(viewer.width).toBeCloseTo(tree.width, 0)
    expect(viewer.top).toBeGreaterThan(tree.bottom)
    expect(root.querySelector('[data-figma="file browser"]')).toBeNull()
    expect(root.querySelectorAll('[data-figma="tree"] [role="treeitem"]')).toHaveLength(kind.rows)
    expect(root.querySelector(`[data-figma="viewer"][aria-label="${kind.file}"]`)).not.toBeNull()
    await view.unmount()
  })
})

// The Files tab on the phone (M5): the title over the tabs with no path row, the copy button in the back row, the
// skill's folder over the tree and no viewer under it. The tree marks the file opened last; a file with no view only
// becomes the marked one, and a file with a view opens on a page of its own, under Back to Files.
describe('the Files tab on the phone (M5)', () => {
  it('shows the tree with no viewer, and opens a file with a view on its own page', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('skillFilesPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    // No kind badge, no path row and no viewer; the copy button sits in the back row and copies the skill's path.
    expect(root.querySelector('[data-figma="kind badge"]')).toBeNull()
    expect(root.querySelector('[data-figma="path badge"]')).toBeNull()
    expect(root.querySelector('[data-figma="viewer"]')).toBeNull()
    expect(root.querySelector('[data-figma="back row"] [aria-label="Copy toolkit/skills/writer/"]')).not.toBeNull()
    // M5 435:212, 435:213: the skill's folder over the tree, the tree as wide as the item.
    const folder = box('[data-figma="toolkit/skills/writer/"]')
    const tree = box('[data-figma="tree"]')
    expect(tree.top).toBeGreaterThan(folder.bottom)
    expect(tree.width).toBeCloseTo(box('[data-figma="toolkit"]').width, 0)
    const row = (name: string) => {
      const el = [...root.querySelectorAll('[role="treeitem"]')].find((r) => r.textContent.startsWith(name))
      if (el === undefined) throw new Error(`no ${name} row`)
      return el
    }
    expect(row('check').getAttribute('aria-selected')).toBe('true')
    // A file the state has no view of becomes the marked one, with no page.
    await userEvent.click(row('ste-dict'))
    await expect.poll(() => row('ste-dict').getAttribute('aria-selected')).toBe('true')
    expect(root.querySelector('[data-figma="tree"]')).not.toBeNull()
    // check has a view: it opens on a page of its own, under Back to Files, and Back comes back to the tree.
    await userEvent.click(row('check'))
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).toBeNull()
    const back = [...root.querySelectorAll('[data-figma="back row"] button')].find((el) =>
      el.textContent.includes('Files'),
    )
    if (back === undefined) throw new Error('no Back to Files')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    expect(row('check').getAttribute('aria-selected')).toBe('true')
    await view.unmount()
  })
})

// A script on its own page on the phone, on Code (M6): no title, the path badge names the script with no copy button,
// and the back row's copy button copies its path in the toolkit. The source wraps its long lines in a box as wide as
// the item, under the line on what runs it, and nothing scrolls sideways. Explain shows the explanation, and Back to
// Files goes back to the tree.
describe('a script on its own page on the phone (M6)', () => {
  it('shows the source wrapped, switches to Explain and goes back to the tree', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('scriptCodePhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    expect(root.querySelector('[data-figma="tree"]')).toBeNull()
    expect(root.querySelector('article h2')).toBeNull()
    expect(root.querySelector('[data-figma="kind badge"]')).toBeNull()
    expect(root.querySelector('[data-figma="path badge"]')?.textContent).toBe('scripts/check')
    expect(root.querySelector('[data-figma="path badge"] button')).toBeNull()
    expect(
      root.querySelector('[data-figma="back row"] [aria-label="Copy toolkit/skills/writer/scripts/check"]'),
    ).not.toBeNull()
    // M6 435:498, 435:503: what runs the script over the code, the code as wide as the item, with no sideways scroll.
    const code = box('[data-figma="code"]')
    expect(code.top).toBeGreaterThan(box('[data-figma="read-only"]').bottom)
    expect(code.width).toBeCloseTo(box('[data-figma="toolkit"]').width, 0)
    const codeBox = root.querySelector('[data-figma="code"]')
    if (codeBox === null) throw new Error('no code')
    expect(codeBox.scrollWidth).toBeLessThanOrEqual(codeBox.clientWidth)
    // Explain shows the explanation in place of the source; Back to Files shows the tree with the script marked.
    const explain = [...root.querySelectorAll('[data-figma="toggle · Explain | Code"] label')].find(
      (el) => el.textContent === 'Explain',
    )
    if (explain === undefined) throw new Error('no Explain item')
    await userEvent.click(explain)
    await expect.poll(() => root.querySelector('[data-figma="explain"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="code"]')).toBeNull()
    const back = [...root.querySelectorAll('[data-figma="back row"] button')].find((el) =>
      el.textContent.includes('Files'),
    )
    if (back === undefined) throw new Error('no Back to Files')
    await userEvent.click(back)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    expect(root.querySelector('article h2')?.textContent).toBe('writer')
    await view.unmount()
  })
})

// A script explained on its own page on the phone (M8): the explanation opens on Explain with no box, its overview
// card at the item's edge, and each step's line link under its text, at the text's start; a line link shows the source
// on Code.
describe('a script explained on its own page on the phone (M8)', () => {
  it('draws the explanation at the item’s edge with the line links under the steps', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('scriptExplainedPhone')
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
    const item = box('[data-figma="toolkit"]')
    // M8 440:1631: the overview card spans the item, with no box or padding around the explanation.
    const card = box('[data-figma="explain"] section')
    expect(card.left).toBeCloseTo(item.left, 0)
    expect(card.width).toBeCloseTo(item.width, 0)
    // M8 440:1648: step 1's line link sits under its text, at the text's start.
    const step = root.querySelector('[data-figma="explain"] li')
    const text = step?.children[1]?.getBoundingClientRect()
    const link = [...(step?.querySelectorAll('button') ?? [])].find((el) => el.textContent === 'line 406')
    if (text === undefined || link === undefined) throw new Error('no step 1')
    expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(text.bottom)
    expect(link.getBoundingClientRect().left).toBeCloseTo(text.left, 0)
    await userEvent.click(link)
    await expect.poll(() => root.querySelector('[data-figma="code"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="explain"]')).toBeNull()
    await view.unmount()
  })
})

// The Files tab of the other kinds on the phone (M35 to M38): the item keeps its header (the kind badge with when it
// changed, the name and the path badge with its copy button), and under the tabs the item's folder in the toolkit and
// the tree with no viewer and no row marked. A file with a view opens on a page of its own.
const phoneKinds = [
  { state: 'ruleFilesPhone', item: 'skills', folder: 'toolkit/rules/', rows: 1, kind: 'Rule', file: 'skills.md' },
]
phoneKinds.push({
  state: 'agentFilesPhone',
  item: 'writing-reviewer',
  folder: 'toolkit/agents/',
  rows: 1,
  kind: 'Agent',
  file: 'writing-reviewer.md',
})
phoneKinds.push({
  state: 'workflowFilesPhone',
  item: 'skill-eval-round',
  folder: 'toolkit/workflows/',
  rows: 8,
  kind: 'Workflow',
  file: 'skill-eval-round.md',
})
phoneKinds.push({
  state: 'hookFilesPhone',
  item: 'commit-msg',
  folder: 'toolkit/hooks/',
  rows: 2,
  kind: 'Hook',
  file: 'test-commit-msg',
})

describe('the Files tab of a rule, an agent, a workflow and a hook on the phone (M35 to M38)', () => {
  it.each(phoneKinds)('keeps $state’s header over $folder and its $rows tree rows', async (kind) => {
    await page.viewport(390, 806)
    const view = await renderToolkit(kind.state)
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    expect(root.querySelector(`article[aria-label="${kind.item}"]`)).not.toBeNull()
    expect(root.querySelector('[data-figma="kind badge"]')?.textContent).toBe(kind.kind)
    expect(root.querySelector('[data-figma="meta row"]')?.textContent).toContain('changed 6 days ago')
    expect(root.querySelector('[data-figma="path badge"] button')).not.toBeNull()
    expect(root.querySelector('[data-figma="back row"] [data-figma="button · copy"]')).toBeNull()
    // The folder over the tree, the tree as wide as the item, no viewer and no row marked.
    expect(box('[data-figma="tree"]').top).toBeGreaterThan(box(`[data-figma="${kind.folder}"]`).bottom)
    expect(box('[data-figma="tree"]').width).toBeCloseTo(box('[data-figma="toolkit"]').width, 0)
    expect(root.querySelector('[data-figma="viewer"]')).toBeNull()
    const rows = [...root.querySelectorAll('[data-figma="tree"] [role="treeitem"]')]
    expect(rows).toHaveLength(kind.rows)
    expect(rows.filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(0)
    // The file opens on a page of its own, under Back to Files.
    const row = rows.find((r) => r.textContent.startsWith(kind.file))
    if (row === undefined) throw new Error(`no ${kind.file} row`)
    await userEvent.click(row)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).toBeNull()
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toContain('Files')
    expect(root.querySelector('[data-figma="path badge"]')?.textContent).toBe(kind.file)
    await view.unmount()
  })
})

// Copy on a rule's Files tab (D33, M35) puts the file's path in the toolkit on the clipboard. A rule's item path is
// the file itself, so the file's name is not added to it a second time.
describe('copy on the Files tab of a rule (D33, M35)', () => {
  async function copiedBy(state: string, width: number, height: number, press: (root: HTMLElement) => Promise<void>) {
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
    await page.viewport(width, height)
    const view = await renderToolkit(state)
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    await press(root)
    await expect.poll(() => copied).toHaveLength(1)
    await view.unmount()
    return copied[0]
  }

  it('copies the rule’s file from the viewer’s bar on the desktop (D33)', async () => {
    const copied = await copiedBy('ruleFiles', 1512, 982, async (root) => {
      const copy = root.querySelector('[data-figma="viewer"] [aria-label="Copy skills.md"]')
      if (copy === null) throw new Error('no copy button in the viewer')
      await userEvent.click(copy)
    })
    expect(copied).toBe('toolkit/rules/skills.md')
  })

  it('copies the rule’s file from the back row of its own page on the phone (M35)', async () => {
    const copied = await copiedBy('ruleFilesPhone', 390, 806, async (root) => {
      const row = [...root.querySelectorAll('[data-figma="tree"] [role="treeitem"]')].find((r) =>
        r.textContent.startsWith('skills.md'),
      )
      if (row === undefined) throw new Error('no skills.md row')
      await userEvent.click(row)
      await expect.poll(() => root.querySelector('[data-figma="tree"]')).toBeNull()
      const copy = root.querySelector('[data-figma="back row"] button[aria-label^="Copy "]')
      if (copy === null) throw new Error('no copy button in the back row')
      await userEvent.click(copy)
    })
    expect(copied).toBe('toolkit/rules/skills.md')
  })
})

// A rule's file on its own page on the phone (M35, then the file tapped): the path row names the file, as M6's does,
// and nothing on the page names the rule's file twice (a rule's item path is the file itself).
describe('a rule’s file on its own page on the phone (M35)', () => {
  it('names skills.md in the path row and never the doubled path', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('ruleFilesPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).not.toBeNull()
    const row = [...root.querySelectorAll('[data-figma="tree"] [role="treeitem"]')].find((r) =>
      r.textContent.startsWith('skills.md'),
    )
    if (row === undefined) throw new Error('no skills.md row')
    await userEvent.click(row)
    await expect.poll(() => root.querySelector('[data-figma="tree"]')).toBeNull()
    expect(root.querySelector('[data-figma="path badge"]')?.textContent).toBe('skills.md')
    expect(root.textContent).not.toContain('skills.mdskills.md')
    expect(root.innerHTML).not.toContain('skills.mdskills.md')
    expect(root.querySelector('[data-figma="back row"] [aria-label="Copy toolkit/rules/skills.md"]')).not.toBeNull()
    await view.unmount()
  })
})
