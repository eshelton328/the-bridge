import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// Library 1.0.0-beta.69 parts on the Artifacts page: each card's preview colour (`Thumbnail tone`: the Agent factory
// doc green, 402:15650; the Type safety doc violet, 402:15716; the readme cold-reader chart amber, 402:15771), the
// link mark that fills its 12 px box (`LinkMarkIcon`, D2 403:500), and the desktop Sort and Filter at Figma's widths
// (`padding="compact"` and Sort's 12 px chevron with `keepIconSize`; 402:15404 108 wide, 402:15413 75 wide).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

async function showDesktop(id: 'library' | 'artifactOpen') {
  await page.viewport(1512, 982)
  const { data, ui } = artifactsStates[id]
  view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
}

/** The fills in a card's preview, in order of first use: the tone colours a doc's title bar or a chart's bars. */
function fills(title: string): string {
  const card = document.querySelector(`[data-figma="artifact card · ${title}"]`)
  const all = Array.from(card?.querySelectorAll('svg rect, svg path') ?? [], (el) => getComputedStyle(el).fill)
  if (all.length === 0) throw new Error(`no shape in ${title}`)
  return [...new Set(all)].join(' ')
}

function button(figma: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-figma="${figma}"] button, button[data-figma="${figma}"]`)
  if (el === null) throw new Error(`no ${figma}`)
  return el
}

describe('the Artifacts library on library 1.0.0-beta.69', () => {
  it("colours each card's preview by its tone", async () => {
    await showDesktop('library')
    await expect
      .poll(() => document.querySelector('[data-figma="artifact card · readme cold-reader run"]'))
      .not.toBeNull()
    // The two docs differ (green, violet), and the amber chart differs from the accent skill-evals chart.
    expect(fills('Agent factory and session tracking')).not.toBe(fills('Type safety in agentic systems'))
    expect(fills('readme cold-reader run')).not.toBe(fills('Skill eval pass rates'))
  })

  it('draws Sort and Filter with 10 px sides and a 12 px chevron on the desktop', async () => {
    await showDesktop('library')
    await expect.poll(() => document.querySelector('[data-figma="button · Sort"]')).not.toBeNull()
    const sort = button('button · Sort')
    const filter = button('button · Filter')
    const sides = (el: HTMLElement) => [getComputedStyle(el).paddingLeft, getComputedStyle(el).paddingRight]
    expect(sides(sort)).toEqual(['10px', '10px'])
    expect(sides(filter)).toEqual(['10px', '10px'])
    const chevron = sort.querySelectorAll('svg')[1]?.getBoundingClientRect()
    expect([chevron?.width, chevron?.height]).toEqual([12, 12])
    // The label's width depends on the font's rendering (108.4 here, 109 on CI's Linux runner); Figma's are 108 and 75.
    expect(Math.abs(sort.getBoundingClientRect().width - 108)).toBeLessThanOrEqual(2)
    expect(Math.abs(filter.getBoundingClientRect().width - 75)).toBeLessThanOrEqual(2)
  })

  it('draws the link mark 12 px wide', async () => {
    await showDesktop('artifactOpen')
    await expect.poll(() => document.querySelector('[data-figma="preview footer"] svg')).not.toBeNull()
    const mark = document.querySelector('[data-figma="preview footer"] svg')
    expect(mark?.getBoundingClientRect().width).toBe(12)
  })
})
