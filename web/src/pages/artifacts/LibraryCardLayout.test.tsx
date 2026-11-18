import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
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

function part(root: Element, name: string): HTMLElement {
  const el = root.querySelector(`.card__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no card__${name}`)
  return el
}

// Figma puts a new card's New at the end of its title row (D1 402:15454,
// T1 405:187), not 8 px after the title (Card's default badgePosition).
describe('the library cards', () => {
  it.each([
    ['desktop', 1512, 982, artifactsStates.library],
    ['tablet', 756, 1158, artifactsStates.libraryTablet],
  ] as const)('ends the %s title row with New', async (viewport, width, height, state) => {
    await page.viewport(width, height)
    view = await testRender(<ArtifactsScreen data={state.data} ui={state.ui} viewport={viewport} />)
    const badges = [...document.querySelectorAll('[data-figma^="artifact card · "] .card__badge')]
    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      const card = badge.closest('[data-figma^="artifact card · "]')
      if (card === null) throw new Error('no card around the badge')
      const header = part(card, 'header').getBoundingClientRect()
      const end = badge.getBoundingClientRect()
      expect(Math.abs(header.right - end.right)).toBeLessThanOrEqual(0.5)
    }
  })
})
