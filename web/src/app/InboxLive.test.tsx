import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { inboxError } from '../lib/fakeInboxServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import {
  badge,
  brainItem,
  chatItem,
  devices,
  hoursFromNow,
  liveLine,
  openInbox,
  question,
  quiet,
  request,
  review,
  shown,
  withServer,
} from './inboxLiveHelpers.ts'

// The live Inbox list (pages/inbox/liveInbox.ts) on the owner's path: the app with no URL parameters, which opens
// the Inbox, then Inbox in the rail on the desktop or the tab bar on the phone, with the contract-checked fake of the
// server's routes and event stream (lib/fakeInboxServer.ts). Every title, chat and project is made up.
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

const sampleTask = 'Write the tickets for increment one'

/** The open Filter menu: a popover on the desktop, a sheet on the phone. */
const filterMenu = (device: (typeof devices)[number]) =>
  page.getByRole('dialog', { name: device.name === 'the phone' ? 'Filter' : 'Filter the inbox' })

/** Opens the Filter menu and closes it with Escape once it has the focus, which applies its boxes. */
async function openAndCloseFilter(device: (typeof devices)[number], meanwhile?: () => Promise<void>) {
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await expect.poll(() => filterMenu(device).query()?.contains(document.activeElement) ?? false).toBe(true)
  await meanwhile?.()
  await userEvent.keyboard('{Escape}')
  await expect.element(filterMenu(device)).not.toBeInTheDocument()
}

describe('the live Inbox list', () => {
  for (const device of devices) {
    it(`lists the server's items, newest first, with no sample one, on ${device.name}`, async () => {
      const server = withServer()
      await openInbox(device)
      await expect
        .poll(shown)
        .toEqual(['Sample question from a chat', 'Sample chat turn to review', 'Sample request in the brain'])
      await expect.element(page.getByText(sampleTask)).not.toBeInTheDocument()
      // No Allow or Deny in v1.
      await expect.element(page.getByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
      expect(server.calls('list').length).toBeGreaterThan(0)
      expect(getReports()).toEqual([])
    })

    it(`shows the server's needs-you count on the Inbox badge, on ${device.name}`, async () => {
      // One question and one open request need the owner; the review and the snoozed request do not.
      withServer([question, review, request, brainItem(4, 'Sample snoozed request', 120, hoursFromNow(3))])
      await openInbox(device)
      await expect
        .poll(shown)
        .toEqual(['Sample question from a chat', 'Sample chat turn to review', 'Sample request in the brain'])
      await expect.element(page.getByRole('button', { name: /Snoozed/ })).toBeVisible()
      await expect.poll(() => badge(device)).toBe(2)
    })

    it(`reads the list again on inbox.changed, once for a burst, on ${device.name}`, async () => {
      const server = withServer([review])
      await openInbox(device)
      await expect.poll(shown).toEqual(['Sample chat turn to review'])
      await expect.poll(() => server.streams()).toBe(1)
      await quiet()
      const before = server.calls('list').length
      server.put(question)
      server.emit('inbox.changed')
      server.emit('inbox.changed')
      await expect.poll(shown).toEqual(['Sample question from a chat', 'Sample chat turn to review'])
      await expect.poll(() => badge(device)).toBe(1)
      await quiet()
      expect(server.calls('list').length - before).toBe(1)
    })

    it(`keeps showing a kind that comes after the Filter menu closed with nothing unchecked, on ${device.name}`, async () => {
      const server = withServer([review])
      await openInbox(device)
      await expect.poll(shown).toEqual(['Sample chat turn to review'])
      await openAndCloseFilter(device)
      server.put(question)
      server.emit('inbox.changed')
      await expect.poll(shown).toEqual(['Sample question from a chat', 'Sample chat turn to review'])
      await expect.element(page.getByRole('button', { name: 'Filter', exact: true })).toBeVisible()
    })

    it(`filters chats out of a list with one project, on ${device.name}`, async () => {
      withServer([question, request])
      await openInbox(device)
      await expect.poll(shown).toEqual(['Sample question from a chat', 'Sample request in the brain'])
      await openAndCloseFilter(device, async () => {
        await filterMenu(device).getByText('chat', { exact: true }).click()
      })
      await expect.poll(shown).toEqual(['Sample request in the brain'])
    })

    it(`keeps a project named like a kind when that kind is unchecked, on ${device.name}`, async () => {
      // A made-up project named "review", as the kind Review: unchecking the kind must not uncheck the project.
      const named = { ...brainItem(5, 'Sample request in a project named review', 20), project: 'review', tags: [] }
      withServer([review, named])
      await openInbox(device)
      await expect.poll(shown).toEqual(['Sample request in a project named review', 'Sample chat turn to review'])
      await openAndCloseFilter(device, async () => {
        await filterMenu(device).getByText('Review', { exact: true }).click()
      })
      await expect.poll(shown).toEqual(['Sample request in a project named review'])
    })

    it(`keeps the tags of a project named "global" apart from the global tags, on ${device.name}`, async () => {
      const inGlobal = {
        ...brainItem(5, 'Sample request in a project named global', 20),
        project: 'global',
        tags: ['project/global/web', 'project/global/docs'],
      }
      // A section narrows the list only while some, not all, of its boxes are checked: the project's section has two.
      const tagged = { ...brainItem(6, 'Sample request with a global tag', 40), tags: ['global/web'] }
      withServer([inGlobal, tagged])
      await openInbox(device)
      await expect.poll(shown).toEqual(['Sample request in a project named global', 'Sample request with a global tag'])
      await openAndCloseFilter(device, async () => {
        await expect.element(filterMenu(device).getByText('Tags · project global', { exact: true })).toBeVisible()
        await filterMenu(device).getByText('project/global/web', { exact: true }).click()
      })
      await expect.poll(shown).toEqual(['Sample request in a project named global'])
    })

    it(`reads no list on a timer, on ${device.name}`, async () => {
      const server = withServer([review])
      await openInbox(device)
      await expect.poll(() => server.streams()).toBe(1)
      await quiet()
      const before = server.calls('list').length
      await quiet(1500)
      expect(server.calls('list').length).toBe(before)
    })

    it(`shows one line and no items when the list misses, and reports the status only, on ${device.name}`, async () => {
      const server = withServer()
      server.answerNext('list', () => inboxError('internal', 500), 10)
      await openInbox(device)
      await expect.element(liveLine('Inbox not read — the server answered 500')).toBeVisible()
      expect(shown()).toEqual([])
      await expect.element(page.getByText(sampleTask)).not.toBeInTheDocument()
      const reports = getReports()
      expect(reports.length).toBeGreaterThan(0)
      for (const r of reports) {
        expect(r.error.name).toBe('InboxMissError')
        expect(r.error.message).toBe('An inbox request missed: list internal 500')
      }
    })

    it(`stays quiet when iOS closes the list read in the background, and reads again on return, on ${device.name}`, async () => {
      const server = withServer([chatItem(5, 'Sample item after a return', 'question', 2)])
      let failed = 0
      server.answerNext(
        'list',
        () => {
          failed += 1
          setHidden(true)
          return Promise.reject(new TypeError('Load failed'))
        },
        1,
      )
      await openInbox(device, async () => {
        await expect.poll(() => failed).toBe(1)
        await quiet()
        expect(document.body.textContent).not.toContain('Inbox not read')
        setHidden(false)
      })
      await expect.poll(shown).toEqual(['Sample item after a return'])
      await expect.element(liveLine('Inbox not read')).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })
  }
})
