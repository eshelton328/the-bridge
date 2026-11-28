// The Overview's Chats panel (f-008 R7): the project's tagged chats with workspace, tags and status; a press opens one.
// The search (title or workspace) and the area chips filter the rows, and the pager shows 10 of them at a time
// (NCC-130 AC3). No chat gives one muted line, a missed read its line and no count. Props only.
import {
  FilterChips,
  ListRow,
  PageHeader,
  Pager,
  Panel,
  SearchField,
  SearchIcon,
  Stack,
  StatusPill,
} from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectOverview, ProjectPageWords } from '../types.ts'

// The heading row as Inbox and Queue have it (32 high, 44 on touch); the panel spans the desktop's two columns.
const column = css({ display: 'flex', flexDirection: 'column', gap: '16', minW: '[0]', gridColumn: '[1 / -1]' })
const head = {
  desktop: css({ display: 'flex', alignItems: 'center', minH: 'control.md' }),
  touch: css({ display: 'flex', alignItems: 'center', minH: 'control.xl' }),
}
const tools = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12', minW: '[0]' })
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10' })

// The Workspaces sidebar's tones by status (liveWorkspaces.ts): an unknown chat has the idle tone.
const tones = { working: 'working', needsYou: 'needsYou', idle: 'idle', done: 'done', unknown: 'idle' } as const
const pageSizes = [10, 25, 50] as const

type Rows = NonNullable<ProjectOverview['chats']>['rows']

/** Each area tag of `rows` with its number of chats, by name. */
function areas(rows: Rows) {
  const counts = new Map<string, number>()
  for (const tag of rows.flatMap((r) => r.tags ?? []).filter((t) => t.startsWith('area/')))
    counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([value, count]) => ({ value, label: value, count }))
}

export type ChatsPanelProps = {
  chats: NonNullable<ProjectOverview['chats']>
  words: ProjectPageWords['chats']
  layout: Viewport
  onChatOpen?: ((id: string) => void) | undefined
}

export function ChatsPanel({ chats, words, layout, onChatOpen }: ChatsPanelProps) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(pageSizes[0])
  const text = query.trim().toLowerCase()
  const chips = areas(chats.rows)
  // A refresh can drop an area's last chat and so its chip: a pick with no chip filters nothing.
  const active = picked.filter((t) => chips.some((c) => c.value === t))
  const shown = chats.rows.filter(
    (c) =>
      (text === '' || `${c.title} ${c.workspace}`.toLowerCase().includes(text)) &&
      (active.length === 0 || active.some((t) => c.tags?.includes(t))),
  )
  const pages = Math.max(1, Math.ceil(shown.length / pageSize))
  const at = Math.min(page, pages)
  const read = chats.notRead === undefined
  return (
    <section className={column} aria-label={words.title}>
      <div className={layout === 'desktop' ? head.desktop : head.touch}>
        <PageHeader title={words.title} count={read ? chats.rows.length : undefined} level={2} size="pane" />
      </div>
      {chats.rows.length === 0 ? null : (
        <div className={tools}>
          <SearchField
            label={words.search}
            placeholder={words.search}
            icon={<SearchIcon />}
            value={query}
            onValueChange={(next) => {
              setQuery(next)
              setPage(1)
            }}
          />
          {chips.length === 0 ? null : (
            <FilterChips
              label={words.chips}
              items={chips}
              value={active}
              size={layout === 'phone' ? 'phone' : 'compact'}
              onValueChange={(next) => {
                setPicked(next)
                setPage(1)
              }}
            />
          )}
        </div>
      )}
      <Panel>
        <Stack gap="0">
          {shown.slice((at - 1) * pageSize, at * pageSize).map((c) => (
            <ListRow
              key={c.id}
              density="compact"
              padding={layout === 'phone' ? 'phoneSides' : undefined}
              title={c.title}
              meta={[c.workspace, ...(c.tags ?? [])].join(' · ')}
              trailing={<StatusPill label={words.statuses[c.status]} tone={tones[c.status]} dot />}
              onSelect={onChatOpen?.bind(undefined, c.id)}
            />
          ))}
          {chats.rows.length === 0 && read ? <p className={line}>{words.none}</p> : null}
          {chats.rows.length > 0 && shown.length === 0 ? <p className={line}>{words.noMatch}</p> : null}
          {read ? null : (
            <p role="status" className={line}>
              {chats.notRead}
            </p>
          )}
          {shown.length === 0 ? null : (
            <Pager
              page={at}
              pageSize={pageSize}
              total={shown.length}
              onPageChange={setPage}
              pageSizes={pageSizes}
              onPageSizeChange={(next) => {
                setPageSize(next)
                setPage(1)
              }}
              size={layout}
            />
          )}
        </Stack>
      </Panel>
    </section>
  )
}
