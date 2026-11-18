import { describe, expect, it } from 'vitest'
import { focusId, linkCount, linkFile, linksGraph, sideLabel } from './blocks/linksView.ts'
import { openFile, openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ToolkitLinks } from './types.ts'

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
