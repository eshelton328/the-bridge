import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { isNotMath } from './mathPlugins.ts'
import { MarkdownChatsContext } from './markdownChats.ts'
import { MarkdownText } from './MarkdownText.tsx'
import { mayHoldMath } from './useMathPlugins.ts'

// Math in a message: remark-math and KaTeX load only for a text with a $. The texts are made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

const drawn = (kind: 'inline' | 'display') =>
  document.querySelectorAll(`[data-math="${kind}"][data-state="ready"] .katex`)

describe('inline math', () => {
  it('draws $…$ with KaTeX, with MathML for a screen reader', async () => {
    view = await testRender(<MarkdownText text={'The area is $\\pi r^2$ here.'} />)
    await expect.poll(() => drawn('inline').length).toBe(1)
    expect(document.querySelector('.katex math')).not.toBeNull()
    await expect.element(page.getByText(/The area is/)).toBeVisible()
  })
})

describe('a display formula', () => {
  it('draws $$…$$ as its own block', async () => {
    view = await testRender(<MarkdownText text={'Before\n\n$$\n\\sum_{i=1}^{n} i\n$$\n\nAfter'} />)
    await expect.poll(() => drawn('display').length).toBe(1)
    expect(document.querySelector('.katex-display')).not.toBeNull()
  })
})

describe('prices', () => {
  it('stay text: "$5 and $10" and "$3.50 or $4." are not math', async () => {
    view = await testRender(<MarkdownText text={'It costs $5 and $10 now. Price is $3.50 or $4. From $ 5 $ on.'} />)
    await expect.element(page.getByText('It costs $5 and $10 now. Price is $3.50 or $4. From $ 5 $ on.')).toBeVisible()
    expect(document.querySelector('[data-math]')).toBeNull()
  })
  it("follow Pandoc's rules", () => {
    expect(isNotMath('$5 and $', '1')).toBe(true)
    expect(isNotMath('$ 5 $', ' ')).toBe(true)
    expect(isNotMath('$x $', undefined)).toBe(true)
    expect(isNotMath('$x$', '1')).toBe(true)
    expect(isNotMath('$x^2$', ' ')).toBe(false)
    expect(isNotMath('$x$', undefined)).toBe(false)
  })
})

describe('a formula that does not parse', () => {
  it('shows its source as code, not red text', async () => {
    view = await testRender(<MarkdownText text={'Broken $\\frac{1}{$ formula.'} />)
    await expect.poll(() => document.querySelector('[data-math="inline"]')?.getAttribute('data-state')).toBe('error')
    await expect.element(page.getByText('$\\frac{1}{$')).toBeVisible()
  })
})

describe('a formula with a link or HTML command', () => {
  it('links nowhere and loads nothing: \\href, \\url and \\includegraphics are off', async () => {
    view = await testRender(
      <MarkdownText
        text={
          'A $\\href{javascript:alert(1)}{x}$ and $\\url{https://example.com}$ and $\\includegraphics{https://example.com/a.png}$.'
        }
      />,
    )
    await expect
      .poll(() => document.querySelectorAll('[data-math="inline"]:not([data-state="loading"])').length)
      .toBe(3)
    expect(document.querySelector('a')).toBeNull()
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('mayHoldMath', () => {
  it('is true only for a text with a $', () => {
    expect(mayHoldMath('no money here')).toBe(false)
    expect(mayHoldMath('$x$')).toBe(true)
  })
})

describe('a text with no $', () => {
  it('renders as before, with no math', async () => {
    view = await testRender(<MarkdownText text={'Plain **text** with `code`.'} />)
    await expect.element(page.getByText('code')).toBeVisible()
    expect(document.querySelector('[data-math]')).toBeNull()
  })
})

describe('math beside a chat mention', () => {
  it('draws the formula and links the chat, and a price stays text', async () => {
    const mentions = { chats: new Map([['m1/p1', 'bridge-coord']]), open: () => undefined }
    view = await testRender(
      <MarkdownChatsContext value={mentions}>
        <MarkdownText text={'Ask @bridge-coord about $x^2$, not the $5 fee.'} />
      </MarkdownChatsContext>,
    )
    await expect.poll(() => drawn('inline').length).toBe(1)
    expect(document.querySelector('a[href="/workspaces?chat=m1%2Fp1"]')).not.toBeNull()
    await expect.element(page.getByText(/not the \$5 fee/)).toBeVisible()
  })
})
