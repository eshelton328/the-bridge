// The live Inbox as the page draws it: the server's items (`GET /api/inbox`)
// mapped onto the home's words. The home keeps its layout words (the title,
// the chips' and groups' labels, the sorts, the menus' headings); every row,
// count and the Filter menu's sections come from the server, and the tab
// badge is the server's `counts.needsYou`. An item that is not snoozed is in
// Needs you, as Figma D1 puts its approvals, questions, reviews and actions
// there; a snoozed one is in Snoozed. Next steps, Running and Done have no
// source yet, so they are empty. No row shows Allow or Deny (v1). The
// discussion, the toast and the selected task are the sample's alone and are
// dropped. Pure; tested in liveList.test.ts.
import type { InboxItem, InboxResponse } from '@bridge/contract'
import { InboxItemId } from '@bridge/shared'
import type { InboxData, InboxFilterMenu, InboxGroupView, InboxRowView, InboxUi } from './types.ts'

const minute = 60_000

/** How long ago `iso` was at `now`, short, as the rows write it: "4m", "3h", "2d", "1w". At least 1m. */
function ageOf(iso: string, now: Date): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - Date.parse(iso)) / minute))
  if (minutes < 60) return `${String(minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)}h`
  const days = Math.floor(hours / 24)
  return days < 7 ? `${String(days)}d` : `${String(Math.floor(days / 7))}w`
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** When a snoozed item returns, in local time as the rows write it: "9:00" today, else "Fri 9:00". */
function untilOf(iso: string, now: Date): string {
  const at = new Date(iso)
  const time = `${String(at.getHours())}:${String(at.getMinutes()).padStart(2, '0')}`
  return at.toDateString() === now.toDateString() ? time : `${weekdays[at.getDay()] ?? ''} ${time}`
}

/** The first part of a row's meta line: a chat's "chat", else the item's project, else "brain". */
const placeOf = (item: InboxItem) => (item.source === 'chat' ? 'chat' : (item.project ?? item.source))

/**
 * One item's row. Its snooze, done and dismiss do not reach the server yet, so every live row is read-only here: it has
 * no actions sheet, and no change shows that the server did not make.
 */
function liveRow(item: InboxItem, now: Date): InboxRowView {
  const until = item.snoozedUntil === null ? undefined : untilOf(item.snoozedUntil, now)
  return {
    id: InboxItemId.parse(item.id),
    kind: item.kind,
    title: item.title,
    meta: placeOf(item),
    age: ageOf(item.createdAt, now),
    blocks: item.source === 'chat' && item.kind === 'question' ? 'The chat is waiting' : null,
    approval: false,
    ...(until === undefined ? {} : { snoozed: { line: `Snoozed until ${until}`, age: `until ${until}` } }),
    tags: [...item.tags],
    readOnly: true,
  }
}

const countOf = <T>(items: readonly T[], test: (item: T) => boolean) => items.filter(test).length

/** The values of `items` in first-seen order, each with how many items have it. */
function tally(values: readonly string[]): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].map(([value, count]) => ({ value, label: value, count }))
}

/**
 * The Filter menu of the live items: the home's kinds that some item has, the projects, and the tags in a section
 * per scope ("Tags · global", "Tags · project ncc-1701"), as Figma D4 groups them.
 */
function liveFilterMenu(base: InboxFilterMenu, items: readonly InboxItem[]): InboxFilterMenu {
  const kinds = base.sections[0]
  const kindItems = (kinds?.items ?? [])
    .map((k) => ({ ...k, count: countOf(items, (i) => i.kind === k.value) }))
    .filter((k) => k.count > 0)
  // Each row's place, as listView matches it: a project, or "chat" or "brain" for an item with none, so a chat can be
  // filtered out of a list with one project.
  const projects = tally(items.map(placeOf))
  const tags = items.flatMap((i) => i.tags)
  const scopes = [...new Set(tags.map((t) => (t.startsWith('project/') ? (t.split('/')[1] ?? '') : 'global')))]
  return {
    sections: [
      { label: kinds?.label ?? 'Kind', mono: false, items: kindItems },
      ...(projects.length === 0 ? [] : [{ label: 'Project', mono: true, items: projects }]),
      ...scopes.map((scope) => ({
        label: scope === 'global' ? 'Tags · global' : `Tags · project ${scope}`,
        mono: true,
        items: tally(
          tags.filter((t) => (scope === 'global' ? !t.startsWith('project/') : t.startsWith(`project/${scope}/`))),
        ),
      })),
    ],
  }
}

/** The Filter menu's boxes checked with no filter: every kind and project, no tag (as the home's `noFilter`). */
const noFilterOf = (menu: InboxFilterMenu): string[] =>
  menu.sections.filter((s) => !s.label.startsWith('Tags')).flatMap((s) => s.items.map((i) => i.value))

/** The data and ui of the home with the server's items in place of the sample ones; `line` says why it has none. */
export function liveList(
  base: { data: InboxData; ui: InboxUi },
  response: InboxResponse,
  { now, line = null }: { now: Date; line?: string | null },
): { data: InboxData; ui: InboxUi } {
  const { items, counts } = response
  const rows = items.map((item) => liveRow(item, now))
  const waiting = rows.filter((r) => r.snoozed === undefined)
  const snoozed = rows.filter((r) => r.snoozed !== undefined)
  const label = (id: InboxGroupView['id'], fallback: string) =>
    base.data.groups.find((g) => g.id === id)?.label ?? fallback
  const groups: InboxGroupView[] = [
    { id: 'needsYou', label: label('needsYou', 'Needs you'), count: waiting.length, dot: 'needsYou', rows: waiting },
    { id: 'snoozed', label: label('snoozed', 'Snoozed'), count: snoozed.length, dot: null, rows: snoozed },
  ]
  const chipCounts: Record<string, number> = { all: waiting.length, needs: waiting.length }
  const filterMenu = liveFilterMenu(base.data.filterMenu, items)
  const checks = noFilterOf(filterMenu)
  return {
    // The sample's search, discussion and toast are left out.
    data: {
      sortMenu: base.data.sortMenu,
      railBadge: counts.needsYou,
      count: waiting.length,
      filters: base.data.filters.map((f) => ({ ...f, count: chipCounts[f.value] ?? 0 })),
      filterMenu,
      snoozeMenu: base.data.snoozeMenu,
      groups,
      detail: null,
      live: {
        line,
        items: items.map((i) => ({
          id: InboxItemId.parse(i.id),
          source: i.source,
          chat: i.chat,
          actions: [...i.actions],
        })),
      },
    },
    ui: { ...base.ui, selectedId: null, filters: checks, filterChecks: checks },
  }
}
