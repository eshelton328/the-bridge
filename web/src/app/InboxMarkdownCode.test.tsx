import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore } from '../state/settingsStore.ts'
import { devices, openInbox, request, shown, withServer } from './inboxLiveHelpers.ts'

// Chat rich text (2026-11-25): a brain item's record with a fenced code block and inline code, on the owner's path:
// the app with no URL parameters, Inbox in the nav, then a tap on the item's row, with the contract-checked fake of the
// server's routes (lib/fakeInboxServer.ts). The fence is the library's MarkdownCodeBlock with its label and syntax
// colours, and Copy writes its whole code through the page's copyText; the inline code is a badge. Every value is
// made up.
answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const code = ['name: sample-check', 'runs: 3 # a made-up count'].join('\n')
const body = ['Run `pnpm verify` first, then read:', '', '```yaml', code, '```'].join('\n')

/** Swaps the clipboard's writeText for this test and returns what it was given. */
function fakeClipboard(): string[] {
  const copied: string[] = []
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = (value) => {
    copied.push(value)
    return Promise.resolve()
  }
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
  return copied
}

describe("a brain record's code (chat rich text)", () => {
  for (const device of devices)
    it(`draws a coloured code block and an inline badge, and copies the code, on ${device.name}`, async () => {
      withServer([request], { details: { [request.id]: { source: 'brain', body } } })
      const copied = fakeClipboard()
      await openInbox(device)
      await expect.poll(shown).toContain(request.title)
      await userEvent.click(page.getByRole('region', { name: 'Inbox list' }).getByText(request.title, { exact: true }))
      const context = page.getByRole('region', { name: 'Context' })
      await expect.element(context.getByText('yaml', { exact: true })).toBeVisible()
      const block = context.element().querySelector('[data-language="yaml"]')
      if (block === null) throw new Error('no code block')
      // The first load of the highlighter in a test run compiles highlight.js, which can take some seconds.
      await expect
        .poll(() => block.querySelector('[data-kind="comment"]')?.textContent, { timeout: 10_000 })
        .toBe('# a made-up count')
      expect(block.querySelector('pre')?.textContent).toBe(code)
      const inline = context.getByText('pnpm verify', { exact: true }).element()
      expect(getComputedStyle(inline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
      await userEvent.click(context.getByRole('button', { name: 'Copy code' }))
      await expect.poll(() => copied).toEqual([code])
      await expect.element(context.getByText('Copied', { exact: true })).toBeVisible()
      expect(getReports()).toEqual([])
    })

  // Settings → Rich text → Code highlighting off (as its switch sets the store): the same block, label and Copy, with
  // the whole code and no colours.
  it('draws the code with no colours when Code highlighting is off', async () => {
    settingsStore.getState().actions.setRichText('code', false)
    withServer([request], { details: { [request.id]: { source: 'brain', body } } })
    await openInbox(devices[0])
    await expect.poll(shown).toContain(request.title)
    await userEvent.click(page.getByRole('region', { name: 'Inbox list' }).getByText(request.title, { exact: true }))
    const context = page.getByRole('region', { name: 'Context' })
    await expect.element(context.getByText('yaml', { exact: true })).toBeVisible()
    const block = context.element().querySelector('[data-language="yaml"]')
    if (block === null) throw new Error('no code block')
    expect(block.querySelector('pre')?.textContent).toBe(code)
    await expect.element(context.getByRole('button', { name: 'Copy code' })).toBeVisible()
    // The highlighter would colour the comment within the first test's wait; none comes.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    expect(block.querySelector('[data-kind]')).toBeNull()
  })
})
