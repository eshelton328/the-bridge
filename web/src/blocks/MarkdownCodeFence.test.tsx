import { ok } from '@bridge/shared'
import type { ExtraProps } from 'react-markdown'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { type CopyCode, MarkdownCodeFence } from './MarkdownCodeFence.tsx'

// The Claude Design canvas loads React 18 (vite.canvas.config.ts), which has neither `use` nor a context that is its
// own provider (Codex review of #511). So the code block takes its Copy as a prop, with no context around it. The code
// is made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

const node: NonNullable<ExtraProps['node']> = {
  type: 'element',
  tagName: 'pre',
  properties: {},
  children: [
    {
      type: 'element',
      tagName: 'code',
      properties: { className: ['language-sh'] },
      children: [{ type: 'text', value: 'pnpm verify\n' }],
    },
  ],
}

describe('a code block alone, with no provider around it', () => {
  it('copies its code through the Copy it is given', async () => {
    const copy = vi.fn<CopyCode>(() => Promise.resolve(ok(undefined)))
    view = await testRender(<MarkdownCodeFence node={node} onCopy={copy} />)
    await expect.element(page.getByText('sh', { exact: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }))
    expect(copy).toHaveBeenCalledWith('pnpm verify')
  })
})
