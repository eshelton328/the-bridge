// The Inbox list as the owner sees it: a state's groups after what he did to
// them (InboxUi): the items he snoozed, marked done or dismissed taken out, the
// filters that apply, the search and the sort. The counts drop by what the
// filters and the task bar take out; a search changes only the group
// counts, as Figma D10 and T10 show. Pure functions, no React.
import type { InboxItemId } from '@bridge/shared'
import {
  type AppliedSection,
  type InboxData,
  type InboxGroupId,
  type InboxGroupView,
  InboxKind,
  type InboxRowView,
  type InboxUi,
  type SortValue,
} from '../types.ts'

/** A group as the list shows it; with the sort by project, its rows under a heading per project. */
type ListGroup = InboxGroupView & { projects?: { label: string; rows: InboxRowView[] }[] | undefined }

export type ListView = {
  groups: ListGroup[]
  /** The header's count, after filters and the Snooze menu. */
  count: number
  filters: InboxData['filters']
  /** The sections the applied filters narrow. */
  applied: AppliedSection[]
  /** How many tasks the applied filters hide. */
  hidden: number
  /** How many tasks the Filter menu's checked boxes would show, of `count` before filters. */
  preview: { shown: number; of: number }
  /** With a search: how many rows match. */
  results: number
}

/** The groups the header and the filter chips count; Snoozed and the Done days are not tasks to do. */
const counted: readonly InboxGroupId[] = ['needsYou', 'nextSteps', 'running']
const chipGroups: Partial<Record<string, InboxGroupId>> = { needs: 'needsYou', next: 'nextSteps', running: 'running' }

/** A row's project: the first part of its meta line ("ncc-1701 · f-005" is in ncc-1701). */
const projectOf = (row: InboxRowView): string => row.meta.split(' · ')[0] ?? ''

/** Each section of the Filter menu that narrows the list: some, not all, of its boxes are checked. */
function appliedSections(menu: InboxData['filterMenu'], checks: readonly string[]): AppliedSection[] {
  return menu.sections.flatMap((section) => {
    const values = section.items.map((item) => item.value).filter((value) => checks.includes(value))
    return values.length === 0 || values.length === section.items.length ? [] : [{ label: section.label, values }]
  })
}

/** Every box of the Filter menu, checked: no filter applies (Clear). */
export const allChecks = (menu: InboxData['filterMenu']): string[] =>
  menu.sections.flatMap((section) => section.items.map((item) => item.value))

/**
 * `checks` with the boxes the menu gained since `seen`, in each section whose seen boxes were all checked: a section
 * that did not narrow the list then does not narrow it now (the live Inbox's menu changes with each read). With no
 * `seen`, `checks` as they are.
 */
export function withNewBoxes(
  menu: InboxData['filterMenu'],
  checks: readonly string[],
  seen: readonly string[] | undefined,
): string[] {
  if (seen === undefined) return [...checks]
  const added = menu.sections.flatMap((section) => {
    const values = section.items.map((item) => item.value)
    const open = values.filter((v) => seen.includes(v)).every((v) => checks.includes(v))
    return open ? values.filter((v) => !checks.includes(v)) : []
  })
  return [...checks, ...added]
}

/** Whether a row passes every narrowing section: its kind, project or one of its tags is checked there. */
function passes(row: InboxRowView, sections: readonly AppliedSection[]): boolean {
  const facets = [row.kind, projectOf(row), ...(row.tags ?? [])]
  return sections.every((section) => facets.some((facet) => section.values.includes(facet)))
}

/** Whether a row matches the search, in its title, its meta line (project, feature and issue IDs), its prompt or its notes. */
function matches(row: InboxRowView, query: string): boolean {
  const q = query.trim().toLowerCase()
  return q === '' || [row.title, row.meta, ...(row.text ?? [])].some((text) => text.toLowerCase().includes(q))
}

/** The rows in the sort's order. The state's rows are newest first. */
function sortRows(rows: readonly InboxRowView[], sort: SortValue): InboxRowView[] {
  if (sort === 'oldest') return rows.toReversed()
  if (sort === 'kind')
    return rows.toSorted((a, b) => InboxKind.options.indexOf(a.kind) - InboxKind.options.indexOf(b.kind))
  return [...rows]
}

/** The rows under a heading per project, the projects in name order, each newest first (D11). */
function byProject(rows: readonly InboxRowView[]): { label: string; rows: InboxRowView[] }[] {
  const labels = [...new Set(rows.map(projectOf))].toSorted()
  return labels.map((label) => ({ label, rows: rows.filter((row) => projectOf(row) === label) }))
}

/** The outcome line of an item the owner finished from the task bar or removed in a discussion; the Done list shows it under the title. */
const finishedLine = {
  done: 'Marked done',
  dismissed: 'Dismissed',
  removed: 'Removed in a discussion',
} as const satisfies Record<InboxUi['finished'][number]['result'], string>

/**
 * The rows the owner finished from the task bar, with how each ended, newest
 * first, as the Done list shows them.
 */
function finishedRows(groups: readonly InboxGroupView[], finished: InboxUi['finished']): InboxRowView[] {
  const all = groups.flatMap((group) => group.rows)
  return finished.toReversed().flatMap(({ id, result }) =>
    all
      .filter((row) => row.id === id)
      // A row that already says how it ended in this way keeps its line, such as a removal's reason (D21).
      .map((row) => ({
        ...row,
        outcome: row.outcome?.result === result ? row.outcome : { line: finishedLine[result], result },
      })),
  )
}

/**
 * Takes out the snoozed and finished items, puts the snoozed ones in
 * Snoozed, until their time, and the finished ones at the top of Today,
 * when the state shows the Done list.
 */
function putAway(groups: readonly InboxGroupView[], ui: Pick<InboxUi, 'snoozed' | 'finished'>): InboxGroupView[] {
  const gone = new Set<InboxItemId>([...ui.finished.map((f) => f.id), ...ui.snoozed.map((s) => s.id)])
  const all = groups.flatMap((group) => group.rows)
  const snoozedRows = ui.snoozed.flatMap(({ id, until }) =>
    all
      .filter((row) => row.id === id)
      .map((row) => ({ ...row, snoozed: { line: `Snoozed until ${until}`, age: `until ${until}` } })),
  )
  const doneRows = finishedRows(groups, ui.finished)
  return groups.map((group) => {
    const rows = group.rows.filter((row) => !gone.has(row.id))
    const before = group.id === 'today' ? doneRows : []
    const after = group.id === 'snoozed' ? snoozedRows : []
    return {
      ...group,
      count: group.count - (group.rows.length - rows.length) + before.length + after.length,
      rows: [...before, ...rows, ...after],
    }
  })
}

/** The groups of the Done list: finished tasks by day. */
const doneDays: readonly InboxGroupId[] = ['today', 'yesterday']

/**
 * The groups the selected chip shows. Done shows only the Done list (All
 * means every open task, not Done; D7 and T7 notes), with the items the owner
 * finished from the task bar in Today, which it adds when the state has
 * none. A state with no Done days shows its search's Done list (Show it,
 * D10). The other chips show the state's groups.
 */
function chipView(data: InboxData, groups: readonly InboxGroupView[], ui: InboxUi): readonly InboxGroupView[] {
  if (ui.filter !== 'done') return groups
  const own = groups.filter((group) => doneDays.includes(group.id))
  const days = own.length === 0 ? (data.search?.done ?? []) : own
  const rows = finishedRows(data.groups, ui.finished)
  if (rows.length === 0 || days.some((group) => group.id === 'today')) return days
  return [{ id: 'today', label: 'Today', count: rows.length, dot: null, rows }, ...days]
}

/** How many rows of the groups `ids` the state has and `after` does not show with `keep`. */
function less(
  before: readonly InboxGroupView[],
  after: readonly InboxGroupView[],
  keep: (row: InboxRowView) => boolean,
  ids: readonly InboxGroupId[],
): number {
  const rows = (groups: readonly InboxGroupView[], k: (row: InboxRowView) => boolean) =>
    groups.filter((g) => ids.includes(g.id)).reduce((n, g) => n + g.rows.filter(k).length, 0)
  return rows(before, () => true) - rows(after, keep)
}

export function listView(data: InboxData, ui: InboxUi, query: string): ListView {
  const groups = putAway(data.groups, ui)
  const applied = appliedSections(data.filterMenu, ui.filters)
  const keep = (row: InboxRowView) => passes(row, applied)
  const all = () => true
  const removed = less(data.groups, groups, all, counted)
  const hidden = less(groups, groups, keep, counted)
  const drafted = appliedSections(data.filterMenu, ui.filterChecks)
  const searching = query.trim() !== ''
  const shown = chipView(data, groups, ui).flatMap((group) => {
    const rows = group.rows.filter((row) => keep(row) && matches(row, query))
    if (searching && rows.length === 0) return []
    const sorted = sortRows(rows, ui.sort)
    return [
      {
        ...group,
        count: group.count - (group.rows.length - rows.length),
        rows: sorted,
        projects: ui.sort === 'project' ? byProject(sorted) : undefined,
      },
    ]
  })
  const chipLess = (value: string): number => {
    const id = chipGroups[value]
    if (value === 'all') return removed + hidden
    // Done gains the items the owner finished from the task bar.
    if (value === 'done') return -finishedRows(data.groups, ui.finished).length
    return id === undefined ? 0 : less(data.groups, groups, keep, [id])
  }
  return {
    groups: shown,
    count: data.count - removed - hidden,
    filters: data.filters.map((chip) => ({ ...chip, count: chip.count - chipLess(chip.value) })),
    applied,
    hidden,
    preview: {
      shown: data.count - removed - less(groups, groups, (row) => passes(row, drafted), counted),
      of: data.count - removed,
    },
    results: shown.reduce((n, group) => n + group.rows.length, 0),
  }
}
