import { InboxResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { inboxHome } from './home.ts'
import { liveList, snoozeAt } from './liveList.ts'
import { listView } from './screens/listView.ts'

// The live Inbox's mapping (liveList.ts): made-up items onto the home's words.
const now = new Date(2026, 0, 15, 10, 0)
const ago = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

const response = InboxResponse.parse({
  items: [
    {
      id: 'c000000000000001',
      source: 'chat',
      kind: 'question',
      title: 'Sample question',
      project: null,
      tags: [],
      needsYou: true,
      snoozedUntil: null,
      createdAt: ago(4),
      chat: 'mac-mini/s1',
      origin: null,
      actions: ['snooze', 'done', 'dismiss'],
    },
    {
      id: 'b000000000000002',
      source: 'brain',
      kind: 'action',
      title: 'Sample request',
      project: 'sample-project',
      tags: ['global/review', 'project/sample-project/web'],
      needsYou: false,
      snoozedUntil: new Date(2026, 0, 16, 9, 0).toISOString(),
      createdAt: ago(3 * 60),
      chat: null,
      origin: null,
      actions: [],
    },
  ],
  counts: { needsYou: 1, total: 2 },
})

/** The response with a finished chat's turn and an open brain request added. */
const withReview = InboxResponse.parse({
  items: [
    ...response.items,
    { ...response.items[0], id: 'c000000000000003', kind: 'review', title: 'Sample review', needsYou: false },
    { ...response.items[1], id: 'b000000000000004', title: 'Open request', needsYou: true, snoozedUntil: null },
  ],
  counts: { needsYou: 2, total: 4 },
})

describe('liveList', () => {
  const { data, ui } = liveList(inboxHome, response, { now })

  it('puts a waiting item in Needs you and a snoozed one in Snoozed, with the server badge', () => {
    expect(data.groups.map((g) => [g.id, g.rows.map((r) => r.title)])).toEqual([
      ['needsYou', ['Sample question']],
      ['toReview', []],
      ['snoozed', ['Sample request']],
    ])
    expect(data.railBadge).toBe(1)
    expect(data.count).toBe(2)
    expect(data.detail).toBeNull()
    expect(data.discussion).toBeUndefined()
    expect(ui.selectedId).toBeNull()
  })

  it('draws a row with its age, no Allow or Deny, and a brain row read-only', () => {
    const [question, request] = data.groups.flatMap((g) => g.rows)
    expect(question).toMatchObject({ age: '4m', meta: 'chat', approval: false, readOnly: false })
    expect(request).toMatchObject({
      age: '3h',
      meta: 'sample-project',
      readOnly: true,
      snoozed: { line: 'Snoozed until Fri 9:00', age: 'until Fri 9:00' },
    })
  })

  it('builds the Filter menu from the items, with a chat as its own place, and every kind and project checked', () => {
    expect(data.filterMenu.sections.map((s) => [s.label, s.items.map((i) => i.value)])).toEqual([
      ['Kind', ['kind:question', 'kind:action']],
      ['Project', ['project:chat', 'project:sample-project']],
      ['Tags · global', ['tag:global/review']],
      ['Tags · project sample-project', ['tag:project/sample-project/web']],
    ])
    expect(data.filterMenu.sections.map((s) => s.items.map((i) => i.label))).toEqual([
      ['Question', 'Action'],
      ['chat', 'sample-project'],
      ['global/review'],
      ['project/sample-project/web'],
    ])
    expect(ui.filters).toEqual(['kind:question', 'kind:action', 'project:chat', 'project:sample-project'])
  })

  it('shows the time each snooze ends in the Snooze menu', () => {
    expect(data.snoozeMenu.times.map((t) => t.time)).toEqual(['11:00', '20:00', 'Fri 9:00'])
  })

  it("puts a finished chat's turn in To review, and counts the groups, chips and header as the server does", () => {
    const live = liveList(inboxHome, withReview, { now }).data
    expect(live.groups.map((g) => [g.label, g.count, g.rows.map((r) => r.title)])).toEqual([
      ['Needs you', 2, ['Sample question', 'Open request']],
      ['To review', 1, ['Sample review']],
      ['Snoozed', 1, ['Sample request']],
    ])
    expect([live.count, live.railBadge]).toEqual([4, 2])
    expect(live.filters.map((f) => [f.label, f.count])).toEqual([
      ['All', 4],
      ['Needs you', 2],
      ['To review', 1],
      ['Next steps', 0],
      ['Running', 0],
      ['Done', 0],
    ])
  })

  it('shows only the group of the chip the owner picked', () => {
    const live = liveList(inboxHome, withReview, { now })
    const shownFor = (filter: string) =>
      listView(live.data, { ...live.ui, filter }, '').groups.map((g) => [g.id, g.rows.map((r) => r.title)])
    expect(shownFor('review')).toEqual([['toReview', ['Sample review']]])
    expect(shownFor('needs')).toEqual([['needsYou', ['Sample question', 'Open request']]])
    expect(shownFor('all').map(([id]) => id)).toEqual(['needsYou', 'toReview', 'snoozed'])
  })

  it('takes a snoozed item that a filter hides out of the header and All, as counts.total has it', () => {
    const live = liveList(inboxHome, withReview, { now })
    // Only the chat place stays checked: the two brain items (one snoozed) are hidden.
    const filters = live.ui.filters.filter((v) => v !== 'project:sample-project')
    const view = listView(live.data, { ...live.ui, filters, filterChecks: filters }, '')
    expect(view.count).toBe(2)
    expect(view.filters.find((f) => f.value === 'all')?.count).toBe(2)
    expect(view.hidden).toBe(2)
  })

  it('keeps the line of a list that missed', () => {
    const empty = InboxResponse.parse({ items: [], counts: { needsYou: 0, total: 0 } })
    expect(liveList(inboxHome, empty, { now, line: 'Inbox not read' }).data.live?.line).toBe('Inbox not read')
  })
})

describe('snoozeAt', () => {
  it('ends in an hour, this evening at 20:00 or tomorrow at 9:00', () => {
    expect(snoozeAt('hour', now)).toEqual(new Date(2026, 0, 15, 11, 0))
    expect(snoozeAt('evening', now)).toEqual(new Date(2026, 0, 15, 20, 0))
    expect(snoozeAt('morning', now)).toEqual(new Date(2026, 0, 16, 9, 0))
    expect(snoozeAt('pick', now)).toBeUndefined()
  })

  it("takes tomorrow's evening once this evening is past", () => {
    expect(snoozeAt('evening', new Date(2026, 0, 15, 21, 30))).toEqual(new Date(2026, 0, 16, 20, 0))
  })
})
