import { ArchitectureModel } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { layoutOf, layoutSizes } from './architectureLayout.ts'

const part = (id: string, boundary?: string) => ({
  id,
  name: id,
  shape: 'service' as const,
  ours: boundary !== undefined,
  typeLine: 'Service',
  ...(boundary === undefined ? {} : { boundary }),
})
/** The model of `parts` with an arrow for each "from>to" in `arrows`. */
const model = (parts: ReturnType<typeof part>[], arrows: string, boundaries: string[] = []) =>
  ArchitectureModel.parse({
    view: 'component',
    parts,
    boundaries: boundaries.map((id) => ({ id, label: `${id} repository`, kind: 'repository' })),
    arrows: arrows.split(' ').map((a) => {
      const [from = '', to = ''] = a.split('>')
      return { from, to, label: 'calls' }
    }),
    stack: [],
  })
const rowOf = (layout: ReturnType<typeof layoutOf>, id: string) => {
  const y = layout.parts.find((p) => p.id === id)?.y ?? -1
  return [...new Set(layout.parts.map((p) => p.y))].sort((a, b) => a - b).indexOf(y)
}

describe('layoutOf', () => {
  it('puts each caller a row above the part it calls, on its longest path', () => {
    const layout = layoutOf(model([part('a'), part('b'), part('c')], 'a>b b>c a>c'))
    expect(['a', 'b', 'c'].map((id) => rowOf(layout, id))).toEqual([0, 1, 2])
    expect(new Set(layout.parts.map((p) => `${String(p.width)}×${String(p.height)}`))).toEqual(new Set(['228×62']))
  })

  it('runs an arrow that skips a row in its own lane right of every part, through no box', () => {
    const layout = layoutOf(model([part('a'), part('b'), part('c'), part('d')], 'a>b b>c c>d a>c a>d'))
    const right = Math.max(...layout.parts.map((p) => p.x + p.width))
    const skips = layout.arrows.filter((a) => a.id === 'a c' || a.id === 'a d')
    const lanes = skips.map((a) => a.labelAt.x)
    expect(lanes.every((x) => x > right && x < layout.width) && new Set(lanes).size === 2).toBe(true)
    const inBox = (x: number, y: number) =>
      layout.parts.some((p) => x > p.x && x < p.x + p.width && y > p.y && y < p.y + p.height)
    for (const a of skips)
      for (const [s, e] of a.points.slice(1).map((e, i) => [a.points[i] ?? e, e] as const))
        for (let t = 0; t <= 1; t += 1 / Math.max(1, Math.abs(e.x - s.x) + Math.abs(e.y - s.y)))
          expect(inBox(s.x + (e.x - s.x) * t, s.y + (e.y - s.y) * t)).toBe(false)
  })

  it('ends on a loop of arrows and keeps every part', () => {
    const layout = layoutOf(model([part('a'), part('b')], 'a>b b>a'))
    expect(['a', 'b'].map((id) => rowOf(layout, id))).toEqual([0, 1])
    expect(layout.arrows).toHaveLength(2)
  })

  it("draws a boundary round its parts only, and moves an outside part out of the boundary's rows", () => {
    const layout = layoutOf(
      model([part('web', 'b0'), part('api', 'b0'), part('lib'), part('push')], 'web>api web>lib api>push', ['b0']),
    )
    const [b] = layout.boundaries
    if (b === undefined) throw new Error('no boundary')
    const within = (p: (typeof layout.parts)[number]) =>
      p.x >= b.x && p.y >= b.y && p.x + p.width <= b.x + b.width && p.y + p.height <= b.y + b.height
    expect(layout.parts.filter(within).map((p) => p.id)).toEqual(['web', 'api'])
    expect(['lib', 'push'].map((id) => rowOf(layout, id))).toEqual([2, 2])
    expect(b.y).toBeGreaterThanOrEqual(0)
  })

  it('sets a part that only calls into a boundary above it', () => {
    const layout = layoutOf(
      model([part('phone'), part('proxy', 'b0'), part('web', 'b0')], 'phone>web proxy>web', ['b0']),
    )
    expect(rowOf(layout, 'phone')).toBe(0)
    expect(layout.boundaries[0]?.y).toBeGreaterThan(layout.parts.find((p) => p.id === 'phone')?.y ?? 0)
  })

  it("runs each arrow from its caller's foot to the top of the part it calls, with its label between the rows", () => {
    const layout = layoutOf(model([part('a'), part('b')], 'a>b'))
    const [a, b] = layout.parts
    const [arrow] = layout.arrows
    if (a === undefined || b === undefined || arrow === undefined) throw new Error('missing')
    expect(arrow.points[0]).toEqual({ x: a.x + a.width / 2, y: a.y + a.height })
    expect(arrow.points.at(-1)).toEqual({ x: b.x + b.width / 2, y: b.y })
    expect(arrow.labelAt.y).toBe(a.y + a.height + layoutSizes.row / 2)
  })

  it('centres each row and fits the drawing round the widest one', () => {
    const layout = layoutOf(model([part('a'), part('b'), part('c')], 'a>b a>c'))
    const { part: size, gap, edge } = layoutSizes
    expect(layout.width).toBe(2 * size.width + gap + 2 * edge)
    expect(layout.parts.find((p) => p.id === 'a')?.x).toBe((layout.width - size.width) / 2)
    expect(layout.parts.filter((p) => p.id !== 'a').map((p) => p.x)).toEqual([edge, edge + size.width + gap])
  })

  it('gives the same layout for the same model', () => {
    const m = model([part('a'), part('b', 'b0'), part('c', 'b0')], 'a>b b>c', ['b0'])
    expect(layoutOf(m)).toEqual(layoutOf(structuredClone(m)))
  })
})
