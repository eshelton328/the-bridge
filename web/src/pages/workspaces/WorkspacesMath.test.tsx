import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../../lib/testRender.ts'
import { chatWithReply } from './richTextData.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A reply with TeX draws it with KaTeX, on the owner's path: a tap on the chat in the phone list, and the chat on a
// tablet. Prices stay text, and a wide display formula scrolls in its own box. The text is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const wide = Array.from({ length: 30 }, (_, i) => `x_{${String(i)}}`).join(' + ')
const reply = ['The energy is $E = mc^2$, and the plan costs $5 to $10.', '', '$$', wide, '$$'].join('\n')

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await unmountRendered()
  await page.viewport(1512, 982)
})

async function expectMath() {
  // The chat renders after the tap; wait for both formulas.
  await expect.poll(() => document.querySelectorAll('[data-math]').length, { timeout: 15000 }).toBe(2)
  const inline = document.querySelector('[data-math="inline"]')
  const display = document.querySelector('[data-math="display"]')
  if (inline === null || display === null) throw new Error('no formula')
  await expect
    .poll(() => [inline.getAttribute('data-state'), display.getAttribute('data-state')], { timeout: 15000 })
    .toEqual(['ready', 'ready'])
  // KaTeX's MathML carries the TeX, for a screen reader and a copy.
  expect(inline.querySelector('annotation')?.textContent).toBe('E = mc^2')
  // The prices are text, not a formula.
  expect(document.querySelectorAll('[data-math]')).toHaveLength(2)
  await expect.element(page.getByText(/costs \$5 to \$10/)).toBeVisible()
  // The wide formula scrolls in its own box, which takes the focus; the column does not scroll.
  const box = display.querySelector('.katex-display')
  if (!(box instanceof HTMLElement)) throw new Error('no display box')
  expect(box.scrollWidth).toBeGreaterThan(box.clientWidth)
  expect(box.getAttribute('tabindex')).toBe('0')
  const column = box.closest('.markdown-view')
  if (!(column instanceof HTMLElement)) throw new Error('no MarkdownView')
  expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth)
}

describe('TeX in a reply', () => {
  it('draws with KaTeX after a tap on the chat in the phone list', async () => {
    await page.viewport(390, 806)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectMath()
  })
  it('draws with KaTeX in the chat on a tablet', async () => {
    await page.viewport(1024, 1366)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="tablet" />)
    // The tablet shows the list beside the open chat; the owner taps the chat's row.
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectMath()
  })
})
