import { InboxItemId } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { inboxStates } from './states/index.ts'
import { allChecks, listView } from './screens/listView.ts'
import type { InboxGroupView, InboxRowView, InboxUi } from './types.ts'

const { list, runningList, filtered, filterList } = inboxStates
const { searchList } = inboxStates
const titles = (view: ReturnType<typeof listView>, group: string) =>
  view.groups.find((g) => g.id === group)?.rows.map((row) => row.title)
const chip = (view: ReturnType<typeof listView>, value: string) => view.filters.find((c) => c.value === value)?.count

describe('listView sort', () => {
  it('keeps the newest first by default', () => {
    expect(titles(listView(list.data, list.ui, ''), 'nextSteps')).toEqual([
      'Write the tickets for increment one',
      'Run the readme cross-family round x2',
      'Commit the brain: 34 changes',
    ])
  })

  it('puts the oldest first', () => {
    expect(titles(listView(list.data, { ...list.ui, sort: 'oldest' }, ''), 'nextSteps')).toEqual([
      'Commit the brain: 34 changes',
      'Run the readme cross-family round x2',
      'Write the tickets for increment one',
    ])
  })

  it('puts approvals first and next steps last by kind', () => {
    const kinds = listView(list.data, { ...list.ui, sort: 'kind' }, '').groups[0]?.rows.map((row) => row.kind)
    expect(kinds).toEqual(['approval', 'question', 'review', 'action'])
  })

  it('groups the rows by project in name order', () => {
    const view = listView(runningList.data, { ...runningList.ui, sort: 'project' }, '')
    const needsYou = view.groups.find((g) => g.id === 'needsYou')
    expect(needsYou?.projects?.map((p) => p.label)).toEqual(['ncc-1701', 'omni-brain'])
    expect(needsYou?.projects?.[0]?.rows.map((row) => row.title)).toEqual([
      'Hono RPC client or plain fetch for the API?',
      'Pick the header logo',
      'Try the tablet layout on the iPad mini',
    ])
    expect(listView(runningList.data, runningList.ui, '').groups[0]?.projects).toBeUndefined()
  })
})

describe('listView search', () => {
  it('keeps the matching rows, drops groups without a match and counts the results', () => {
    const view = listView(runningList.data, runningList.ui, 'F-005')
    expect(view.groups.map((g) => g.id)).toEqual(['needsYou', 'running'])
    expect(view.groups[0]?.count).toBe(3)
    expect(view.results).toBe(4)
    // A search changes the group counts only; the header and chips count the inbox.
    expect(view.count).toBe(7)
    expect(chip(view, 'needs')).toBe(4)
  })

  it("lists the search's Done match under the Done chip, as the hint's Show it promises", () => {
    const view = listView(searchList.data, { ...searchList.ui, filter: 'done' }, 'f-005')
    expect(view.groups.map((g) => g.id)).toEqual(['yesterday'])
    expect(titles(view, 'yesterday')).toEqual(['Save the Inbox frames as references'])
    expect(view.results).toBe(1)
  })

  it('matches a title', () => {
    expect(titles(listView(list.data, list.ui, 'brain'), 'nextSteps')).toEqual(['Commit the brain: 34 changes'])
  })

  it('matches a prompt and a note, as the summary line says', () => {
    expect(titles(listView(list.data, list.ui, 'Backlog'), 'nextSteps')).toEqual([
      'Write the tickets for increment one',
    ])
    expect(listView(list.data, list.ui, 'linear').results).toBe(1)
    expect(titles(listView(list.data, list.ui, 'milestone name'), 'nextSteps')).toEqual([
      'Write the tickets for increment one',
    ])
  })
})

describe('listView filters', () => {
  it('hides the rows of a project left out, and drops the counts by them', () => {
    const view = listView(filtered.data, filtered.ui, '')
    expect(titles(view, 'nextSteps')).toEqual(['Commit the brain: 34 changes'])
    expect(view.applied).toEqual([{ label: 'Project', values: ['ncc-1701', 'omni-brain'] }])
    expect(view.hidden).toBe(1)
    expect(view.count).toBe(6)
    expect(chip(view, 'all')).toBe(6)
    expect(chip(view, 'next')).toBe(1)
    expect(chip(view, 'running')).toBe(1)
  })

  it('previews the checked boxes without applying them', () => {
    const view = listView(filterList.data, filterList.ui, '')
    expect(view.preview).toEqual({ shown: 6, of: 7 })
    expect(view.hidden).toBe(0)
    expect(titles(view, 'nextSteps')).toHaveLength(3)
  })

  it('applies nothing when every box is checked, and narrows to a checked tag', () => {
    const all = allChecks(list.data.filterMenu)
    expect(listView(list.data, { ...list.ui, filters: all }, '').hidden).toBe(0)
    const tagged = listView(list.data, { ...list.ui, filters: all.filter((v) => !v.startsWith('global/')) }, '')
    expect(tagged.hidden).toBe(0)
    const planning = listView(list.data, { ...list.ui, filters: ['global/planning'] }, '')
    expect(planning.count).toBe(1)
    expect(titles(planning, 'nextSteps')).toEqual(['Write the tickets for increment one'])
  })
})

describe('listView snooze, done and dismiss', () => {
  const tickets = InboxItemId.parse('write-the-tickets')
  const readme = InboxItemId.parse('readme-cross-family-round')

  it('moves a snoozed item to Snoozed until its time', () => {
    const view = listView(list.data, { ...list.ui, snoozed: [{ id: tickets, until: '11:40' }] }, '')
    expect(titles(view, 'nextSteps')).not.toContain('Write the tickets for increment one')
    const snoozed = view.groups.find((g) => g.id === 'snoozed')
    expect(snoozed?.count).toBe(2)
    expect(snoozed?.rows[0]?.snoozed).toEqual({ line: 'Snoozed until 11:40', age: 'until 11:40' })
    expect(view.count).toBe(6)
    expect(chip(view, 'next')).toBe(2)
  })

  it('takes out an item marked done, and counts it in Done', () => {
    const view = listView(list.data, { ...list.ui, finished: [{ id: tickets, result: 'done' }] }, '')
    expect(titles(view, 'nextSteps')).toHaveLength(2)
    expect(view.groups.find((g) => g.id === 'snoozed')?.count).toBe(1)
    expect(view.count).toBe(6)
    expect(chip(view, 'done')).toBe(5)
  })

  it('takes out a dismissed item, and counts it in Done', () => {
    const view = listView(list.data, { ...list.ui, finished: [{ id: tickets, result: 'dismissed' }] }, '')
    expect(titles(view, 'nextSteps')).not.toContain('Write the tickets for increment one')
    expect(view.count).toBe(6)
    expect(chip(view, 'next')).toBe(2)
    expect(chip(view, 'done')).toBe(5)
  })

  it('shows only the Done list under the Done chip, with a Today group for the finished items', () => {
    const view = listView(
      list.data,
      { ...list.ui, filter: 'done', finished: [{ id: tickets, result: 'dismissed' }] },
      '',
    )
    expect(view.groups.map((g) => [g.id, g.count])).toEqual([['today', 1]])
    expect(view.groups[0]?.rows[0]?.outcome).toEqual({ line: 'Dismissed', result: 'dismissed' })
    expect(listView(list.data, { ...list.ui, filter: 'done' }, '').groups).toEqual([])
  })

  it('shows a task removed in a discussion in Done, with its outcome', () => {
    const view = listView(list.data, { ...list.ui, filter: 'done', finished: [{ id: tickets, result: 'removed' }] }, '')
    expect(view.groups[0]?.rows[0]?.outcome).toEqual({ line: 'Removed in a discussion', result: 'removed' })
  })

  it('puts the finished items at the top of Today in the Done list, newest first, with how each ended', () => {
    const earlier: InboxRowView = {
      id: InboxItemId.parse('allowed-earlier'),
      kind: 'approval',
      title: 'An approval allowed earlier today',
      meta: 'omni-brain · drift check',
      age: '11:20',
      blocks: null,
      approval: false,
      outcome: { line: 'Allowed once', result: 'done' },
    }
    const today = {
      id: 'today',
      label: 'Today',
      count: 1,
      dot: null,
      rows: [earlier],
    } satisfies InboxGroupView
    const groups = [...list.data.groups, today]
    const finished = [
      { id: tickets, result: 'dismissed' },
      { id: readme, result: 'done' },
    ] satisfies InboxUi['finished']
    const view = listView({ ...list.data, groups }, { ...list.ui, finished }, '')
    const shown = view.groups.find((g) => g.id === 'today')
    expect(shown?.count).toBe(3)
    expect(shown?.rows.map((row) => [row.title, row.outcome])).toEqual([
      ['Run the readme cross-family round x2', { line: 'Marked done', result: 'done' }],
      ['Write the tickets for increment one', { line: 'Dismissed', result: 'dismissed' }],
      ['An approval allowed earlier today', { line: 'Allowed once', result: 'done' }],
    ])
  })
})
