import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
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
