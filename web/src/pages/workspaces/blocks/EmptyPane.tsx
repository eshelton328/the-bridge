// A pane with no chat (D1 105:347): start Claude Code, Codex or a shell in
// it, or open a chat of the workspace that no pane shows. The library has
// no empty pane (LIBRARY_GAPS.md): the box is a dashed border.default
// outline and the content library buttons and rows. Props only.
import { Button, ContextMeter, Inline, KindMark, ListRow, Stack, StatusPill } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { AgentKind, OpenableChat } from '../types.ts'

const box = css({
  display: 'flex',
  flex: '1',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[0]',
  minH: '[0]',
  borderRadius: 'xl',
  borderWidth: 'default',
  borderStyle: 'dashed',
  borderColor: 'border.default',
})
const title = css({ textStyle: 'paneTitle', color: 'fg.default' })
const text = css({ textStyle: 'bodySm', color: 'fg.muted' })
const section = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const list = css({ w: 'shell.popoverPicker' })

export type EmptyPaneProps = {
  title: string
  text: string
  start: readonly { kind: AgentKind; label: string }[]
  openLabel: string
  open: readonly OpenableChat[]
}

export function EmptyPane({ title: heading, text: description, start, openLabel, open }: EmptyPaneProps) {
  return (
    <section data-figma="105:347" className={box} aria-label={heading}>
      <Stack gap="12" align="center">
        <h2 className={title}>{heading}</h2>
        <p className={text}>{description}</p>
        <Inline gap="8">
          {start.map((s) => (
            <Button key={s.label} size="sm">
              <KindMark kind={s.kind} size="16" />
              {s.label}
            </Button>
          ))}
        </Inline>
        <Stack gap="2" className={list} data-figma="105:368">
          <span className={section}>{openLabel}</span>
          {open.map((chat) => (
            <ListRow
              key={chat.title}
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
          ))}
        </Stack>
      </Stack>
    </section>
  )
}
