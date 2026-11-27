// The Overview's Chats panel (f-008 R7): the project's tagged chats with workspace and status; a press opens one.
// No chat gives one muted line, a missed read its line. Props only.
import { ListRow, PageHeader, Panel, Stack, StatusPill } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectOverview, ProjectPageWords } from '../types.ts'

// The heading row as Inbox and Queue have it (32 high, 44 on touch); the panel spans the desktop's two columns.
const column = css({ display: 'flex', flexDirection: 'column', gap: '16', minW: '[0]', gridColumn: '[1 / -1]' })
const head = {
  desktop: css({ display: 'flex', alignItems: 'center', minH: 'control.md' }),
  touch: css({ display: 'flex', alignItems: 'center', minH: 'control.xl' }),
}
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10' })

// The Workspaces sidebar's tones by status (liveWorkspaces.ts): an unknown chat has the idle tone.
const tones = { working: 'working', needsYou: 'needsYou', idle: 'idle', done: 'done', unknown: 'idle' } as const

export type ChatsPanelProps = {
  chats: NonNullable<ProjectOverview['chats']>
  words: ProjectPageWords['chats']
  layout: Viewport
  onChatOpen?: ((id: string) => void) | undefined
}

export function ChatsPanel({ chats, words, layout, onChatOpen }: ChatsPanelProps) {
  return (
    <section className={column} aria-label={words.title}>
      <div className={layout === 'desktop' ? head.desktop : head.touch}>
        <PageHeader title={words.title} count={chats.rows.length} level={2} size="pane" />
      </div>
      <Panel>
        <Stack gap="0">
          {chats.rows.map((c) => (
            <ListRow
              key={c.id}
              density="compact"
              padding={layout === 'phone' ? 'phoneSides' : undefined}
              title={c.title}
              meta={c.workspace}
              trailing={<StatusPill label={words.statuses[c.status]} tone={tones[c.status]} dot />}
              onSelect={onChatOpen?.bind(undefined, c.id)}
            />
          ))}
          {chats.rows.length === 0 && chats.notRead === undefined ? <p className={line}>{words.none}</p> : null}
          {chats.notRead === undefined ? null : (
            <p role="status" className={line}>
              {chats.notRead}
            </p>
          )}
        </Stack>
      </Panel>
    </section>
  )
}
