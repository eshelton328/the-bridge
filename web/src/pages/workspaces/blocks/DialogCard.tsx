// A live Claude chat's terminal dialog (R69), drawn after the transcript's
// entries while the chat needs the owner: as an approval in the transcript
// (`ProposalBlock tone="approval"`, as a command waiting for approval draws),
// the dialog's title, its body with its line breaks, and one button for each
// option, "1 Send structured". A tap sends that option; while it goes every
// option is off. A dialog the server could not read for sure (no `options`)
// shows the text it read, read-only, in a recessed box that scrolls when long,
// and the note "Answer in the terminal". A 409 shows a quiet note until the
// next read; another miss shows a line with Retry. Props only.
import { ProposalBlock, ProposalCommand } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { DialogView } from './chatDialog.ts'
import { TranscriptProblem } from './TranscriptProblem.tsx'

/** The card's words: picked by the chat that built the card (d-101). */
const dialogText = {
  label: 'Waiting in the terminal',
  answerThere: 'Answer in the terminal',
  changed: 'The terminal changed — showing the new state',
} as const

// The body keeps the dialog's line breaks, in the transcript's small text.
const bodyText = css({
  m: '0',
  textStyle: 'small',
  color: 'fg.default',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
})
// The read text of a dialog with no options scrolls inside its box past the skill list's height (LIBRARY_GAPS.md:
// Terminal dialog card).
const rawBox = css({ maxH: 'shell.pickerHeight', overflowY: 'auto' })

export type DialogCardProps = {
  view: DialogView
  /** Sends the option numbered `n`; the owner tapped it. */
  onAnswer: (n: number) => void
  /** Sends the failed answer again. */
  onRetry: () => void
}

export function DialogCard({ view, onAnswer, onRetry }: DialogCardProps) {
  const { dialog, phase } = view
  const off = phase === 'sending' || phase === 'sent' || phase === 'changed'
  const options = dialog.options ?? []
  const note = phase === 'changed' ? dialogText.changed : options.length === 0 ? dialogText.answerThere : undefined
  return (
    <div data-pane-dialog="" aria-busy={phase === 'sending'}>
      <ProposalBlock
        tone="approval"
        label={dialogText.label}
        title={dialog.title}
        note={note}
        actions={options.map((o) => ({
          label: `${String(o.n)} ${o.label}`,
          variant: 'secondary',
          disabled: off,
          onClick: () => {
            if (!off) onAnswer(o.n)
          },
        }))}
      >
        {options.length === 0 ? (
          <div className={rawBox} role="region" aria-label="Dialog text" tabIndex={0}>
            <ProposalCommand>{dialog.raw}</ProposalCommand>
          </div>
        ) : dialog.body === undefined || dialog.body === '' ? null : (
          <p className={bodyText}>{dialog.body}</p>
        )}
        {phase === 'failed' && view.line !== undefined ? (
          <TranscriptProblem text={view.line} onRetry={view.retry === true ? onRetry : undefined} />
        ) : null}
      </ProposalBlock>
    </div>
  )
}
