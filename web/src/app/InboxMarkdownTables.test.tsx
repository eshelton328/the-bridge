import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { devices, openInbox, request, shown, withServer } from './inboxLiveHelpers.ts'
import { expectGfmInline, expectReadableTable, gfmText, tableIn } from './markdownGfmChecks.ts'

// Review R51 ("The table did not render"): a brain item's record with GitHub Markdown, on the owner's path: the app
// with no URL parameters, Inbox in the nav, then a tap on the item's row, with the contract-checked fake of the
// server's routes (lib/fakeInboxServer.ts). Its pipe table renders as a table that scrolls sideways in its own frame,
// with its first column readable and no page-wide sideways scroll; a strikethrough, a task list and a bare link
// render too (markdownGfmChecks.ts). Every value is made up.
answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

describe("a brain record's GitHub Markdown (review R51)", () => {
  for (const device of devices)
    it(`renders a pipe table, a strikethrough, a task list and a bare link on ${device.name}`, async () => {
      withServer([request], { details: { [request.id]: { source: 'brain', body: gfmText } } })
      await openInbox(device)
      await expect.poll(shown).toContain(request.title)
      await userEvent.click(page.getByRole('region', { name: 'Inbox list' }).getByText(request.title, { exact: true }))
      const context = page.getByRole('region', { name: 'Context' })
      await expect.element(context.getByText('Sample rollout status:')).toBeVisible()
      await expect.element(context.getByRole('table')).toBeVisible()
      expectGfmInline(context.element())
      expectReadableTable(tableIn(context.element()), context.element(), 'sm')
      expect(getReports()).toEqual([])
    })
})
