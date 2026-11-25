import '../index.css'
import { err, ok } from '@bridge/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { MarkdownText } from './MarkdownText.tsx'

// A task list's boxes (remark-gfm) have no label of their own, which axe reports (rule `label`): each box is named by
// its state, is read-only and cannot be changed. The text is made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe("a task list's boxes", () => {
  it('are named by their state and cannot be changed', async () => {
    view = await testRender(<MarkdownText text={'- [x] Write the sample tests\n- [ ] Ship the sample change'} />)
    const done = page.getByRole('checkbox', { name: 'Task done', exact: true })
    const open = page.getByRole('checkbox', { name: 'Task not done', exact: true })
    await expect.element(done).toBeChecked()
    await expect.element(open).not.toBeChecked()
    await expect.element(done).toBeDisabled()
    await expect.element(open).toBeDisabled()
    // Every box has a name: none is left unlabelled.
    for (const box of document.querySelectorAll('input[type="checkbox"]'))
      expect(box.getAttribute('aria-label')).not.toBeNull()
  })
})

describe('a link', () => {
  it('is a link only to an http, https or mailto URL; a relative path and a data: URL stay text', async () => {
    view = await testRender(
      <MarkdownText
        text={
          '[the plan](/sample/plan.md), [the page](https://example.com/sample), [old](http://www.example.com/old), [mail](mailto:sample@example.com) and [raw](data:text/plain,sample)'
        }
      />,
    )
    await expect
      .element(page.getByRole('link', { name: 'the page' }))
      .toHaveAttribute('href', 'https://example.com/sample')
    // An explicit http link keeps its URL: only a bare www. autolink goes to https.
    await expect.element(page.getByRole('link', { name: 'old' })).toHaveAttribute('href', 'http://www.example.com/old')
    await expect.element(page.getByRole('link', { name: 'mail' })).toHaveAttribute('href', 'mailto:sample@example.com')
    expect(document.querySelectorAll('a')).toHaveLength(3)
    await expect.element(page.getByText(/raw/)).toBeVisible()
    await expect.element(page.getByText(/the plan/)).toBeVisible()
  })
})

describe('an explicit link whose text is its www. address', () => {
  // Codex review of #500: only a bare www. autolink goes to https; a Markdown link keeps the URL its author wrote.
  it('keeps its http URL, while the same address written bare goes to https', async () => {
    view = await testRender(
      <MarkdownText text={'[www.example.com](http://www.example.com) and also www.example.org bare'} />,
    )
    await expect
      .element(page.getByRole('link', { name: 'www.example.com' }))
      .toHaveAttribute('href', 'http://www.example.com')
    await expect
      .element(page.getByRole('link', { name: 'www.example.org' }))
      .toHaveAttribute('href', 'https://www.example.org')
  })
})

// Chat rich text (2026-11-25): a fenced block is the library's MarkdownCodeBlock, with its label, syntax colours once
// the highlighter loads, and Copy only when the caller gives one. The code is made up.
const tsFence = ['```ts', 'const total = sum(2, "x")', '// a sample note', '```'].join('\n')

describe('a fenced code block', () => {
  it('shows its label and colours its code, keeping the text whole', async () => {
    view = await testRender(<MarkdownText text={tsFence} />)
    await expect.element(page.getByText('ts', { exact: true })).toBeVisible()
    const block = document.querySelector('[data-language="ts"]')
    if (block === null) throw new Error('no code block')
    // The first load of the highlighter in a test run compiles highlight.js, which can take some seconds.
    await expect
      .poll(() => block.querySelector('[data-kind="keyword"]')?.textContent, { timeout: 10_000 })
      .toBe('const')
    expect(block.querySelector('[data-kind="comment"]')?.textContent).toBe('// a sample note')
    expect(block.querySelector('pre')?.textContent).toBe('const total = sum(2, "x")\n// a sample note')
    // No copy button without a copy.
    expect(page.getByRole('button', { name: 'Copy code' }).query()).toBeNull()
  })

  it('draws a label the chat does not colour plain, and loads nothing for it', async () => {
    view = await testRender(<MarkdownText text={['```rust', 'fn main() {}', '```'].join('\n')} />)
    await expect.element(page.getByText('rust', { exact: true })).toBeVisible()
    expect(document.querySelector('.markdown-code-block [data-kind]')).toBeNull()
  })

  it("copies the block's whole code and says Copied, or Copy failed when the copy missed", async () => {
    const copy = vi.fn((code: string) => Promise.resolve(code === '' ? err('refused' as const) : ok(undefined)))
    view = await testRender(<MarkdownText text={tsFence} onCopyCode={copy} />)
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }))
    expect(copy).toHaveBeenCalledWith('const total = sum(2, "x")\n// a sample note')
    await expect.element(page.getByRole('status')).toHaveTextContent('Copied')
    await view.unmount()
    view = await testRender(<MarkdownText text={tsFence} onCopyCode={() => Promise.resolve(err('refused' as const))} />)
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }))
    await expect.element(page.getByRole('status')).toHaveTextContent('Copy failed')
  })
})
