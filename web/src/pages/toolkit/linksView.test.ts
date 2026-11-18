import { describe, expect, it } from 'vitest'
import { openFile as openBrowserFile, findFile, sourceAt } from './blocks/filesView.ts'
import { focusId, linkCount, linkFile, linksGraph, sideLabel } from './blocks/linksView.ts'
import { linkLine } from './blocks/linksView.ts'
import { openFile, openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type { ToolkitLinks } from './types.ts'
import type { ToolkitData, ToolkitUi } from './types.ts'

const { skillLinks } = toolkitStates

function linksOf(state: typeof skillLinks): ToolkitLinks {
  const open = openItem(state.data, state.ui)
  if (open?.detail.links === undefined) throw new Error('no links')
  return open.detail.links
}

const writer = { path: 'skills/writer/', name: 'writer', kind: 'skill' as const }

describe('the Links tab (D19)', () => {
  it('opens on Links through ui.itemTab', () => {
    expect(openItem(skillLinks.data, skillLinks.ui)?.tab).toBe('links')
  })

  it('counts every link in the header and each side’s links in its label', () => {
    const links = linksOf(skillLinks)
    expect(linkCount(links)).toBe(11)
    expect(sideLabel(links.from)).toBe('Linked from 4')
    expect(sideLabel(links.to)).toBe('Links to 7')
  })

  it('places each side in its graph order, centred on the tallest column, with the item in the middle', () => {
    const graph = linksGraph(linksOf(skillLinks), writer)
    // D19 493:6: 320 high with its border; the right column starts 46 down, the left one centred on it.
    expect(graph.height).toBe(318)
    const left = graph.nodes.filter((n) => n.id.startsWith('from:'))
    const right = graph.nodes.filter((n) => n.id.startsWith('to:'))
    expect(left.map((n) => n.label)).toEqual(['writer', 'writing-reviewer', 'ste100', 'writing'])
    expect(left.map((n) => n.y)).toEqual([103, 141, 179, 217])
    expect(right.map((n) => n.y)).toEqual([46, 84, 122, 160, 198, 236, 274])
    expect(right.every((n) => n.x === 751) && left.every((n) => n.x === 15)).toBe(true)
    const focus = graph.nodes.find((n) => n.id === focusId)
    expect(focus).toMatchObject({ x: 383, y: 160, label: 'writer' })
    // A line from each item on the left into the item, and from the item to each on the right.
    expect(graph.edges).toHaveLength(11)
    expect(graph.edges.filter((e) => e.to === focusId)).toHaveLength(4)
    expect(graph.columns.map((c) => c.label)).toEqual(['Linked from 4', 'Links to 7'])
  })

  it('draws an item once per side, and keeps an item the graph order leaves out', () => {
    const links = linksOf(skillLinks)
    const twice: ToolkitLinks = {
      ...links,
      to: { ...links.to, links: [...links.to.links, { ...writer, at: 'SKILL.md:200', text: '' }], graph: [] },
    }
    const graph = linksGraph(twice, writer)
    const right = graph.nodes.filter((n) => n.id.startsWith('to:'))
    expect(right).toHaveLength(8)
    expect(new Set(right.map((n) => n.id)).size).toBe(8)
  })

  it('keeps a short graph 148 high inside its border, centred on its middle', () => {
    const links = linksOf(skillLinks)
    const one: ToolkitLinks = {
      ...links,
      from: { ...links.from, links: [], graph: [] },
      to: { ...links.to, links: links.to.links.slice(0, 1), graph: [] },
    }
    const graph = linksGraph(one, writer)
    expect(graph.height).toBe(148)
    expect(graph.nodes.find((n) => n.id.startsWith('to:'))?.y).toBe(75)
  })

  it('opens the file a link is written in, in its item', () => {
    const links = linksOf(skillLinks)
    const [writing, , agent] = links.from.links
    if (writing === undefined || agent === undefined) throw new Error('no links')
    expect(linkFile('from', writing, writer.path)).toEqual({ item: 'rules/writing.md', file: 'writing.md' })
    expect(linkFile('from', agent, writer.path)).toEqual({ item: 'agents/writer.md', file: 'writer.md' })
    const skillFile = { ...writer, at: 'skills/writer/SKILL.md:107', text: '' }
    expect(linkFile('from', skillFile, 'agents/writing-reviewer.md')).toEqual({ item: writer.path, file: 'SKILL.md' })
    const [first] = links.to.links
    if (first === undefined) throw new Error('no links')
    expect(linkFile('to', first, writer.path)).toEqual({ item: writer.path, file: 'SKILL.md' })
  })

  it('opens another item’s file from the open item, and the open item’s own file in place', () => {
    expect(openFile('rules/writing.md', 'writing.md', writer.path)).toEqual({
      open: 'rules/writing.md',
      from: writer.path,
      itemTab: 'files',
      file: 'writing.md',
      fileView: undefined,
      filePage: undefined,
    })
    expect(openFile(writer.path, 'SKILL.md', writer.path)).toEqual({
      itemTab: 'files',
      file: 'SKILL.md',
      fileView: undefined,
      filePage: undefined,
    })
  })
})

describe('the links graph on a tablet (T15 to T31)', () => {
  it('draws the graph 706 wide with the desktop’s places in height', () => {
    const links = linksOf(skillLinks)
    const desktop = linksGraph(links, writer)
    const tablet = linksGraph(links, writer, 'tablet')
    expect(tablet.width).toBe(706)
    expect(tablet.height).toBe(desktop.height)
    // The right column ends 15 in from the graph's right edge, and the open item stays in the middle.
    const right = tablet.nodes.filter((n) => n.id.startsWith('to:'))
    expect(right.every((n) => n.x + tablet.nodeSize.width === 706 - 15)).toBe(true)
    const focus = tablet.nodes.find((n) => n.id === focusId)
    expect(focus === undefined ? null : focus.x + tablet.nodeSize.width / 2).toBe(353)
    expect(tablet.columns.map((c) => c.x)).toEqual([15, 706 - 15 - 180])
  })
})

describe('the links graph on the phone (M17)', () => {
  it('stands the graph upright: the side that names the item over it, two to a row, the side it names under it', () => {
    const graph = linksGraph(linksOf(skillLinks), writer, 'phone')
    // M17 493:152: 390 high and 366 wide with its border.
    expect(graph.width).toBe(364)
    expect(graph.height).toBe(388)
    expect(graph.nodeSize).toEqual({ width: 162, height: 32 })
    const from = graph.nodes.filter((n) => n.id.startsWith('from:'))
    const to = graph.nodes.filter((n) => n.id.startsWith('to:'))
    expect(from.map((n) => [n.label, n.x, n.y])).toEqual([
      ['writer', 15, 41],
      ['writing-reviewer', 187, 41],
      ['ste100', 15, 79],
      ['writing', 187, 79],
    ])
    expect(to.map((n) => n.y)).toEqual([225, 225, 263, 263, 301, 301, 339])
    // The open item is centred where Figma centres its 150 × 40 node (493:224).
    expect(graph.nodes.find((n) => n.id === focusId)).toMatchObject({ x: 101, y: 155 })
    expect(graph.columns).toEqual([
      { label: 'Linked from 4', x: 15, y: 13 },
      { label: 'Links to 7', x: 15, y: 199 },
    ])
    // MapGraph draws its lines side to side only, so the upright graph has none, and selects nothing, so no node dims.
    expect(graph.edges).toEqual([])
    expect(graph.selected).toBeNull()
    expect(linksGraph(linksOf(skillLinks), writer).selected).toBe(focusId)
  })
})

describe('a rule’s links graph on the phone (M31)', () => {
  it('keeps one row’s room for the reason over the rule, and places the rule and its one skill under it', () => {
    const graph = linksGraph(
      linksOf(toolkitStates.ruleLinks),
      { path: 'rules/skills.md', name: 'skills', kind: 'rule' },
      'phone',
    )
    // M31 493:5483: 238 high with its border; the rule 476 and the skill 550 in the frame, the graph at 363.
    expect(graph.height).toBe(236)
    expect(graph.nodes.map((n) => [n.label, n.x, n.y])).toEqual([
      ['skills', 101, 117],
      ['eval-cases', 15, 187],
    ])
    expect(graph.columns.map((c) => c.y)).toEqual([13, 161])
  })
})

// A tap on a link's file and line opens that file on its item's Files tab (D19 482:660). Each Links state holds the
// browser of every item its links name, so the tab shows a real tree with the file selected and a view of it.
describe('a link’s file on its item’s Files tab, in every Links state', () => {
  const linkStates: [string, ScreenState<ToolkitData, ToolkitUi>][] = Object.entries(toolkitStates).filter(([id]) =>
    id.includes('Links'),
  )

  it('covers the five Links states on each layout', () => {
    expect(linkStates).toHaveLength(15)
  })

  for (const [id, state] of linkStates) {
    it(`opens each link’s file with its tree and a view of it (${id})`, () => {
      const open = openItem(state.data, state.ui)
      if (open?.detail.links === undefined) throw new Error(`${id} has no links`)
      const links = open.detail.links
      const sides = [
        ['from', links.from.links],
        ['to', links.to.links],
      ] as const
      for (const [side, list] of sides)
        for (const link of list) {
          const target = linkFile(side, link, open.item.path)
          const ui = { ...state.ui, ...openFile(target.item, target.file, open.item.path) }
          const opened = openItem(state.data, ui)
          expect(opened?.item.path, link.at).toBe(target.item)
          expect(opened?.tab, link.at).toBe('files')
          const browser = opened?.detail.browser
          if (browser === undefined) throw new Error(`${id}: ${link.at} opens no file browser`)
          expect(findFile(browser.tree, target.file), link.at).toBeDefined()
          const shown = openBrowserFile(browser, target.file)
          expect(shown.path, link.at).toBe(target.file)
          expect(shown.view, link.at).toBeDefined()
        }
    })
  }
})

// A link names a line of its file (SKILL.md:8, SKILL.md:118): the navigation keeps the line, and the Files tab opens the
// file's source at it.
describe('a link’s line', () => {
  it('reads the line of the place a link is written at, and none when the place has no line', () => {
    expect(linkLine({ ...writer, at: 'SKILL.md:8', text: '' })).toBe(8)
    expect(linkLine({ ...writer, at: 'skills/writer/SKILL.md:107', text: '' })).toBe(107)
    expect(linkLine({ ...writer, at: 'SKILL.md', text: '' })).toBeUndefined()
  })

  it('keeps the line in the navigation, on the file’s source, so two lines of one file open apart', () => {
    const at8 = openFile(writer.path, 'SKILL.md', writer.path, { line: 8 })
    const at118 = openFile(writer.path, 'SKILL.md', writer.path, { line: 118 })
    expect(at8).toMatchObject({ itemTab: 'files', file: 'SKILL.md', line: 8, fileView: 'code' })
    expect(at118).toMatchObject({ itemTab: 'files', file: 'SKILL.md', line: 118, fileView: 'code' })
    expect(at8).not.toEqual(at118)
    // Without a line the file opens on its own default view, as a tap on its tree row opens it.
    expect(openFile(writer.path, 'SKILL.md', writer.path)).toMatchObject({ fileView: undefined, line: undefined })
  })

  it('finds the source lines that hold a line: an excerpt of the file, or its first lines', () => {
    const open = openItem(skillLinks.data, { ...skillLinks.ui, ...openFile(writer.path, 'SKILL.md', writer.path) })
    const view = open?.detail.browser?.views.find((v) => v.path === 'SKILL.md')
    if (view === undefined) throw new Error('no view of SKILL.md')
    const at8 = sourceAt(view, 8)
    const at118 = sourceAt(view, 118)
    if (at8 === undefined || at118 === undefined) throw new Error('no source at 8 or 118')
    expect(at8.lines[8 - at8.start]).toContain('The writing rules in')
    expect(at118.lines[118 - at118.start]).toContain('audit-slop')
    expect(sourceAt(view, 500)).toBeUndefined()
    // A file whose first lines are its code holds a line among them (D32 commit-msg:3).
    const hook = openItem(toolkitStates.hookLinks.data, {
      ...toolkitStates.hookLinks.ui,
      ...openFile('hooks/commit-msg', 'commit-msg', 'hooks/commit-msg'),
    })
    const script = hook?.detail.browser?.views.find((v) => v.path === 'commit-msg')
    if (script === undefined) throw new Error('no view of commit-msg')
    expect(sourceAt(script, 3)).toMatchObject({ start: 1 })
    expect(sourceAt(script, 3)?.lines[2]).toContain('toolkit/rules/commits-and-prs.md')
  })

  it('holds the source at every link’s line, in every Links state', () => {
    const linkStates: [string, ScreenState<ToolkitData, ToolkitUi>][] = Object.entries(toolkitStates).filter(([key]) =>
      key.includes('Links'),
    )
    for (const [id, state] of linkStates) {
      const open = openItem(state.data, state.ui)
      if (open?.detail.links === undefined) throw new Error(`${id} has no links`)
      const sides = [
        ['from', open.detail.links.from.links],
        ['to', open.detail.links.to.links],
      ] as const
      for (const [side, list] of sides)
        for (const link of list) {
          const target = linkFile(side, link, open.item.path)
          const line = linkLine(link)
          if (line === undefined) throw new Error(`${id}: ${link.at} has no line`)
          const opened = openItem(state.data, { ...state.ui, ...openFile(target.item, target.file, open.item.path) })
          const view = opened?.detail.browser?.views.find((v) => v.path === target.file)
          if (view === undefined) throw new Error(`${id}: ${link.at} has no view`)
          expect(sourceAt(view, line), `${id}: ${link.at}`).toBeDefined()
        }
    }
  })
})
