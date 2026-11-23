import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { inboxError } from '../lib/fakeInboxServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import {
  type Device,
  devices,
  liveLine,
  openInbox,
  question,
  quiet,
  request,
  review,
  shown,
  withServer,
} from './inboxLiveHelpers.ts'

// A live Inbox item on the owner's path (pages/inbox/useLiveItem.ts, screens/LiveDetail.tsx): a tap on its row opens
// its detail from `GET /api/inbox/:item`; a chat item's Open chat opens its chat in Workspaces; Snooze, Mark done and
// Dismiss go to the server's routes, and a brain item has none of them. The fake checks each body against the
// contract (lib/fakeInboxServer.ts). Every title, chat, project and record text is made up.
answerLateServerReads()

afterEach(async () => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(document, 'hidden')
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

/** Makes the page hidden (`hidden` true) or visible again, with the events Safari sends. */
function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
  document.dispatchEvent(new Event('visibilitychange'))
  if (!hidden) window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
}

const details = {
  [question.id]: {
    source: 'chat',
    chat: { chat: question.chat, workspace: 'mac-mini/w1', title: 'sample chat one', model: 'Sample Model 1' },
  },
  [review.id]: { source: 'chat', chat: null },
  [request.id]: { source: 'brain', body: 'A made-up record with **one** line to read.' },
}

/** Taps the row of `title` in the list. */
async function openRow(title: string) {
  await expect.poll(shown).toContain(title)
  await userEvent.click(page.getByRole('region', { name: 'Inbox list' }).getByText(title, { exact: true }))
}

/** The brain record's text, as the detail renders its Markdown. */
const record = () => page.getByText('A made-up record with one line to read.')

/** The open item's detail. */
const detail = () => page.getByRole('heading', { level: 1 }).last()

/** Picks `label` in the open item's Snooze menu: the task bar's on the desktop, the nav's icon on the phone. */
async function snoozeMenuPick(device: Device, label: string) {
  if (device.name === 'the phone') await userEvent.click(page.getByRole('button', { name: 'Snooze', exact: true }))
  else await userEvent.click(page.getByRole('button', { name: /^Snooze$/ }))
  await userEvent.click(page.getByRole('menuitem', { name: new RegExp(label) }))
}

describe('a live Inbox item', () => {
  for (const device of devices) {
    it(`opens a chat item's detail and its chat in Workspaces, with no Allow or Deny, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      const router = await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      await expect.element(page.getByText('Sample Model 1')).toBeVisible()
      // Each list load reads the open item again (the stream's open loads the list once more), so only the item counts.
      expect(new Set(server.calls('detail').map((r) => r.path))).toEqual(new Set([`/api/inbox/${question.id}`]))
      await expect.element(page.getByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
      // Where Open chat goes, as the router is asked: the phone's Inbox and the Workspaces page may change their own URL
      // around it.
      const went: { pathname: string; search: unknown }[] = []
      const stop = router.subscribe('onBeforeNavigate', ({ toLocation }) => {
        went.push({ pathname: toLocation.pathname, search: toLocation.search })
      })
      await userEvent.click(page.getByRole('button', { name: device.name === 'the phone' ? 'Open' : 'Open chat' }))
      await expect
        .poll(() => went.find((to) => to.pathname === '/workspaces'), { timeout: 5000 })
        .toEqual({ pathname: '/workspaces', search: { chat: question.chat } })
      stop()
    })

    it(`says when a chat item's chat is gone, on ${device.name}`, async () => {
      withServer(undefined, { details })
      await openInbox(device)
      await openRow('Sample chat turn to review')
      await expect.element(page.getByText('This chat is no longer in Workspaces')).toBeVisible()
      await expect.element(page.getByRole('button', { name: /^Open/ })).not.toBeInTheDocument()
    })

    it(`snoozes a chat item for an hour through the route, and it moves to Snoozed, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      const before = Date.now()
      await snoozeMenuPick(device, 'In 1 hour')
      await expect.poll(() => server.calls('snooze')).toHaveLength(1)
      const sent = server.calls('snooze')[0]
      expect(sent?.path).toBe(`/api/inbox/${question.id}/snooze`)
      const until = Date.parse(String(Reflect.get(Object(sent?.body), 'until')))
      expect(until - before).toBeGreaterThan(3_590_000)
      expect(until - before).toBeLessThan(3_700_000)
      await expect.poll(shown).toEqual(['Sample request in the brain', 'Sample chat turn to review'])
      await expect.element(page.getByText('sample chat one')).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

    it(`snoozes for the evening when the hour's time shows the same, on ${device.name}`, async () => {
      // Loaded at 19:00, "In 1 hour" and "This evening" both show 20:00; picked at 19:30, the evening still ends at 20:00.
      const at = (h: number, m: number) => {
        const day = new Date()
        day.setHours(h, m, 0, 0)
        return day
      }
      vi.useFakeTimers({ toFake: ['Date'] })
      try {
        vi.setSystemTime(at(19, 0))
        const server = withServer(undefined, { details })
        await openInbox(device)
        await openRow('Sample question from a chat')
        await expect.element(page.getByText('sample chat one')).toBeVisible()
        // The list the stream's open reads again is loaded at 19:00 too.
        await expect.poll(() => server.streams()).toBe(1)
        await quiet()
        const from = server.requests.length
        vi.setSystemTime(at(19, 30))
        await snoozeMenuPick(device, 'This evening')
        await expect.poll(() => server.calls('snooze')).toHaveLength(1)
        // No list read between 19:30 and the snooze: the menu is still the one loaded at 19:00.
        const sent = server.requests.slice(from).map((r) => r.call)
        expect(sent.slice(0, sent.indexOf('snooze'))).not.toContain('list')
        const until = String(Reflect.get(Object(server.calls('snooze')[0]?.body), 'until'))
        expect(new Date(until)).toEqual(at(20, 0))
      } finally {
        vi.useRealTimers()
      }
    })

    it(`marks a chat item done and dismisses another through the routes, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      await snoozeMenuPick(device, 'Mark done')
      await expect.poll(shown).toEqual(['Sample request in the brain', 'Sample chat turn to review'])
      await openRow('Sample chat turn to review')
      await expect.element(page.getByText('This chat is no longer in Workspaces')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Dismiss', exact: true }))
      await expect.poll(shown).toEqual(['Sample request in the brain'])
      expect(server.calls('done').map((r) => r.body)).toEqual([{}])
      expect(server.calls('dismiss').map((r) => r.path)).toEqual([`/api/inbox/${review.id}/dismiss`])
      expect(getReports()).toEqual([])
    })

    it(`shows one line and keeps the item when a mark gets 409, with no report, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      server.answerNext('done', () => inboxError('inbox-read-only', 409))
      await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      await snoozeMenuPick(device, 'Mark done')
      await expect.element(liveLine('Not marked done — it is read-only here')).toBeVisible()
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      // The phone's detail covers the list; the desktop's list keeps the row.
      if (device.name === 'the desktop') expect(shown()).toContain('Sample question from a chat')
      expect(getReports()).toEqual([])
    })

    it(`shows one line when a mark fails, and reports its kind and status only, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      server.answerNext('dismiss', () => inboxError('internal', 500))
      await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Dismiss', exact: true }))
      await expect.element(liveLine('Not dismissed — the server answered 500')).toBeVisible()
      expect(getReports().map((r) => [r.error.name, r.error.message])).toEqual([
        ['InboxMissError', 'An inbox request missed: dismiss internal 500'],
      ])
    })

    it(`shows a brain item's record with no Snooze, Mark done or Dismiss, on ${device.name}`, async () => {
      withServer(undefined, { details })
      await openInbox(device)
      await openRow('Sample request in the brain')
      await expect.element(record()).toBeVisible()
      await expect.element(detail()).toHaveTextContent('Sample request in the brain')
      await expect.element(page.getByRole('button', { name: /^Snooze$/ })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Dismiss', exact: true })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /More actions/ })).not.toBeInTheDocument()
    })

    it(`reads the open brain record again when the Inbox changes, on ${device.name}`, async () => {
      const edited: Record<string, unknown> = { ...details }
      const server = withServer(undefined, { details: edited })
      await openInbox(device)
      await openRow('Sample request in the brain')
      await expect.element(record()).toBeVisible()
      edited[request.id] = { source: 'brain', body: 'The same made-up record, edited.' }
      server.emit('inbox.changed')
      await expect.element(page.getByText('The same made-up record, edited.')).toBeVisible()
      await expect.element(record()).not.toBeInTheDocument()
    })

    it(`keeps another item open when a mark answers after it opened, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      let answer: (response: Response) => void = () => undefined
      server.answerNext('dismiss', () => new Promise<Response>((resolve) => (answer = resolve)))
      await openInbox(device)
      await openRow('Sample question from a chat')
      await expect.element(page.getByText('sample chat one')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Dismiss', exact: true }))
      await expect.poll(() => server.calls('dismiss')).toHaveLength(1)
      if (device.name === 'the phone') await userEvent.click(page.getByRole('button', { name: 'Back to Inbox' }))
      await openRow('Sample request in the brain')
      await expect.element(record()).toBeVisible()
      answer(new Response(null, { status: 204 }))
      await quiet()
      await expect.element(record()).toBeVisible()
    })

    it(`shows one line when the detail read fails, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      server.answerNext('detail', () => inboxError('internal', 500))
      await openInbox(device)
      await openRow('Sample request in the brain')
      await expect.element(liveLine('Not read — the server answered 500')).toBeVisible()
    })

    it(`stays quiet when iOS closes the detail read in the background, and reads again on return, on ${device.name}`, async () => {
      const server = withServer(undefined, { details })
      let failed = 0
      server.answerNext('detail', () => {
        failed += 1
        setHidden(true)
        return Promise.reject(new TypeError('Load failed'))
      })
      await openInbox(device)
      await openRow('Sample request in the brain')
      await expect.poll(() => failed).toBe(1)
      await quiet()
      expect(document.body.textContent).not.toContain('Not read')
      setHidden(false)
      await expect.element(record()).toBeVisible()
      expect(document.body.textContent).not.toContain('Not read')
      // The read that iOS closed, then at least the one on return (a list load reads the open item too).
      expect(server.calls('detail').length).toBeGreaterThanOrEqual(2)
      expect(getReports()).toEqual([])
    })
  }

  it('has no actions sheet on a long press of a brain row on the phone', async () => {
    withServer([request], { details })
    await openInbox(devices[1])
    await expect.poll(shown).toEqual(['Sample request in the brain'])
    const row = page.getByRole('region', { name: 'Inbox list' }).getByText('Sample request in the brain').element()
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    await quiet()
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
  })
})
