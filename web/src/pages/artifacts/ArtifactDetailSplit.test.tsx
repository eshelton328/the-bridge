import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { token } from '../../../styled-system/tokens/index.js'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

const px = (name: Parameters<typeof token>[0]) => Number.parseFloat(token(name))

// Figma's discussion panel (D7 452:2410, D8 452:3020) is 628 wide beside an 820 px artifact pane (452:2333). As the
// Inbox's task and discussion (D14), the artifact and its discussion sit in the library's DetailSplit: the artifact's
// Container size="detail" keeps its 828 px column (748 and 40 at each side) and the panel takes the rest of the pane,
// up to shell.discussionPane, so in the 1512 px frame it is 620 wide and starts 8 px right of Figma's 884
// (LIBRARY_GAPS.md "Discussion panel width").
const frames = [
  { name: 'the empty discussion (D7)', state: 'discussOpen' },
  { name: 'the proposed change (D8)', state: 'changeProposed' },
  { name: 'the applied change (D9)', state: 'changeApplied' },
] as const

describe('the artifact and its discussion in DetailSplit', () => {
  for (const frame of frames)
    it(`puts the artifact pane in the item and the panel in the side: ${frame.name}`, async () => {
      await page.viewport(1512, 982)
      const { data, ui } = artifactsStates[frame.state]
      view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
      await expect.poll(() => document.querySelector('[data-figma="discussion panel"]')).not.toBeNull()
      const pane = document.querySelector('[data-figma="artifact pane"]')
      const panel = document.querySelector('[data-figma="discussion panel"]')
      const item = pane?.parentElement
      const side = panel?.parentElement
      if (pane === null || panel === null || item == null || side == null) throw new Error('no artifact or panel')
      expect(item.classList).toContain('detail-split__item')
      expect(side.classList).toContain('detail-split__side')
      expect(item.parentElement).toBe(side.parentElement)
      expect(item.parentElement?.classList).toContain('detail-split__root')

      const paneBox = pane.getBoundingClientRect()
      const panelBox = panel.getBoundingClientRect()
      // 748 of content and 40 at each side.
      expect(paneBox.width).toBe(px('sizes.shell.detail') + 2 * 40)
      expect(panelBox.left).toBe(paneBox.right)
      expect(panelBox.right).toBe(1512)
      expect(panelBox.width).toBe(620)
      expect(panelBox.width).toBeLessThanOrEqual(px('sizes.shell.discussionPane'))
    })
})
