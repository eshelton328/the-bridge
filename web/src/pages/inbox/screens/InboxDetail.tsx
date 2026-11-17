// The open Inbox item, by its kind: a next step, a question from a chat or
// a started item with its chat. On the desktop it fills the detail pane,
// which is the "task pane" layer of the position check; with a side, such
// as the discussion, the item keeps its column and the side takes the rest
// of the pane. On a tablet or phone it fills the screen, under Back.
// Props only.
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { BackToInbox } from '../blocks/BackToInbox.tsx'
import { type DiscussControl, SnoozeActions } from '../blocks/DetailHead.tsx'
import { type InboxDrafts, type InboxDetailView, type InboxSnoozeMenu, type InboxUi } from '../types.ts'
import { NextStepDetail } from './NextStepDetail.tsx'
import { QuestionDetail } from './QuestionDetail.tsx'
import { RunningDetail } from './RunningDetail.tsx'

const pane = css({ display: 'flex', flexDirection: 'column', flex: '1' })
const withSide = css({ display: 'flex', flexDirection: 'row', flex: '1' })
const column = css({ flexShrink: '0', overflowY: 'auto' })

export type InboxDetailProps = {
  detail: InboxDetailView
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'snoozeOpen' | 'promptOpen'>
  /** The Snooze menu's entries. */
  snoozeMenu?: InboxSnoozeMenu | undefined
  /** The screen's layout; on a tablet or phone the item has Back. */
  layout?: Viewport | undefined
  /** Back on a tablet or phone. */
  onBack?: (() => void) | undefined
  /** View task in a started task's chat on the desktop; see `RunningDetail`. */
  onViewTask?: (() => void) | undefined
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** The task has a discussion: Discuss shows in its task bar; see `DetailHead`. */
  discuss?: DiscussControl | undefined
  /** Undo on the line under a prompt that a discussion changed. */
  onUndoChange?: (() => void) | undefined
  /** Beside the item, such as the open discussion. */
  side?: ReactNode
  /** Keeps what Erik types in the item; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** Reports a menu, the prompt editor or the Run in picker opened or closed. */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
  /** A snooze time, or `null` for Mark done, picked in the Snooze menu. */
  onSnooze?: ((until: string | null) => void) | undefined
  /** Dismiss in the task bar. */
  onDismiss?: (() => void) | undefined
}

export function InboxDetail({
  detail,
  ui,
  snoozeMenu,
  layout = 'desktop',
  onBack,
  onViewTask,
  onPromptOpenChange,
  discuss,
  onUndoChange,
  side,
  drafts,
  onUiChange,
  onSnooze,
  onDismiss,
}: InboxDetailProps) {
  const snooze = {
    menu: snoozeMenu,
    open: ui.snoozeOpen,
    onOpenChange: (snoozeOpen: boolean) => {
      onUiChange?.({ snoozeOpen })
    },
    onPick: onSnooze,
    onDismiss,
  }
  // The phone puts Snooze and Dismiss in the nav, as icons (M2); a finished item has neither.
  const navActions =
    layout === 'phone' && detail.kind !== 'running' && detail.actions ? (
      <SnoozeActions snooze={snooze} iconOnly />
    ) : undefined
  const back = layout === 'desktop' ? undefined : <BackToInbox onBack={onBack} actions={navActions} />
  const item = (
    <>
      {detail.kind === 'next' ? (
        <NextStepDetail
          detail={detail}
          ui={ui}
          layout={layout}
          back={back}
          onPromptOpenChange={onPromptOpenChange}
          discuss={discuss}
          onUndoChange={onUndoChange}
          drafts={drafts}
          snooze={snooze}
          onUiChange={onUiChange}
        />
      ) : null}
      {detail.kind === 'question' ? (
        <QuestionDetail detail={detail} layout={layout} back={back} drafts={drafts} snooze={snooze} />
      ) : null}
      {detail.kind === 'running' ? (
        <RunningDetail detail={detail} layout={layout} onBack={onBack} drafts={drafts} onViewTask={onViewTask} />
      ) : null}
    </>
  )
  if (side === undefined)
    return (
      <article className={pane} data-figma={layout === 'desktop' ? 'task pane' : undefined}>
        {item}
      </article>
    )
  return (
    <article className={withSide} data-figma="task pane">
      <div className={column}>{item}</div>
      {side}
    </article>
  )
}
