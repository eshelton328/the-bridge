import { afterEach, describe, expect, it } from 'vitest'
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
