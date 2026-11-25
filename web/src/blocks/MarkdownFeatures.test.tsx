import '../index.css'
import { ok } from '@bridge/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { allRichText, type RichTextFeature } from '../lib/deviceSettings.ts'
import { testRender } from '../lib/testRender.ts'
import { MarkdownChatsContext } from './markdownChats.ts'
import { MarkdownFeaturesContext } from './markdownFeatures.ts'
import { MarkdownText } from './MarkdownText.tsx'

// Settings → Rich text (2026-11-25): each feature that is off draws its plain Markdown and hides no text. Each case
// checks the fallback's element and that the text is all there. The texts, chats and paths are made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

const off = (feature: RichTextFeature) => ({ ...allRichText, [feature]: false })
const text = () => document.body.textContent
/** Lets a lazy load (highlighter, Mermaid, KaTeX) start and settle, so a check for its absence means something. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 1500))

describe('callouts off', () => {
  it('draws an alert as the plain quote, with its [!NOTE] line', async () => {
    view = await testRender(<MarkdownText text={'> [!NOTE]\n> Sample note text.'} features={off('callouts')} />)
    const quote = document.querySelector('blockquote')
    expect(quote).not.toBeNull()
    expect(quote?.textContent).toContain('[!NOTE]')
    expect(quote?.textContent).toContain('Sample note text.')
    expect(document.querySelector('.callout__root')).toBeNull()
  })
})

const tsFence = ['```ts', 'const total = sum(2, "x")', '// a sample note', '```'].join('\n')

describe('code off', () => {
  it('draws the code block with its label, whole code and Copy, and no colours', async () => {
    const copy = vi.fn(() => Promise.resolve(ok(undefined)))
    view = await testRender(<MarkdownText text={tsFence} onCopyCode={copy} features={off('code')} />)
    const block = document.querySelector('[data-language="ts"]')
    expect(block?.querySelector('pre')?.textContent).toBe('const total = sum(2, "x")\n// a sample note')
    await expect.element(page.getByRole('button', { name: 'Copy code' })).toBeVisible()
    await settle()
    expect(block?.querySelector('[data-kind]')).toBeNull()
  })
})

describe('chat links off', () => {
  it("draws a chat's name as its text, with no link", async () => {
    const chats = new Map([['m1/p1', 'bridge-coord']])
    view = await testRender(
      <MarkdownChatsContext value={{ chats, open: () => undefined }}>
        <MarkdownText text={'Ask bridge-coord first.'} features={off('chatLinks')} />
      </MarkdownChatsContext>,
    )
    await expect.element(page.getByText('Ask bridge-coord first.')).toBeVisible()
    expect(document.querySelector('a')).toBeNull()
  })
})

describe('mermaid off', () => {
  it('draws a mermaid fence as the code block of its source, with no diagram', async () => {
    const source = 'flowchart LR\n  A --> B'
    view = await testRender(<MarkdownText text={['```mermaid', source, '```'].join('\n')} features={off('mermaid')} />)
    expect(document.querySelector('[data-language="mermaid"] pre')?.textContent).toBe(source)
    await settle()
    expect(page.getByRole('figure', { name: 'Mermaid' }).query()).toBeNull()
  })
})

describe('math off', () => {
  it('keeps $…$ and a math fence as their TeX, and loads no KaTeX', async () => {
    view = await testRender(
      <MarkdownText text={'The area is $\\pi r^2$ here.\n\n```math\n\\sum_{i=1}^{n} i\n```'} features={off('math')} />,
    )
    await settle()
    expect(text()).toContain('The area is $\\pi r^2$ here.')
    expect(document.querySelector('[data-language="math"] pre')?.textContent).toBe('\\sum_{i=1}^{n} i')
    expect(document.querySelector('.katex, [data-math]')).toBeNull()
  })

  it('keeps the TeX as written: a backslash escape is not read as Markdown', async () => {
    view = await testRender(<MarkdownText text={'The set $\\{x\\}$ and $$\\{y\\}$$ here.'} features={off('math')} />)
    await settle()
    expect(text()).toContain('The set $\\{x\\}$ and $$\\{y\\}$$ here.')
    expect(document.querySelector('.katex, [data-math]')).toBeNull()
  })
})

describe('images off', () => {
  it('draws a brain image and a web image as links with their alt text, and loads no image', async () => {
    view = await testRender(
      <MarkdownText
        text={'See ![Build chart](images/chart.png) and ![Logo](https://example.com/logo.png).'}
        features={off('images')}
      />,
    )
    await expect
      .element(page.getByRole('link', { name: 'Build chart' }))
      .toHaveAttribute('href', '/api/files/raw?root=brain&path=images%2Fchart.png')
    await expect
      .element(page.getByRole('link', { name: 'Logo' }))
      .toHaveAttribute('href', 'https://example.com/logo.png')
    expect(document.querySelector('img, figure')).toBeNull()
    expect(document.querySelector('p')?.textContent).toBe('See Build chart and Logo.')
  })

  it('draws an image in a link as its alt text inside that link: never a link in a link', async () => {
    view = await testRender(
      <MarkdownText
        text={'See [![Build chart](images/chart.png)](https://example.com/builds) now.'}
        features={off('images')}
      />,
    )
    const links = [...document.querySelectorAll('a')]
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Build chart', 'https://example.com/builds'],
    ])
    expect(document.querySelector('img, figure')).toBeNull()
  })

  it('names a link round an image with no alt text by its URL: never an empty link', async () => {
    view = await testRender(
      <MarkdownText text={'See [![](images/chart.png)](https://example.com/builds) now.'} features={off('images')} />,
    )
    const links = [...document.querySelectorAll('a')]
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['https://example.com/builds', 'https://example.com/builds'],
    ])
    expect(document.querySelector('img, figure')).toBeNull()
  })
})

describe('the features context', () => {
  it('turns a feature off for every text under it, and the features prop wins over it', async () => {
    view = await testRender(
      <MarkdownFeaturesContext value={off('callouts')}>
        <MarkdownText text={'> [!TIP]\n> From the context.'} />
        <MarkdownText text={'> [!TIP]\n> From the prop.'} features={allRichText} />
      </MarkdownFeaturesContext>,
    )
    const quotes = [...document.querySelectorAll('blockquote')].map((q) => q.textContent)
    expect(quotes).toHaveLength(1)
    expect(quotes[0]).toContain('[!TIP]')
    await expect.element(page.getByText('From the prop.')).toBeVisible()
    expect(document.querySelectorAll('.callout__root')).toHaveLength(1)
  })
})
