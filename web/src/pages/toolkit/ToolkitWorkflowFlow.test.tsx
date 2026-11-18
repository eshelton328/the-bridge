import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ToolkitWorkflowFlow } from './blocks/ToolkitWorkflowFlow.tsx'
import { toolkitStates } from './states/index.ts'

const flow = toolkitStates.workflowOpen.data.details.find((d) => d.path === 'workflows/skill-eval-round.md')?.flow

/** The text a screen reader reads: every text node with no aria-hidden element above it. */
function spokenText(root: Element): string {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (node.parentElement?.closest('[aria-hidden="true"]') === null) parts.push(node.textContent ?? '')
  }
  return parts.join('')
}

let unmount: (() => Promise<void>) | undefined
afterEach(async () => {
  await unmount?.()
})

describe('ToolkitWorkflowFlow', () => {
  it('reads each branch label with the step it leads to, as D8 draws them', async () => {
    expect(flow).toBeDefined()
    if (flow === undefined) return
    ;({ unmount } = await testRender(<ToolkitWorkflowFlow flow={flow} />))
    const section = document.querySelector('[data-figma="kind section · workflow"]')
    expect(section).not.toBeNull()
    if (section === null) return
    const spoken = spokenText(section)
    expect(spoken).toContain('yes, to Runs')
    expect(spoken).toContain('no, to Stop')
  })
})

// D8 466:6 and 466:7, T18: the arrows from Blinding (row 3) up into steps 4 and 5 and from step 5 up into step 6 are
// the library's FlowElbow, and the loop back (466:10) is FlowLoop end="up", its head pointing up into the Stop's
// foot. Each head's tip stops 1 to 8 px before the card it points at, off the card.
describe('the flow by phase’s elbows and loop (D8, T18)', () => {
  for (const { size, width } of [
    { size: 'md', width: 980 },
    { size: 'sm', width: 740 },
  ] as const) {
    it(`draws FlowElbow into steps 4, 5 and 6 and FlowLoop up into Stop, each tip before its card (${size})`, async () => {
      expect(flow).toBeDefined()
      if (flow === undefined) return
      await page.viewport(width, 900)
      ;({ unmount } = await testRender(<ToolkitWorkflowFlow flow={flow} size={size} />))
      await document.fonts.ready
      const card = (title: string) => {
        const el = document.querySelector(`[data-figma="step · ${title}"]`)
        if (el === null) throw new Error(`no step ${title}`)
        return el.getBoundingClientRect()
      }
      const cards = ['Runs', 'Facts', 'Blinding', 'Primary grades', 'Second grades', 'Aggregate', 'Read', 'Stop']
      // The card a head points right into: the nearest card to the right of its tip whose rows hold the tip.
      const into = (x: number, y: number) =>
        cards
          .map((title) => ({ title, box: card(title) }))
          .filter(({ box }) => box.top < y && box.bottom > y && box.left > x - 1)
          .sort((a, b) => a.box.left - b.box.left)[0]
      const heads = [...document.querySelectorAll('.flow-elbow__root .flow-elbow__head')]
      const targets = heads.map((head) => {
        const tip = head.getBoundingClientRect()
        const target = into(tip.right, (tip.top + tip.bottom) / 2)
        if (target === undefined) throw new Error('an elbow points at no card')
        const gap = target.box.left - tip.right
        expect(gap, target.title).toBeGreaterThanOrEqual(1)
        expect(gap, target.title).toBeLessThanOrEqual(8)
        return target.title
      })
      expect(targets.sort()).toEqual(['Aggregate', 'Primary grades', 'Second grades'])
      const loops = [...document.querySelectorAll('.flow-loop__root')]
      expect(loops).toHaveLength(1)
      expect(loops[0]?.getAttribute('data-end')).toBe('up')
      const loopHead = loops[0]?.querySelector('.flow-loop__head')?.getBoundingClientRect()
      if (loopHead === undefined) throw new Error('the loop has no head')
      const stop = card('Stop')
      expect(loopHead.left).toBeGreaterThan(stop.left)
      expect(loopHead.right).toBeLessThan(stop.right)
      expect(loopHead.top - stop.bottom).toBeGreaterThanOrEqual(1)
      expect(loopHead.top - stop.bottom).toBeLessThanOrEqual(8)
    })
  }
})
