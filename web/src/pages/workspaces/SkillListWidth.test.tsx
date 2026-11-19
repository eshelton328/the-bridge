import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// R8 (the owner's screen review, 2026-11-18): the skill list grows with the composer. In a pane and on the tablet it is
// 40% of the composer's width, clamped to `shell.pickerMin` (240) and `shell.pickerMax` (400) (`Popover
// width="composer"`); on the phone it is as wide as the composer (`width="trigger"`).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const pickerMin = 240
const pickerMax = 400

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

// The width of the composer the list opens over (its trigger, the open one of the panes' composers), and the list's
// popover. The popover opens with a scale animation, so its width is read with `expect.poll` until it settles.
async function composerWidth() {
  await expect.element(page.getByRole('radiogroup', { name: 'SKILLS' })).toBeVisible()
  return page.getByRole('combobox', { name: 'SKILLS', expanded: true }).element().getBoundingClientRect().width
}

function listWidth() {
  const popover = page.getByRole('radiogroup', { name: 'SKILLS' }).element().closest('[data-figma]')
  if (!(popover instanceof HTMLElement)) throw new Error('the skill list has no popover')
  return popover.getBoundingClientRect().width
}

const clamped = (composer: number) => Math.min(pickerMax, Math.max(pickerMin, composer * 0.4))

// Each skill's name and description: the leaf elements in the list whose text is one of them.
function skillTexts() {
  const { skills } = workspacesStates.workbench.data
  const texts = new Set(skills.flatMap((s) => [s.name, s.description]))
  const list = page.getByRole('radiogroup', { name: 'SKILLS' }).element()
  return [...list.querySelectorAll('*')].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.children.length === 0 && texts.has(el.textContent),
  )
}

describe('the skill list after "/"', () => {
  for (const [w, h] of [
    [1512, 982],
    [3540, 1440],
  ] as const) {
    it(`is 40% of the pane's composer, clamped to 240..400, at ${String(w)} px (D1)`, async () => {
      await page.viewport(w, h)
      const { data, ui } = workspacesStates.workbench
      view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
      const composer = await composerWidth()
      await expect.poll(listWidth).toBeCloseTo(clamped(composer), 0)
    })
  }

  it('shows each skill name and description whole at 1512 px (D1)', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = workspacesStates.workbench
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await composerWidth()
    expect(skillTexts()).toHaveLength(6)
    // The cut ones, polled while the popover's open animation settles.
    await expect
      .poll(() =>
        skillTexts()
          .filter((el) => el.scrollWidth > el.clientWidth)
          .map((el) => el.textContent),
      )
      .toEqual([])
  })

  it('is 40% of the composer, clamped to 240..400, on the tablet (T4)', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletComposing
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const composer = await composerWidth()
    await expect.poll(listWidth).toBeCloseTo(clamped(composer), 0)
  })

  it('is as wide as the composer on the phone (M3)', async () => {
    await page.viewport(390, 844)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const composer = await composerWidth()
    await expect.poll(listWidth).toBeCloseTo(composer, 0)
  })
})
