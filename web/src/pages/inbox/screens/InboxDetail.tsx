// The open Inbox item, by its kind: a next step, a question from a chat or
// a started item with its chat. It fills the detail pane, which is the
// "task pane" layer of the position check. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDetailView, InboxUi } from '../types.ts'
import { NextStepDetail } from './NextStepDetail.tsx'
import { QuestionDetail } from './QuestionDetail.tsx'
import { RunningDetail } from './RunningDetail.tsx'

const pane = css({ display: 'flex', flexDirection: 'column', flex: '1' })

export type InboxDetailProps = {
  detail: InboxDetailView
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'snoozeOpen' | 'promptOpen'>
  onPromptOpenChange?: ((open: boolean) => void) | undefined
}

export function InboxDetail({ detail, ui, onPromptOpenChange }: InboxDetailProps) {
  return (
    <article className={pane} data-figma="task pane">
      {detail.kind === 'next' ? (
        <NextStepDetail detail={detail} ui={ui} onPromptOpenChange={onPromptOpenChange} />
      ) : null}
      {detail.kind === 'question' ? <QuestionDetail detail={detail} /> : null}
      {detail.kind === 'running' ? <RunningDetail detail={detail} /> : null}
    </article>
  )
}
