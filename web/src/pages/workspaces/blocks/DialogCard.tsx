// A live Claude chat's terminal dialog (R69), drawn after the transcript's
// entries while the chat needs the owner: as an approval in the transcript
// (`ProposalBlock tone="approval"`, as a command waiting for approval draws),
// the dialog's title, its body with its line breaks, and one button for each
// option, "1 Send structured". The block's own actions are 28 px with no touch
// size, so the options are the library's `Button` in the block's body, the
// block's 28 px `sm` with a mouse and 44 (`control.xl`) on a touch screen
// (`pointer: coarse`), as the menus' touch rows are (R59). A tap sends that
// option; while it goes every option is off. The server lists only the
// options a tap can answer, with their own numbers (free-text ones such as
// "Type something" stay out), so the options keep `n` as given, a long label
// wraps onto more lines, and a muted line under them says "Other answers: in
// the terminal". A dialog the server could not
// read for sure (no `options`) shows the text it read, read-only, in a
// recessed box that scrolls when long, and the note "Answer in the terminal".
// A 409 `dialogChanged` shows a quiet note until the next read; another miss
// shows a line, with Retry when it may work later. Props only.
import { Button, Inline, ProposalBlock, ProposalCommand } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { DialogView } from './chatDialog.ts'
import { TranscriptProblem } from './TranscriptProblem.tsx'

/** The card's words: picked by the chat that built the card (d-101). */
const dialogText = {
  label: 'Waiting in the terminal',
  answerThere: 'Answer in the terminal',
  changed: 'The terminal changed — showing the new state',
  otherAnswers: 'Other answers: in the terminal',
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
// An option: at least the block's 28 high with a mouse and 44 (`control.xl`) on a touch screen, as `Menu touch` rows
// are (R59). A long label wraps onto more lines and the option grows, never past the card (LIBRARY_GAPS.md: Terminal
// dialog card).
const option = css({
  h: 'auto',
  minH: 'control.sm',
  maxW: '[100%]',
  flexShrink: '1',
  py: '4',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  textAlign: 'start',
  '@media (pointer: coarse)': { minH: 'control.xl' },
})
// The line under the options: the answers that are not a tap.
const otherLine = css({ m: '0', textStyle: 'small', color: 'fg.muted' })

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
      <ProposalBlock tone="approval" label={dialogText.label} title={dialog.title} note={note} actions={[]}>
        {options.length === 0 ? (
          <div className={rawBox} role="region" aria-label="Dialog text" tabIndex={0}>
            <ProposalCommand>{dialog.raw}</ProposalCommand>
          </div>
        ) : (
          <>
            {dialog.body === undefined || dialog.body === '' ? null : <p className={bodyText}>{dialog.body}</p>}
            <Inline gap="8" wrap>
              {options.map((o) => (
                <Button
                  key={o.n}
                  size="sm"
                  textSize="xs"
                  variant="secondary"
                  className={option}
                  disabled={off}
                  onClick={() => {
                    if (!off) onAnswer(o.n)
                  }}
                >
                  {`${String(o.n)} ${o.label}`}
                </Button>
              ))}
            </Inline>
            <p className={otherLine}>{dialogText.otherAnswers}</p>
          </>
        )}
        {phase === 'failed' && view.line !== undefined ? (
          <TranscriptProblem text={view.line} onRetry={view.retry === true ? onRetry : undefined} />
        ) : null}
      </ProposalBlock>
    </div>
  )
}
