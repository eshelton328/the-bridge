// A live Claude chat's terminal dialog (R69, restyled in R72), drawn after
// the transcript's entries while the chat needs the owner. The card is a
// library `Panel` with the needs-you border, as the Inbox's waiting card is:
// a muted status line with a terminal icon ("Waiting for your answer"), the
// dialog's title only when it says more than the question, and the question
// as the main text with its line breaks. The options are one `OptionList`
// in its `card` variant, as the Inbox draws the options of a question (D2):
// a full-width row per option with a radio, the label and, when the server
// sends one, the option's `detail` as a muted second line; the chosen row
// is outlined. A row is 44 high or more. A tap chooses a row and "Send
// answer" sends it (R72: one way for every dialog kind), so a slip of the
// finger sends nothing. The server lists only the options a tap can
// answer, with their own numbers (free-text ones such as "Type something"
// stay out); the number is not shown, and a quiet line says "Other answers:
// in the terminal". While an answer goes, after it went and after a 409
// `dialogChanged` the rows and the button are off; a 409 shows a quiet note
// until the next read; another miss shows a line, with Retry when it may
// work later. A dialog the server could not read for sure (no `options`)
// shows the text it read, read-only, in a recessed box that scrolls when
// long, and the note "Answer in the terminal". Props only.
import type { PaneDialog } from '@bridge/contract'
import {
  Button,
  CheckIcon,
  Inline,
  OptionList,
  Panel,
  ProposalCommand,
  Stack,
  TerminalIcon,
} from '@eshelton328/component-library-1701'
import { useId, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { DialogView } from './chatDialog.ts'
import { TranscriptProblem } from './TranscriptProblem.tsx'

/** The card's words: picked by the chat that built the card (d-101, R72). */
const dialogText = {
  status: 'Waiting for your answer',
  options: 'Answers',
  send: 'Send answer',
  sending: 'Sending…',
  sent: 'Sent',
  answerThere: 'Answer in the terminal',
  changed: 'The terminal changed — showing the new state',
  otherAnswers: 'Other answers: in the terminal',
} as const

// The status line: small and muted, its icon in the needs-you colour, as the chat's "Needs you" pill.
const statusLine = css({ textStyle: 'small', color: 'fg.muted' })
const statusIcon = css({ display: 'inline-flex', color: 'status.needsYou.fg' })
const titleText = css({ m: '0', textStyle: 'label', color: 'fg.default', overflowWrap: 'anywhere' })
// The question keeps the dialog's line breaks, in the transcript's body text.
const questionText = css({
  m: '0',
  textStyle: 'body',
  color: 'fg.default',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
})
// The read text of a dialog with no options scrolls inside its box past the skill list's height (LIBRARY_GAPS.md:
// Terminal dialog card).
const rawBox = css({ maxH: 'shell.pickerHeight', overflowY: 'auto' })
const quietLine = css({ m: '0', textStyle: 'small', color: 'fg.muted' })
// Send answer keeps to the end of the row, also on its own line when the row wraps on a phone.
const atEnd = css({ ml: 'auto' })

/** The question of `dialog`, and its title when the title says more than the question. */
function heading(dialog: PaneDialog): { title: string | undefined; question: string | undefined } {
  const question = dialog.body?.trim() === '' ? undefined : dialog.body
  const title = dialog.title?.trim()
  const same = title !== undefined && question?.trim() === title
  return { title: title === undefined || title === '' || same ? undefined : title, question }
}

export type DialogCardProps = {
  view: DialogView
  /** Sends the option numbered `n`; the owner chose it and pressed Send answer. */
  onAnswer: (n: number) => void
  /** Sends the failed answer again. */
  onRetry: () => void
}

export function DialogCard({ view, onAnswer, onRetry }: DialogCardProps) {
  const { dialog, phase } = view
  const statusId = useId()
  // The chosen row, kept for this dialog only. Each change of the dialog's ID clears it, also back to an ID shown
  // before (A, B, then A again), so an answer always needs a fresh choice.
  const [chosen, setChosen] = useState<{ id: string; n: number } | undefined>(undefined)
  // The option the last Send answer sent: Retry sends it again, so it shows only while that row is the chosen one.
  const [sentN, setSentN] = useState<number | undefined>(undefined)
  const [shownId, setShownId] = useState(dialog.id)
  if (shownId !== dialog.id) {
    setShownId(dialog.id)
    setChosen(undefined)
    setSentN(undefined)
  }
  const off = phase === 'sending' || phase === 'sent' || phase === 'changed'
  const options = dialog.options ?? []
  const pick = chosen?.id === dialog.id ? chosen.n : undefined
  const { title, question } = heading(dialog)
  const send = () => {
    if (off || pick === undefined) return
    setSentN(pick)
    onAnswer(pick)
  }
  const retry = view.retry === true && pick !== undefined && pick === sentN
  const sendLabel = phase === 'sending' ? dialogText.sending : phase === 'sent' ? dialogText.sent : dialogText.send
  return (
    <div data-pane-dialog="" role="group" aria-labelledby={statusId} aria-busy={phase === 'sending'}>
      <Panel variant="section" tone="needsYou">
        <Stack gap="12">
          <Inline gap="6" align="center" className={statusLine}>
            <span className={statusIcon} aria-hidden="true">
              <TerminalIcon size="16" />
            </span>
            <span id={statusId}>{dialogText.status}</span>
          </Inline>
          {options.length === 0 ? (
            <>
              {title === undefined ? null : <p className={titleText}>{title}</p>}
              <div className={rawBox} role="region" aria-label="Dialog text" tabIndex={0}>
                <ProposalCommand>{dialog.raw}</ProposalCommand>
              </div>
              <p className={quietLine}>{dialogText.answerThere}</p>
            </>
          ) : (
            <>
              {title === undefined && question === undefined ? null : (
                <Stack gap="4">
                  {title === undefined ? null : <p className={titleText}>{title}</p>}
                  {question === undefined ? null : <p className={questionText}>{question}</p>}
                </Stack>
              )}
              <OptionList
                label={question ?? title ?? dialogText.options}
                variant="card"
                disabled={off}
                value={pick === undefined ? null : String(pick)}
                onValueChange={(value) => {
                  setChosen({ id: dialog.id, n: Number(value) })
                }}
                items={options.map((o) => ({ value: String(o.n), label: o.label, description: o.detail }))}
              />
              {phase === 'changed' ? <p className={quietLine}>{dialogText.changed}</p> : null}
              <Inline gap="12" align="center" justify="between" wrap>
                <p className={quietLine}>{dialogText.otherAnswers}</p>
                <Button
                  variant="primary"
                  size="lg"
                  touch
                  className={atEnd}
                  disabled={off || pick === undefined}
                  onClick={send}
                >
                  {phase === 'sent' ? <CheckIcon /> : null}
                  {sendLabel}
                </Button>
              </Inline>
            </>
          )}
          {phase === 'failed' && view.line !== undefined ? (
            <TranscriptProblem text={view.line} onRetry={retry ? onRetry : undefined} />
          ) : null}
        </Stack>
      </Panel>
    </div>
  )
}
