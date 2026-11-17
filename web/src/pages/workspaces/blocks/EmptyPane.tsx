// A pane with no chat (D1 105:347): start Claude Code, Codex or a shell in
// it, or open a chat of the workspace that no pane shows. The library's
// `EmptyPane` draws the dashed box, the title, the line and the labelled
// list; the start buttons and the rows are library buttons and rows.
// Props only.
import {
  Button,
  ContextMeter,
  EmptyPane as LibraryEmptyPane,
  Inline,
  KindMark,
  ListRow,
  StatusPill,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { AgentKind, OpenableChat } from '../types.ts'

// The split's panel is a flex column; the library's pane fills this box, which carries the pane's Figma layer.
const slot = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })
// D1's rows of the list (105:370, 105:384): `EmptyPane` takes no `data-*`, so the list's box (105:368) has no layer.
const rowLayers = ['105:370', '105:384']

export type EmptyPaneProps = {
  title: string
  text: string
  start: readonly { kind: AgentKind; label: string }[]
  openLabel: string
  open: readonly OpenableChat[]
  /** The Figma layers of the pane and of its list's rows, for the fidelity checks; D1's when not set. */
  figma?: { pane?: string | undefined; rows?: readonly string[] | undefined } | undefined
}

export function EmptyPane(props: EmptyPaneProps) {
  const { title, text, start, openLabel, open, figma } = props
  const rows = figma?.rows ?? rowLayers
  return (
    <div data-figma={figma?.pane ?? '105:347'} className={slot}>
      <LibraryEmptyPane
        title={title}
        description={text}
        listLabel={openLabel}
        actions={start.map((s) => (
          <Button key={s.label} size="sm">
            <KindMark kind={s.kind} size="16" />
            {s.label}
          </Button>
        ))}
      >
        {open.map((chat, i) => (
          <div key={chat.title} data-figma={rows[i]}>
            {/* Figma's rows (105:370) have a 13 px title and a 12 px mono meta, which `compact` draws. */}
            <ListRow
              density="compact"
              title={chat.title}
              leading={<KindMark kind={chat.kind} size="16" />}
              meta={
                <Inline gap="6" align="center">
                  {chat.model}
                  <ContextMeter value={chat.context} high={chat.context >= 75} />
                </Inline>
              }
              trailing={<StatusPill label={chat.status.label} tone={chat.status.tone} dot />}
            />
          </div>
        ))}
      </LibraryEmptyPane>
    </div>
  )
}
