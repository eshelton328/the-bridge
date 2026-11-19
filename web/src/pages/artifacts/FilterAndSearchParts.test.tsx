import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// Library 1.0.0-beta.80 (PRs 227 and 235) draws what the Filter menu, the
// match place and the search's clear button need: 28 px Filter rows
// (`Checkbox density="compact"`, D3 403:6857), a 12 px popover padding
// (`Popover inset="wide"`, D3 403:6852), the Claude and Codex marks on the
// Source rows (`Checkbox leading`, D3 403:6855), the round mono pill of the
// match place (`Badge variant="monoPill"`, D4 403:8241) and the bold clear
// button of the focused search (`SearchField clearFocus="strong"`, D4
// 403:8202). These tests check that the page passes those props.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

function checkRows(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-figma^="check · "]')]
}

function row(label: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-figma="check · ${label}"]`)
  if (el === null) throw new Error(`no row ${label}`)
  return el
}

describe('the Filter menu parts', () => {
  it.each([
    ['desktop menu (D3)', 'desktop', 1512, 982, artifactsStates.filterOpen],
    ['tablet sheet (T3)', 'tablet', 756, 1158, artifactsStates.filterTablet],
    ['phone sheet (M3)', 'phone', 390, 844, artifactsStates.filterPhone],
  ] as const)('draws the %s rows 28 high with the Source marks', async (_name, viewport, width, height, state) => {
    await page.viewport(width, height)
    view = await testRender(<ArtifactsScreen data={state.data} ui={state.ui} viewport={viewport} />)
    await expect.poll(() => checkRows().length).toBe(12)
    for (const el of checkRows()) {
      expect(el.querySelector('.checkbox__root--density_compact')).not.toBeNull()
      expect(el.getBoundingClientRect().height).toBe(28)
    }
    // The marks sit between the box and the label on the Source rows only.
    for (const label of ['Claude artifacts', 'Codex sites']) {
      expect(row(label).querySelector('[class*="kind-mark"]')).not.toBeNull()
    }
    for (const label of ['ncc-1701', 'Not in a project', 'Today']) {
      expect(row(label).querySelector('[class*="kind-mark"]')).toBeNull()
    }
  })

  it('pads the desktop menu 12, so its rows are 294 wide (D3)', async () => {
    const { data, ui } = artifactsStates.filterOpen
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => document.querySelector('.popover__content--inset_wide')).not.toBeNull()
    expect(row('Claude artifacts').getBoundingClientRect().width).toBe(294)
  })
})

describe('the search parts (D4)', () => {
  it('draws each match place as a round mono pill', async () => {
    const { data, ui } = artifactsStates.searchList
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => document.querySelectorAll('[data-figma^="artifact row · "]').length).toBe(3)
    const pills = document.querySelectorAll('[data-figma^="artifact row · "] .badge__root--variant_monoPill')
    expect([...pills].map((pill) => pill.textContent)).toEqual(['in title', 'in description', 'in link'])
    expect(document.querySelector('[data-figma^="artifact row · "] .badge__root--variant_tag')).toBeNull()
  })

  it('draws the focused search clear button bold at 16 px', async () => {
    const { data, ui } = artifactsStates.searchList
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    const clear = page.getByRole('button', { name: 'Clear the search' })
    await expect.element(clear).toBeVisible()
    const button = clear.element()
    expect(button.classList).toContain('search-field__clear--clearFocus_strong')
    expect(button.classList).toContain('search-field__clear--clearSize_16')
    await expect.poll(() => document.activeElement === document.querySelector('input[type="search"]')).toBe(true)
    const bold = button.querySelector('[data-clear-icon="focus"] svg')
    if (bold === null) throw new Error('no bold clear icon')
    expect(bold.getBoundingClientRect().width).toBe(16)
  })
})
