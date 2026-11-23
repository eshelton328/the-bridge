import { afterEach, describe, expect, it, vi } from 'vitest'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import {
  badge,
  brainItem,
  devices,
  hoursFromNow,
  openInbox,
  question,
  request,
  review,
  shown,
  withServer,
} from './inboxLiveHelpers.ts'

// Screen review R48 on the owner's path: the app opened at `/` with no parameters, then Inbox in the nav, over the
// contract-checked fake server (lib/fakeInboxServer.ts). The server's flag decides where an item goes (f-003, R20): an
// item that needs the owner (a chat's question, an open brain request) is in Needs you, a finished chat's turn in To
// review, a snoozed item in Snoozed. Needs you, its chip and the badge are `counts.needsYou`; the header and the All
// chip are `counts.total`, all from one read. Every title is made up.

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  resetAllStores()
  await setViewport(1512, 982)
})

const later = brainItem(4, 'Sample request snoozed till later', 120, hoursFromNow(3))

/** The first number in the text of the element `figma` names, or null. */
const numberIn = (figma: string) => {
  const digits = /\d+/.exec(document.querySelector(`[data-figma="${figma}"]`)?.textContent ?? '')
  return digits === null ? null : Number(digits[0])
}

/** Each filter chip's label and count, in order. */
const chips = () =>
  [...document.querySelectorAll('[data-figma="filter · chips"] [data-state]')].map((el) => {
    const [, label = '', count = ''] = /^(\D+?)\s*(\d+)$/.exec(el.textContent.trim()) ?? []
    return [label, Number(count)] as const
  })

/** The titles of one group's rows, by its data-figma name. */
const rowsOf = (group: string) => {
  const stack = document.querySelector(`[data-figma="group · ${group}"]`)?.parentElement
  return [...(stack?.querySelectorAll('.list-row__title') ?? [])].map((el) => el.textContent)
}

describe('the live Inbox groups by the server flag', () => {
  for (const device of devices) {
    it(`puts a done chat in To review and counts as the server does, on ${device.name}`, async () => {
      withServer([question, review, request, later])
      await openInbox(device)
      await expect.poll(() => shown().length).toBe(3)
      // counts: { needsYou: 2, total: 4 }.
      await expect.poll(() => badge(device)).toBe(2)
      expect(rowsOf('NEEDS YOU')).toEqual([question.title, request.title])
      expect(numberIn('group · NEEDS YOU')).toBe(2)
      expect(rowsOf('TO REVIEW')).toEqual([review.title])
      expect(numberIn('group · TO REVIEW')).toBe(1)
      expect(numberIn('group · SNOOZED')).toBe(1)
      // The title, the count and its label for a screen reader ("4 tasks").
      expect(document.querySelector('[data-figma="header"]')?.textContent).toBe('Inbox44 tasks')
      expect(chips().slice(0, 3)).toEqual([
        ['All', 4],
        ['Needs you', 2],
        ['To review', 1],
      ])
    })
  }
})
