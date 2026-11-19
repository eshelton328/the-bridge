import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { testRender } from '../../lib/testRender.ts'
import type { FlowPage } from './blocks/flowLayout.ts'
import { ToolkitFlowColumn } from './blocks/ToolkitFlowColumn.tsx'
import { ToolkitFlowSteps } from './blocks/ToolkitFlowSteps.tsx'
import { toolkitStates } from './states/index.ts'
import { setViewport } from '../../lib/rendering.ts'

// A workflow's page flow on the desktop with input no Figma frame shows: two parallel stages one after the other.
// The connector between them must reach both cards of the second stage, not point into the gap between them.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined
afterEach(async () => {
  await view?.unmount()
  view = undefined
  await setViewport(1512, 982)
})

const base = toolkitStates.workflowFullPage.data.details.find(
  (d) => d.path === 'workflows/skill-eval-round.md',
)?.flowPage

/** D13's flow with a second parallel stage (6 and 7) right after the first (4 and 5). */
function twoParallelStages(flow: FlowPage): FlowPage {
  const parallel = flow.stages.find((stage) => stage.length === 2)
  const at = flow.stages.findIndex((stage) => stage.length === 2)
  if (parallel === undefined) throw new Error('D13 has no parallel stage')
  const marks = ['6', '7']
  const again = parallel.map((step, i) => ({
    ...step,
    id: `again-${step.id}`,
    mark: marks[i] ?? '',
    title: `Again ${marks[i] ?? ''}`,
  }))
  // No gate's way out or loop, so only the stages' connectors are drawn.
  return {
    label: flow.label,
    legend: flow.legend,
    stages: [...flow.stages.slice(0, at + 1), again, ...flow.stages.slice(at + 1)],
  }
}

describe('the connector between two parallel stages on the desktop', () => {
  it('reaches both cards of the next stage, each tip just short of its card', async () => {
    if (base === undefined) throw new Error('D13 has no flow page')
    await setViewport(1512, 982)
    view = await testRender(<ToolkitFlowSteps page={twoParallelStages(base)} />)
    const cards = ['Again 6', 'Again 7'].map((title) => {
      const card = document.querySelector(`[data-figma="step · ${title}"]`)
      if (card === null) throw new Error(`${title} is not drawn`)
      return card.getBoundingClientRect()
    })
    const before = document.querySelector('[data-figma="step · Primary grades"]')?.getBoundingClientRect()
    if (before === undefined) throw new Error('step 4 is not drawn')
    // The heads between the two stages: right of the first stage's cards, left of the second's.
    const heads = [...document.querySelectorAll('.flow-line__head, .flow-branch__head')]
      .map((el) => el.getBoundingClientRect())
      .filter((h) => h.left >= before.right && h.right <= (cards[0]?.left ?? 0))
    for (const card of cards) {
      const into = heads.filter((h) => {
        const middle = (h.top + h.bottom) / 2
        return middle > card.top && middle < card.bottom
      })
      expect(into.length).toBe(1)
      const gap = card.left - (into[0]?.right ?? Number.NEGATIVE_INFINITY)
      expect(gap).toBeGreaterThanOrEqual(1)
      expect(gap).toBeLessThanOrEqual(8)
    }
    // No head points into the gap between the two cards.
    const [top, bottom] = cards
    const intoGap = heads.filter((h) => {
      const middle = (h.top + h.bottom) / 2
      return middle >= (top?.bottom ?? 0) && middle <= (bottom?.top ?? 0)
    })
    expect(intoGap.length).toBe(0)
  })
})

describe('the connector between two parallel stages in the tablet column', () => {
  it('reaches both cards of the next stage, each tip just over its card', async () => {
    if (base === undefined) throw new Error('D13 has no flow page')
    await setViewport(756, 1129)
    view = await testRender(<ToolkitFlowColumn page={twoParallelStages(base)} />)
    const cards = ['Again 6', 'Again 7'].map((title) => {
      const card = document.querySelector(`[data-figma="step · ${title}"]`)
      if (card === null) throw new Error(`${title} is not drawn`)
      return card.getBoundingClientRect()
    })
    const before = document.querySelector('[data-figma="step · Primary grades"]')?.getBoundingClientRect()
    if (before === undefined) throw new Error('step 4 is not drawn')
    const heads = [...document.querySelectorAll('.flow-line__head, .flow-branch__head')]
      .map((el) => el.getBoundingClientRect())
      .filter((h) => h.top >= before.bottom && h.bottom <= (cards[0]?.top ?? 0))
    expect(heads.length).toBe(2)
    for (const card of cards) {
      const into = heads.filter((h) => {
        const middle = (h.left + h.right) / 2
        return middle > card.left && middle < card.right
      })
      expect(into.length).toBe(1)
      const gap = card.top - (into[0]?.bottom ?? Number.NEGATIVE_INFINITY)
      expect(gap).toBeGreaterThanOrEqual(1)
      expect(gap).toBeLessThanOrEqual(8)
    }
  })
})
