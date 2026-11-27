// The Overview's Inbox and Queue panels (R5, R6; D01, T01, T01b, M01): each a
// heading with its count over a Panel of groups. Inbox: the project's items,
// "Needs you" open and "To review" closed. Queue: its open PRs as "In
// progress", each with its pill, and the line of repositories not read. Side
// by side and as tall as each other on the desktop; one over the other on a
// tablet or phone. Props only.
import {
  GroupHeader,
  KindTile,
  ListRow,
  PageHeader,
  Panel,
  Stack,
  StatusPill,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectOverview, ProjectPageWords, ProjectsUi } from '../types.ts'
import { ContextDrift } from './ContextDrift.tsx'
import { ChatsPanel } from './ChatsPanel.tsx'

// The frames' heading row is 32 high (44 on touch) with the title in its middle, 16 over the panel.
// On the phone the tab list's 2 px padding, the tabs' 12 gap and a 6 top start the heading row 20 under
// the tabs, as M01 draws it.
const grid = {
  desktop: css({ display: 'grid', gridTemplateColumns: '[repeat(2, minmax(0, 1fr))]', gap: '20', pt: '12' }),
  tablet: css({ display: 'grid', gap: '24', pt: '12' }),
  phone: css({ display: 'grid', gap: '24', pt: '6' }),
} as const satisfies Record<Viewport, string>
const head = {
  desktop: css({ display: 'flex', alignItems: 'center', minH: 'control.md' }),
  touch: css({ display: 'flex', alignItems: 'center', minH: 'control.xl' }),
}
// The panel fills the column, so the shorter panel grows to the other's height.
const column = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16',
  minW: '[0]',
  '& > :last-child': { flex: '1' },
})
const unreadLine = css({ textStyle: 'small', color: 'fg.muted', px: '10' })

const tones = { draft: 'idle', ciFailed: 'danger', ciRunning: 'running', inReview: 'running' } as const

type Group = 'needsYou' | 'toReview' | 'inProgress'

export type OverviewPanelsProps = {
  overview: ProjectOverview
  words: ProjectPageWords
  layout: Viewport
  groupsOpen: NonNullable<ProjectsUi['groupsOpen']>
  onGroupOpen?: ((group: Group, open: boolean) => void) | undefined
  /** Context drift's Run check was pressed (R9). */
  onRunDrift?: (() => void) | undefined
  onChatOpen?: ((id: string) => void) | undefined
}

export function OverviewPanels(props: OverviewPanelsProps) {
  const { overview, words, layout, groupsOpen, onGroupOpen, onRunDrift, onChatOpen } = props
  const { inbox, queue } = overview
  const padding = layout === 'phone' ? 'phoneSides' : undefined
  const open = (group: Group) => groupsOpen[group] ?? group !== 'toReview'
  const group = (name: Group, count: number, rows: ReactNode) => (
    <>
      <GroupHeader
        label={words.panels[name]}
        count={count}
        open={open(name)}
        onOpenChange={(next) => onGroupOpen?.(name, next)}
      />
      {open(name) ? <Stack gap="0">{rows}</Stack> : null}
    </>
  )
  const rows = (items: ProjectOverview['inbox']['needsYou']) =>
    items.map((i) => (
      <ListRow
        key={`${i.title} ${i.age}`}
        density="compact"
        padding={padding}
        title={i.title}
        meta={i.meta}
        leading={<KindTile kind={i.kind} title={words.kinds[i.kind]} />}
        trailing={i.age}
      />
    ))
  const section = (title: string, count: number, body: ReactNode) => (
    <section className={column} aria-label={title}>
      <div className={layout === 'desktop' ? head.desktop : head.touch}>
        <PageHeader title={title} count={count} level={2} size="pane" />
      </div>
      <Panel>
        <Stack gap="4">{body}</Stack>
      </Panel>
    </section>
  )
  return (
    <div className={grid[layout]} data-figma="overview panels">
      {section(
        words.panels.inbox,
        inbox.needsYou.length + inbox.toReview.length,
        <>
          {group('needsYou', inbox.needsYou.length, rows(inbox.needsYou))}
          {group('toReview', inbox.toReview.length, rows(inbox.toReview))}
          {inbox.notRead === undefined ? null : (
            <p role="status" className={unreadLine}>
              {inbox.notRead}
            </p>
          )}
        </>,
      )}
      {section(
        words.panels.queue,
        queue.inProgress.length,
        <>
          {group(
            'inProgress',
            queue.inProgress.length,
            queue.inProgress.map((p) => (
              <ListRow
                key={p.meta}
                density="compact"
                padding={padding}
                title={p.title}
                meta={p.meta}
                trailing={<StatusPill label={words.pulls[p.status]} tone={tones[p.status]} dot />}
              />
            )),
          )}
          {queue.unread === undefined ? null : <p className={unreadLine}>{queue.unread}</p>}
        </>,
      )}
      {overview.drift === undefined ? null : <ContextDrift drift={overview.drift} layout={layout} onRun={onRunDrift} />}
      {overview.chats === undefined ? null : (
        <ChatsPanel chats={overview.chats} words={words.chats} layout={layout} onChatOpen={onChatOpen} />
      )}
    </div>
  )
}
