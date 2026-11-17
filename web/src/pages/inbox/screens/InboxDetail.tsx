// The open Inbox item, by its kind: a next step, a question from a chat or
// a started item with its chat. It fills the detail pane, which is the
// "task pane" layer of the position check. With a side, such as the
// discussion, the item keeps its column and the side takes the rest of the
// pane. Props only.
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDetailView, InboxUi } from '../types.ts'
import { NextStepDetail } from './NextStepDetail.tsx'
import { QuestionDetail } from './QuestionDetail.tsx'
import { RunningDetail } from './RunningDetail.tsx'

const pane = css({ display: 'flex', flexDirection: 'column', flex: '1' })
const withSide = css({ display: 'flex', flexDirection: 'row', flex: '1' })
const column = css({ flexShrink: '0', overflowY: 'auto' })

export type InboxDetailProps = {
  detail: InboxDetailView
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'snoozeOpen' | 'promptOpen'>
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** The task has a discussion: Discuss shows in its task bar, pressed while the discussion is open. */
  discuss?: { open: boolean } | undefined
  /** Beside the item, such as the open discussion. */
  side?: ReactNode
}

export function InboxDetail({ detail, ui, onPromptOpenChange, discuss, side }: InboxDetailProps) {
  const item = (
    <>
      {detail.kind === 'next' ? (
        <NextStepDetail detail={detail} ui={ui} onPromptOpenChange={onPromptOpenChange} discuss={discuss} />
      ) : null}
      {detail.kind === 'question' ? <QuestionDetail detail={detail} /> : null}
      {detail.kind === 'running' ? <RunningDetail detail={detail} /> : null}
    </>
  )
  if (side === undefined)
    return (
      <article className={pane} data-figma="task pane">
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
