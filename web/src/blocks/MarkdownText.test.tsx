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
