// The detail of a live Inbox item (`GET /api/inbox/:item`), drawn with the
// parts of the question detail (D2, T3, M5): the task bar and title block,
// then for a chat item the chat it came from with Open chat, which opens it
// in Workspaces, and for a brain item its record's text under Context. A
// brain item is read-only here, so its task bar has no Snooze or Dismiss.
// No Allow or Deny (v1). A read that misses, and a snooze, done or dismiss
// that misses, shows one short line under the title block. On a tablet or
// phone it sits under Back, and the phone puts Snooze and Dismiss in the
// nav. Props only.
import { Button, ExternalLinkIcon, Inline, MarkdownView, Panel, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { CopyCode } from '../../../blocks/MarkdownCodeFence.tsx'
import { MarkdownText } from '../../../blocks/MarkdownText.tsx'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import { BackToInbox } from '../blocks/BackToInbox.tsx'
import { DetailHead, SnoozeActions, type SnoozeControl } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import type { InboxDetailHead, InboxRowView, LiveOpen } from '../types.ts'

const grow = css({ flex: '1', minW: '[0]' })
const waitTitle = css({ textStyle: 'labelSm' })
const mono = css({ textStyle: 'monoSm', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
// As QuestionDetail pads the phone's and the tablet's task frame (M5, T3).
const phoneTask = css({ px: '4', pt: '8', pb: '32' })
const tabletTask = css({ pt: '6', pb: '32' })

/** The task bar and title block of a live item, from its row. */
function headOf(row: InboxRowView, open: LiveOpen): InboxDetailHead {
  const status: InboxDetailHead['status'] =
    row.snoozed !== undefined
      ? { tone: 'idle', label: 'Snoozed' }
      : row.kind === 'review'
        ? { tone: 'done', label: 'Review' }
        : { tone: 'needsYou', label: 'Needs you' }
  const origin =
    open.source === 'brain'
      ? `filed ${row.age} ago in the brain`
      : row.kind === 'review'
        ? `finished ${row.age} ago in a chat`
        : `asked ${row.age} ago in a chat`
  const project = row.meta.split(' · ')[0] ?? ''
  return {
    id: row.id,
    status,
    origin,
    title: row.title,
    chips: open.source === 'brain' && project !== 'brain' ? [{ label: project, icon: 'folder', issue: false }] : [],
    tags: row.tags ?? [],
    actions: open.canAct,
  }
}

export type LiveDetailProps = {
  row: InboxRowView
  open: LiveOpen
  layout: Viewport
  snooze: SnoozeControl
  onBack?: (() => void) | undefined
  /** Open chat: the chat item's chat in Workspaces. */
  onOpenChat?: (() => void) | undefined
  /** Copies a code block's code in the record's text (the page's copyText); without it a code block has no copy button. */
  onCopyCode?: CopyCode | undefined
}

export function LiveDetail({ row, open, layout, snooze, onBack, onOpenChat, onCopyCode }: LiveDetailProps) {
  const phone = layout === 'phone'
  const head = headOf(row, open)
  const back =
    layout === 'desktop' ? undefined : (
      <BackToInbox
        onBack={onBack}
        actions={phone && open.canAct ? <SnoozeActions snooze={snooze} iconOnly /> : undefined}
      />
    )
  return (
    <DetailFrame layout={layout} back={back}>
      <Stack
        gap={phone ? '20' : '24'}
        className={phone ? phoneTask : layout === 'tablet' ? tabletTask : undefined}
        data-figma="task · live"
      >
        <DetailHead head={head} snooze={snooze} barActions={!phone} />
        {open.line === null ? null : (
          <span className={hint} role="status">
            {open.line}
          </span>
        )}
        {open.read === 'read' && open.source === 'chat' ? (
          open.chat == null ? (
            <span className={hint}>This chat is no longer in Workspaces</span>
          ) : (
            <div data-figma="blocking">
              <Panel variant="notice" tone={row.kind === 'review' ? 'done' : 'needsYou'}>
                <Inline gap="10" align="center">
                  <div className={grow}>
                    <Stack gap="2">
                      <span className={waitTitle}>{open.chat.title}</span>
                      {open.chat.model === null ? null : <span className={mono}>{open.chat.model}</span>}
                    </Stack>
                  </div>
                  <Button size="sm" textSize="xs" onClick={onOpenChat}>
                    <ExternalLinkIcon />
                    {phone ? 'Open' : 'Open chat'}
                  </Button>
                </Inline>
              </Panel>
            </div>
          )
        ) : null}
        {open.read === 'read' && open.source === 'brain' && open.body !== undefined && open.body.trim() !== '' ? (
          <DetailSection title="Context">
            <BlockBoundary contentKey={row.id}>
              <MarkdownView size="sm" padding="none" inlineCode="badge">
                <MarkdownText text={open.body} size="sm" onCopyCode={onCopyCode} />
              </MarkdownView>
            </BlockBoundary>
          </DetailSection>
        ) : null}
      </Stack>
    </DetailFrame>
  )
}
