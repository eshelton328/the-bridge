import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearReports, getReports } from '../errors/reporter.ts'
import { inboxError } from '../lib/fakeInboxServer.ts'
import { holdTimers } from '../lib/holdTimers.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { chatItem, devices, openInbox, quiet, shown, withServer } from './inboxLiveHelpers.ts'

// Review R43b on the Inbox page's own list read, on the owner's path: the app opened at `/`, then Inbox in the nav,
// over the contract-checked fake server. The Vite proxy answers 502 with no error body for a server that is down, as
// in a restart; a list read that gets it after the page showed a list keeps that list for the 10 s grace, with no
// line and no report. Past the grace the line shows, with one report. Every title is made up.

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const down = () => new Response('', { status: 502 })
const missLine = 'Inbox not read — the server answered 502'
const inboxReports = () => getReports().filter((r) => r.error.name.startsWith('Inbox'))
const first = ['Sample question from a chat', 'Sample request in the brain', 'Sample chat turn to review']

/** The live Inbox on `device`, its list shown and its stream open, so the page has shown a list it can keep. */
async function shownInbox(device: (typeof devices)[number]) {
  const server = withServer()
  await openInbox(device)
  await expect.poll(shown).toEqual(first)
  await expect.poll(() => server.streams()).toBe(1)
  await quiet()
  return server
}

describe('the live Inbox list through a server restart (review R43b)', () => {
  for (const device of devices) {
    it(`keeps the list with no line for a 9 s outage, then shows the server's list, on ${device.name}`, async () => {
      const server = await shownInbox(device)
      const lists = server.calls('list').length
      const release = holdTimers()
      server.answerNext('list', down)
      server.put(chatItem(4, 'Another sample question', 'question', 1))
      await vi.advanceTimersByTimeAsync(200)
      await renderedUntil(() => server.calls('list').length === lists + 1)
      await afterRendering()
      await vi.advanceTimersByTimeAsync(9_000)
      await afterRendering()
      expect(shown()).toEqual(first)
      expect(document.body.textContent).not.toContain('Inbox not read')
      expect(inboxReports()).toEqual([])
      // The server is back: the next change's read answers.
      release()
      server.put(chatItem(5, 'One more sample question', 'question', 1))
      await expect.poll(() => shown().length).toBe(5)
      expect(document.body.textContent).not.toContain('Inbox not read')
      expect(inboxReports()).toEqual([])
    })

    it(`shows the line with one report when the reads still miss past 10 s, on ${device.name}`, async () => {
      const server = await shownInbox(device)
      const lists = server.calls('list').length
      const release = holdTimers()
      server.answerNext('list', down, 5)
      server.put(chatItem(4, 'Another sample question', 'question', 1))
      await vi.advanceTimersByTimeAsync(200)
      await renderedUntil(() => server.calls('list').length === lists + 1)
      await afterRendering()
      expect(document.body.textContent).not.toContain(missLine)
      // The grace's end loads the list again, and it still misses.
      await vi.advanceTimersByTimeAsync(10_000)
      await renderedUntil(() => document.body.textContent.includes(missLine))
      release()
      expect(shown()).toEqual([])
      expect(inboxReports().map((r) => r.error.message)).toEqual(['An inbox request missed: list status 502'])
    })

    it(`shows an error body's line at once, on ${device.name}`, async () => {
      const server = await shownInbox(device)
      server.answerNext('list', () => inboxError('internal', 500))
      server.put(chatItem(4, 'Another sample question', 'question', 1))
      await expect.poll(() => document.body.textContent.includes('Inbox not read — the server answered 500')).toBe(true)
    })
  }
})
