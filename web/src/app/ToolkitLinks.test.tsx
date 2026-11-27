import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { cdp, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'

// The Links tab of an open item through the real route (D19, `links` 482:539): the graph and the two panels side by
// side, a tap on an item opening it from writer, a tap on a link's file and line opening the Files tab, and Show on
// map opening the map with writer selected. The app's styles and fonts load as in main.ts, so the test measures the
// real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

async function renderToolkit(state: string) {
  await setViewport(1512, 982)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

function box(root: HTMLElement, selector: string) {
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el.getBoundingClientRect()
}

function pressed(root: HTMLElement) {
  return [...root.querySelectorAll('[data-figma="links graph"] button')]
    .filter((n) => n.getAttribute('aria-pressed') === 'true')
    .map((n) => n.textContent)
}

function button(root: HTMLElement, name: string, within = '[data-figma="links"]') {
  const found = [...root.querySelectorAll(`${within} button`)].find((b) => b.textContent.trim() === name)
  if (!(found instanceof HTMLElement)) throw new Error(`no button ${name}`)
  return found
}

afterEach(() => {
  resetAllStores()
})

describe('the Links tab of an open item (D19)', () => {
  it('draws the graph over the two panels, which sit side by side', async () => {
    const { root } = await renderToolkit('skillLinks')
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeCloseTo(from.top, 0)
    expect(to.left).toBeGreaterThan(from.right)
    expect(from.width).toBeCloseTo(to.width, 0)
    // The graph's nodes: four on the left, seven on the right and writer in the middle, selected.
    const nodes = root.querySelectorAll('[data-figma="links graph"] button')
    expect(nodes).toHaveLength(12)
    const pressed = [...nodes].filter((n) => n.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((n) => n.textContent)).toEqual(['writer'])
    // Each link of the panels has its own row, its file and line at the end.
    expect(root.querySelectorAll('[data-figma^="link · "]')).toHaveLength(11)
  })

  it('opens an item tapped in the graph, from writer', async () => {
    const { root, router } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'audit-slop', '[data-figma="links graph"]'))
    await expect.poll(() => root.querySelector('article[aria-label="audit-slop"]')).not.toBeNull()
    expect(router.state.location.search).toMatchObject({ state: 'skillLinks' })
  })

  it('opens the file of a link’s line: writer’s own on its Files tab, another item’s in that item', async () => {
    const { root } = await renderToolkit('skillLinks')
    // A link out is written in writer's SKILL.md: writer stays open, on Files.
    await userEvent.click(button(root, 'SKILL.md:8'))
    const tab = () => root.querySelector('article[aria-label="writer"] [role="tab"][aria-selected="true"]')
    await expect.poll(() => tab()?.textContent).toBe('Files')
    await userEvent.click(button(root, 'Links', 'article'))
    await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
    // A link in is written in the other item's file: the agent writer opens, its path badge naming its file.
    await userEvent.click(button(root, 'agents/writer.md:11'))
    await expect.poll(() => root.querySelector('[data-figma="links"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writer"]')?.textContent).toContain('toolkit/agents/writer.md')
  })

  it('shows writer selected on the map from Show on map', async () => {
    const { root } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'Show on map', 'article'))
    await expect.poll(() => root.querySelector('[role="group"][aria-label="Toolkit map"]')).not.toBeNull()
    const pressed = root.querySelector('[role="group"][aria-label="Toolkit map"] button[aria-pressed="true"]')
    expect(pressed?.textContent).toContain('writer')
  })
})

// The Links tab on a tablet (T15 and on): the item replaces the list in the DetailFrame, the graph is narrower and the
// two panels stand one under the other.
async function renderTablet(state: string, tab: string) {
  await setViewport(756, 1158)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await expect.poll(() => root.querySelector(`[data-figma="${tab}"]`)).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

describe('the Links tab on a tablet', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('stands the panels under the graph, each as wide as the item, with no sideways scroll (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    const tab = box(root, '[data-figma="482:908"]')
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeGreaterThan(from.bottom)
    for (const b of [graph, from, to]) {
      expect(b.left).toBeCloseTo(tab.left, 0)
      expect(b.width).toBeCloseTo(tab.width, 0)
    }
    const scroller = root.querySelector('[data-figma="links graph"] .map-graph__scroller')
    if (scroller === null) throw new Error('no graph scroller')
    expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth)
    expect(root.querySelectorAll('[data-figma="links graph"] button')).toHaveLength(12)
    expect(root.querySelectorAll('[data-figma^="link · "]')).toHaveLength(11)
  })

  it('names writer in the back row, with no kind badge or path row (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toContain('writer')
    expect(root.querySelector('article[aria-label="writer"] [data-figma="kind badge"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writer"] [data-figma="path row"]')).toBeNull()
  })

  it('opens an item tapped in the graph on a tablet, from writer (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    await userEvent.click(button(root, 'audit-slop', '[data-figma="links graph"]'))
    await expect.poll(() => root.querySelector('article[aria-label="audit-slop"]')).not.toBeNull()
  })
})

describe('a rule’s Links tab on a tablet (T28)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the rule’s header and says why nothing links to it, the panels under the graph', async () => {
    const { root } = await renderTablet('ruleLinksTablet', 'links')
    const item = root.querySelector('article[aria-label="skills"]')
    if (item === null) throw new Error('no item')
    expect(item.querySelector('[data-figma="kind badge"]')).not.toBeNull()
    expect(item.querySelector('[data-figma="path row"]')).not.toBeNull()
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull()
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeGreaterThan(from.bottom)
    expect(root.querySelector('[data-figma="links graph"]')?.textContent).toContain('No item links here.')
    // The graph holds the rule and the one skill it names.
    expect(root.querySelectorAll('[data-figma="links graph"] button')).toHaveLength(2)
  })
})

describe('an agent’s Links tab on a tablet (T29)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the breadcrumb back to writer over the agent’s header, the two writers each with its own node', async () => {
    const { root } = await renderTablet('agentLinksTablet', 'links')
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toContain('writer')
    expect(root.querySelector('article[aria-label="writing-reviewer"] [data-figma="kind badge"]')).not.toBeNull()
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    expect(nodes).toHaveLength(8)
    expect(nodes.filter((n) => n.textContent === 'writer')).toHaveLength(3)
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(to.top).toBeGreaterThan(from.bottom)
  })
})

describe('a workflow’s Links tab on a tablet (T30)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the workflow’s header over the stage before it and the agent it runs', async () => {
    const { root } = await renderTablet('workflowLinksTablet', 'links')
    expect(root.querySelector('article[aria-label="skill-eval-round"] [data-figma="kind badge"]')).not.toBeNull()
    const names = [...root.querySelectorAll('[data-figma="links graph"] button')].map((n) => n.textContent)
    expect(names).toEqual(['skill-eval-cases', 'eval-cases', 'skill-eval-round', 'skill-eval-cases', 'eval-grader'])
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeGreaterThan(from.bottom)
  })
})

describe('a hook’s Links tab on a tablet (T31)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the hook’s header and puts the rule it enforces on both sides', async () => {
    const { root } = await renderTablet('hookLinksTablet', 'links')
    expect(root.querySelector('article[aria-label="commit-msg"] [data-figma="kind badge"]')).not.toBeNull()
    const names = [...root.querySelectorAll('[data-figma="links graph"] button')].map((n) => n.textContent)
    expect(names).toEqual(['commits-and-prs', 'commit-msg', 'commits-and-prs'])
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(to.top).toBeGreaterThan(from.bottom)
    expect(to.width).toBeCloseTo(from.width, 0)
  })
})

// The Links tab on the phone (M17 and on): the item replaces the list under the back row, the graph stands upright and
// the panels stand one under the other.
async function renderPhone(state: string) {
  await setViewport(390, 806)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

describe('the Links tab on the phone (M17)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('stands the graph upright over the panels, with no sideways scroll', async () => {
    const { root } = await renderPhone('skillLinksPhone')
    const tab = box(root, '[data-figma="links"]')
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeGreaterThan(from.bottom)
    for (const b of [graph, from, to]) {
      expect(b.left).toBeCloseTo(tab.left, 0)
      expect(b.width).toBeCloseTo(tab.width, 0)
    }
    const scroller = root.querySelector('[data-figma="links graph"] .map-graph__scroller')
    if (scroller === null) throw new Error('no graph scroller')
    expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth)
    // The items that name writer over it, the items it names under it.
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    expect(nodes).toHaveLength(12)
    // The phone's graph draws writer's lines upright with writer selected; writer is the fifth node, in the middle.
    expect(nodes.filter((n) => n.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
    expect(nodes[4]?.textContent).toBe('writer')
    const focus = nodes[4]?.getBoundingClientRect()
    const first = nodes[0]?.getBoundingClientRect()
    const last = nodes.at(-1)?.getBoundingClientRect()
    if (focus === undefined || first === undefined || last === undefined) throw new Error('no nodes')
    expect(first.bottom).toBeLessThan(focus.top)
    expect(last.top).toBeGreaterThan(focus.bottom)
  })

  it('names writer in the back row with icon buttons, and opens an item tapped in the graph (M17)', async () => {
    const { root } = await renderPhone('skillLinksPhone')
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toContain('writer')
    expect(root.querySelector('article[aria-label="writer"] [data-figma="kind badge"]')).toBeNull()
    await userEvent.click(button(root, 'audit-slop', '[data-figma="links graph"]'))
    await expect.poll(() => root.querySelector('article[aria-label="audit-slop"]')).not.toBeNull()
  })
})

describe('a rule’s Links tab on the phone (M31)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the rule’s header and puts the reason in the side over the rule', async () => {
    const { root } = await renderPhone('ruleLinksPhone')
    const item = root.querySelector('article[aria-label="skills"]')
    if (item === null) throw new Error('no item')
    expect(item.querySelector('[data-figma="kind badge"]')).not.toBeNull()
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull()
    const reason = [...root.querySelectorAll('[data-figma="links graph"] p')].find((p) =>
      p.textContent.startsWith('No item links here.'),
    )
    const rule = [...root.querySelectorAll('[data-figma="links graph"] button')].find((n) => n.textContent === 'skills')
    if (reason === undefined || rule === undefined) throw new Error('no reason or rule')
    expect(reason.getBoundingClientRect().bottom).toBeLessThan(rule.getBoundingClientRect().top)
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
  })
})

describe('an agent’s Links tab on the phone (M32)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('opens under Back to Toolkit with the agent’s header, the two writers over it, each with its own node', async () => {
    const { root } = await renderPhone('agentLinksPhone')
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writing-reviewer"] [data-figma="kind badge"]')).not.toBeNull()
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    expect(nodes.map((n) => n.textContent)).toEqual([
      'writer',
      'writer',
      'writing',
      'ste100',
      'writing-reviewer',
      'writer',
      'writing',
      'ste100',
    ])
    // The two writers over the agent sit side by side, on one row.
    const [skill, agent] = nodes.map((n) => n.getBoundingClientRect())
    if (skill === undefined || agent === undefined) throw new Error('no writers')
    expect(agent.top).toBeCloseTo(skill.top, 0)
    expect(agent.left).toBeGreaterThan(skill.right)
  })
})

describe('a workflow’s Links tab on the phone (M33)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the workflow’s header, the stage before it and the agent it runs on a row each side', async () => {
    const { root } = await renderPhone('workflowLinksPhone')
    expect(root.querySelector('article[aria-label="skill-eval-round"] [data-figma="kind badge"]')).not.toBeNull()
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    expect(nodes.map((n) => n.textContent)).toEqual([
      'skill-eval-cases',
      'eval-cases',
      'skill-eval-round',
      'skill-eval-cases',
      'eval-grader',
    ])
    const tops = nodes.map((n) => Math.round(n.getBoundingClientRect().top))
    expect(tops[1]).toBe(tops[0])
    expect(tops[4]).toBe(tops[3])
    expect(tops[2]).toBeGreaterThan(tops[0] ?? 0)
    expect(tops[3]).toBeGreaterThan(tops[2] ?? 0)
  })
})

describe('a hook’s Links tab on the phone (M34)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps the hook’s header and puts the rule it enforces over it and under it', async () => {
    const { root } = await renderPhone('hookLinksPhone')
    expect(root.querySelector('article[aria-label="commit-msg"] [data-figma="kind badge"]')).not.toBeNull()
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    expect(nodes.map((n) => n.textContent)).toEqual(['commits-and-prs', 'commit-msg', 'commits-and-prs'])
    const [over, hook, under] = nodes.map((n) => n.getBoundingClientRect())
    if (over === undefined || hook === undefined || under === undefined) throw new Error('no nodes')
    expect(over.bottom).toBeLessThan(hook.top)
    expect(under.top).toBeGreaterThan(hook.bottom)
    expect(under.left).toBeCloseTo(over.left, 0)
  })
})

// A tap on a link's file and line opens that file on its item's Files tab: the item's tree with the file selected, and
// the file in the viewer.
describe('a link’s file on its item’s Files tab (D19)', () => {
  it('opens SKILL.md:8 on writer’s Files tab with the tree and SKILL.md shown', async () => {
    const { root } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'SKILL.md:8'))
    const item = () => root.querySelector('article[aria-label="writer"]')
    await expect.poll(() => item()?.querySelector('[data-figma="tree"] [role="treeitem"]')).not.toBeNull()
    const selected = item()?.querySelector('[data-figma="tree"] [role="treeitem"][aria-selected="true"]')
    expect(selected?.textContent).toContain('SKILL.md')
    const viewer = item()?.querySelector('[data-figma="viewer"]')
    expect(viewer?.getAttribute('aria-label')).toBe('SKILL.md')
    expect(viewer?.textContent).toContain('The writing rules in')
  })

  it('opens agents/writer.md:11 on the agent writer’s Files tab with writer.md shown', async () => {
    const { root } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'agents/writer.md:11'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"] [data-figma="tree"]')).not.toBeNull()
    const viewer = root.querySelector('article[aria-label="writer"] [data-figma="viewer"]')
    expect(viewer?.getAttribute('aria-label')).toBe('writer.md')
    expect(viewer?.querySelector('[data-figma="code"], [data-figma="rendered markdown"]')).not.toBeNull()
  })
})

// A link names a line of its file: the file opens on its source at that line, scrolled into the viewer, and another line
// of the same file opens there instead.
describe('a link’s line in its file (D19)', () => {
  function shownLine(root: HTMLElement, line: number) {
    return root.querySelector(`article[aria-label="writer"] [data-figma="viewer"] [data-line="${String(line)}"]`)
  }

  it('opens SKILL.md:8 on the source at line 8, in view, and SKILL.md:118 at line 118', async () => {
    const { root } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'SKILL.md:8'))
    await expect.poll(() => shownLine(root, 8)).not.toBeNull()
    const viewer = root.querySelector('article[aria-label="writer"] [data-figma="viewer"]')
    if (!(viewer instanceof HTMLElement)) throw new Error('no viewer')
    expect(viewer.getAttribute('aria-label')).toBe('SKILL.md')
    // The line's number and its text: the code row after the number.
    const eight = shownLine(root, 8)
    expect(eight?.textContent).toBe('8')
    expect(eight?.nextElementSibling?.textContent).toContain('The writing rules in')
    // The line is inside the viewer's visible box.
    const seen = viewer.getBoundingClientRect()
    const at = eight?.getBoundingClientRect()
    if (at === undefined) throw new Error('no line 8')
    expect(at.top).toBeGreaterThanOrEqual(seen.top)
    expect(at.bottom).toBeLessThanOrEqual(seen.bottom)
    // Another line of the same file opens at that line.
    await userEvent.click(button(root, 'Links', 'article'))
    await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
    await userEvent.click(button(root, 'SKILL.md:118'))
    await expect.poll(() => shownLine(root, 118)).not.toBeNull()
    expect(shownLine(root, 118)?.nextElementSibling?.textContent).toContain('audit-slop')
    expect(shownLine(root, 8)).toBeNull()
  })
})

// The graph's lines in canvas px: where each starts and ends (its path's first and last points), and whether it is lit.
function graphLines(root: HTMLElement) {
  return [...root.querySelectorAll('[data-figma="links graph"] path.map-graph__edge')].map((path) => {
    const numbers = (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
    const [x1 = Number.NaN, y1 = Number.NaN] = numbers
    const [x2 = Number.NaN, y2 = Number.NaN] = numbers.slice(-2)
    return { start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, lit: path.hasAttribute('data-lit') }
  })
}

// Each node's box in canvas px (its foreignObject), with its name and its button.
function graphNodes(root: HTMLElement) {
  return [...root.querySelectorAll('[data-figma="links graph"] foreignObject')].map((box) => {
    const node = box.querySelector('button')
    if (node === null) throw new Error('no node button')
    const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((a) => Number(box.getAttribute(a)))
    return { name: node.textContent, node, x: x ?? 0, y: y ?? 0, width: width ?? 0, height: height ?? 0 }
  })
}

// Whether a point lies on a box's edge, within a pixel.
function onEdge(p: { x: number; y: number }, b: { x: number; y: number; width: number; height: number }) {
  const inside = p.x >= b.x - 1 && p.x <= b.x + b.width + 1 && p.y >= b.y - 1 && p.y <= b.y + b.height + 1
  const near = Math.min(
    Math.abs(p.x - b.x),
    Math.abs(p.x - b.x - b.width),
    Math.abs(p.y - b.y),
    Math.abs(p.y - b.y - b.height),
  )
  return inside && near <= 1
}

describe('the phone’s links graph draws its lines (M17)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('draws a line from writer to each linked item, with writer selected, also under the pointer', async () => {
    const { root } = await renderPhone('skillLinksPhone')
    const nodes = graphNodes(root)
    const focus = nodes[4]
    if (focus === undefined) throw new Error('no open item')
    expect(focus.name).toBe('writer')
    const sides = nodes.filter((n) => n !== focus)
    const lines = graphLines(root)
    // One line for each of the eleven linked items, each between writer and a node of its own.
    expect(lines).toHaveLength(11)
    const joined = lines.map((l) => {
      const other = onEdge(l.start, focus) ? l.end : onEdge(l.end, focus) ? l.start : null
      expect(other).not.toBeNull()
      return sides.findIndex((n) => other !== null && onEdge(other, n))
    })
    expect(joined.every((i) => i >= 0)).toBe(true)
    expect(new Set(joined).size).toBe(11)
    // writer is selected as the tab opens, so all its lines are lit.
    expect(focus.node.getAttribute('aria-pressed')).toBe('true')
    expect(lines.every((l) => l.lit)).toBe(true)
    // The pointer over a side item lights no line of its own on the phone: writer stays selected.
    await userEvent.hover(button(root, 'audit-slop', '[data-figma="links graph"]'))
    expect(graphLines(root).filter((l) => l.lit)).toHaveLength(11)
    expect(graphNodes(root)[4]?.node.getAttribute('aria-pressed')).toBe('true')
  })
})

// On the desktop and tablet the pointer over a side item, or the keyboard focus on it, lights only its line and dims
// the other side items; it opens nothing. When the pointer leaves and the focus goes, writer's lines all light again.
async function expectHoverAndFocus(root: HTMLElement) {
  const audit = () => button(root, 'audit-slop', '[data-figma="links graph"]')
  const lit = () => graphLines(root).filter((l) => l.lit)
  expect(lit()).toHaveLength(11)
  const onlyAudit = async () => {
    await expect.poll(() => lit()).toHaveLength(1)
    const node = graphNodes(root).find((n) => n.name === 'audit-slop')
    const line = lit()[0]
    if (node === undefined || line === undefined) throw new Error('no audit-slop or lit line')
    expect(onEdge(line.start, node) || onEdge(line.end, node)).toBe(true)
    expect(graphNodes(root).filter((n) => n.node.dataset.state === 'dim')).toHaveLength(10)
    expect(root.querySelector('article[aria-label="audit-slop"]')).toBeNull()
  }
  await userEvent.hover(audit())
  await onlyAudit()
  await userEvent.unhover(audit())
  await expect.poll(() => lit()).toHaveLength(11)
  audit().focus()
  await onlyAudit()
  audit().blur()
  await expect.poll(() => lit()).toHaveLength(11)
  expect(graphNodes(root)[4]?.node.getAttribute('aria-pressed')).toBe('true')
}

describe('the pointer and the focus on the links graph (D19, T15)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('lights a side item’s line on hover and on keyboard focus on the desktop (D19)', async () => {
    const { root } = await renderToolkit('skillLinks')
    await expectHoverAndFocus(root)
  })

  it('lights a side item’s line on hover and on keyboard focus on a tablet (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    await expectHoverAndFocus(root)
  })
})

// A colour as the browser computes it, from a CSS value such as a token's variable.
function colourOf(root: HTMLElement, value: string) {
  const probe = document.createElement('span')
  probe.style.color = value
  root.append(probe)
  const colour = getComputedStyle(probe).color
  probe.remove()
  return colour
}

describe('the links graph’s nodes and lines (D19)', () => {
  it('draws the side items in a muted kind border with the icon in the kind colour, and no dot at a line’s end', async () => {
    const { root } = await renderToolkit('skillLinks')
    const nodes = [...root.querySelectorAll('[data-figma="links graph"] button')]
    // audit-slop is a skill writer names; it is not selected.
    const side = nodes.find((n) => n.textContent === 'audit-slop')
    const icon = side?.firstElementChild
    if (side === undefined || icon === null || icon === undefined) throw new Error('no audit-slop')
    expect(side.getAttribute('aria-pressed')).toBe('false')
    expect(getComputedStyle(side).borderTopColor).toBe(colourOf(root, 'var(--colors-kind-border-skill)'))
    expect(getComputedStyle(side).borderTopColor).not.toBe(colourOf(root, 'var(--colors-kind-skill)'))
    expect(getComputedStyle(icon).color).toBe(colourOf(root, 'var(--colors-kind-skill)'))
    // The open item's name is in the label style (14/20, 493:81), not the side items' mono.
    const focus = nodes.find((n) => n.getAttribute('aria-pressed') === 'true')
    const name = focus?.lastElementChild
    const sideName = side.lastElementChild
    if (name === null || name === undefined || sideName === null) throw new Error('no names')
    expect(getComputedStyle(name).fontSize).toBe('14px')
    expect(Number.parseFloat(getComputedStyle(name).lineHeight)).toBeCloseTo(20, 2)
    expect(getComputedStyle(name).fontFamily).not.toBe(getComputedStyle(sideName).fontFamily)
    // Eleven lines, none ending in a dot (493:89).
    expect(root.querySelectorAll('[data-figma="links graph"] path.map-graph__edge')).toHaveLength(11)
    expect(root.querySelectorAll('[data-figma="links graph"] circle')).toHaveLength(0)
  })

  it('draws the open item 150 × 40, as Figma does (493:78)', async () => {
    const { root } = await renderToolkit('skillLinks')
    const focus = graphNodes(root).find((n) => n.node.getAttribute('aria-pressed') === 'true')
    if (focus === undefined) throw new Error('no open item')
    expect(focus.name).toBe('writer')
    const rect = focus.node.getBoundingClientRect()
    expect([rect.width, rect.height]).toEqual([150, 40])
  })

  it('draws each link row’s node in the faint kind border', async () => {
    const { root } = await renderToolkit('skillLinks')
    const row = root.querySelector('[data-figma="link · audit-slop · SKILL.md:118"] button')
    if (!(row instanceof HTMLElement)) throw new Error('no audit-slop row')
    expect(getComputedStyle(row).borderTopColor).toBe(colourOf(root, 'var(--colors-kind-border-faint-skill)'))
  })
})

// The open item's node in the graph (the pressed node), its box and whether its name shows whole: no element of its
// label is wider than its box.
function openNode(root: HTMLElement) {
  const node = root.querySelector('[data-figma="links graph"] button[aria-pressed="true"]')
  const label = node?.lastElementChild
  if (!(node instanceof HTMLElement) || label === null || label === undefined) throw new Error('no open item')
  const whole = [label, ...label.querySelectorAll('*')].every((el) => el.scrollWidth <= el.clientWidth)
  return { name: node.textContent, rect: node.getBoundingClientRect(), whole }
}

describe('the open item’s name in the links graph (D19, T29, M32)', () => {
  afterEach(async () => {
    await unmountRendered()
    await setViewport(1512, 982)
  })

  it('keeps writer’s open node Figma’s 150 wide on the desktop (D19)', async () => {
    const { root } = await renderToolkit('skillLinks')
    const open = openNode(root)
    expect(open.name).toBe('writer')
    expect(open.whole).toBe(true)
    expect(open.rect.width).toBe(150)
  })

  it('shows writing-reviewer’s whole name in its open node on a tablet (T29)', async () => {
    const { root } = await renderTablet('agentLinksTablet', 'links')
    await expect.poll(() => openNode(root).rect.width).toBe(180)
    const open = openNode(root)
    expect(open.name).toBe('writing-reviewer')
    expect(open.whole).toBe(true)
    expect(open.rect.height).toBe(40)
  })

  it('shows writing-reviewer’s whole name in its open node on the phone (M32)', async () => {
    const { root } = await renderPhone('agentLinksPhone')
    await expect.poll(() => openNode(root).rect.width).toBe(162)
    const open = openNode(root)
    expect(open.name).toBe('writing-reviewer')
    expect(open.whole).toBe(true)
    expect(open.rect.height).toBe(40)
  })
})

// A mouse that stays where the graph draws selects no side item (NCC-158): Chromium sends pointerover to the node
// drawn under it, and only a move selects. Earlier tests leave the mouse where they clicked.
describe('a mouse that does not move over the links graph (D19)', () => {
  it('keeps writer selected when the graph draws under a still mouse, and selects a side item once it moves', async () => {
    const first = await renderToolkit('skillLinks')
    const place = button(first.root, 'writing', '[data-figma="links graph"]').getBoundingClientRect()
    await unmountRendered()
    await cdp().send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: place.left + place.width / 2,
      y: place.top + place.height / 2,
    })
    const { root } = await renderToolkit('skillLinks')
    await afterRendering()
    await afterRendering()
    expect(pressed(root)).toEqual(['writer'])
    await userEvent.hover(button(root, 'writing', '[data-figma="links graph"]'))
    await expect.poll(() => pressed(root)).toEqual(['writing'])
  })
})
