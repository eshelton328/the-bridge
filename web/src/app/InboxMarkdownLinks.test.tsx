import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { type Device, devices, openInbox, request, shown, withServer } from './inboxLiveHelpers.ts'
import { expectLinks, linkText } from './markdownLinkChecks.ts'

// Review R56 (the owner: "Can we provide clickable links in the output text"): a brain item's record with links, on
// the owner's path: the app with no URL parameters, Inbox in the nav, then a tap on the item's row, with the
// contract-checked fake of the server's routes (lib/fakeInboxServer.ts). A bare URL and a `www.` link (to https) are
// links that open in a new tab, in the accent colour and underlined; a `mailto:` link and an email are links too; a
// `javascript:` link stays text; a 200-character URL wraps inside Context with no page-wide sideways scroll
// (markdownLinkChecks.ts). Every value is made up.
answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const phoneAndTablet: readonly Device[] = [
  ...devices.filter((device) => device.name === 'the phone'),
  { name: 'the tablet', size: [744, 1133], nav: 'tab · Inbox' },
]

describe("a brain record's links (review R56)", () => {
  for (const device of phoneAndTablet)
    it(`makes the http, https and mailto URLs links and keeps the rest text, on ${device.name}`, async () => {
      withServer([request], { details: { [request.id]: { source: 'brain', body: linkText } } })
      await openInbox(device)
      await expect.poll(shown).toContain(request.title)
      await userEvent.click(page.getByRole('region', { name: 'Inbox list' }).getByText(request.title, { exact: true }))
      const context = page.getByRole('region', { name: 'Context' })
      await expect.element(context.getByRole('link', { name: 'https://example.com/sample/runbook' })).toBeVisible()
      expectLinks(context.element())
      expect(getReports()).toEqual([])
    })
})
