import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { type TextSize, textSizes } from '../../lib/deviceSettings.ts'
import { testRender } from '../../lib/testRender.ts'
import { textSizeClass } from '@eshelton328/component-library-1701'
import { CardGroup } from './blocks/CardGroup.tsx'
import { CardGroupSkeleton } from './blocks/CardGroupSkeleton.tsx'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'
import type { ArtifactsData } from './types.ts'

// Screen review R77, the owner: "Artifact cards should always be the same height". Every artifact card keeps two
// description lines (the library Card's descriptionLines={2}), so a card with no description, one with a short one and
// one with a description longer than two lines have one height, in a row and across rows, at each text size (d-122),
// and the card that loads has that height too, so nothing jumps when the library comes.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

/** The text size class on <html>, as app/textSize.ts sets it (a page may not import app/). */
function setTextSize(size: TextSize) {
  for (const s of textSizes) {
    const name = textSizeClass[s]
    if (name !== null) document.documentElement.classList.toggle(name, s === size)
  }
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  setTextSize('small')
  await page.viewport(1512, 982)
})

const longDescription =
  'Research report: versioning schemes, changelogs and release automation across twelve repositories, with the trade-offs of each one and a recommendation for the library and the-bridge'

/** The library state with the first card's description empty and the second one's longer than two lines. */
function mixed(data: ArtifactsData): ArtifactsData {
  return {
    ...data,
    groups: data.groups.map((group, g) =>
      g !== 0
        ? group
        : {
            ...group,
            cards: group.cards.map((card, c) =>
              c === 0 ? { ...card, description: '' } : c === 1 ? { ...card, description: longDescription } : card,
            ),
          },
    ),
  }
}

function cardHeights(): number[] {
  return [...document.querySelectorAll('[data-figma^="artifact card · "] .card__root')].map((el) =>
    Math.round(el.getBoundingClientRect().height),
  )
}

describe('the artifact cards', () => {
  it.each([
    ['desktop', 1512, 982, artifactsStates.library],
    ['tablet', 756, 1158, artifactsStates.libraryTablet],
  ] as const)('have one height on the %s grid at each text size', async (viewport, width, height, state) => {
    await page.viewport(width, height)
    for (const size of textSizes) {
      setTextSize(size)
      view = await testRender(<ArtifactsScreen data={mixed(state.data)} ui={state.ui} viewport={viewport} />)
      const heights = cardHeights()
      expect(heights.length).toBeGreaterThan(2)
      expect({ size, heights }).toEqual({ size, heights: heights.map(() => heights[0]) })
      await view.unmount()
      // The cards that load, in the same grid as the loaded group's cards: the same width, so the same height.
      const group = mixed(state.data).groups[0]
      if (group === undefined) throw new Error('the state has no group')
      view = await testRender(<CardGroup group={group} open layout={viewport} />)
      const loaded = cardHeights()
      await view.unmount()
      view = await testRender(<CardGroupSkeleton layout={viewport} />)
      const loading = [...document.querySelectorAll('.card__root')].map((el) =>
        Math.round(el.getBoundingClientRect().height),
      )
      expect(loading.length).toBeGreaterThan(0)
      expect({ size, loading }).toEqual({ size, loading: loading.map(() => loaded[0]) })
      await view.unmount()
      view = undefined
    }
  })
})
