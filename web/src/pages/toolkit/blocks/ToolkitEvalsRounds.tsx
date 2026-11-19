// The rounds panel of the Evals tab (Figma `panel · rounds`, D20 482:1982):
// the header (its label and the text at its end, `roundsEnd`) and one row for
// each round (`round · r7` 482:1987): the round's name, its date, runs and
// cost after it, and a line under them on what it found. A rule's ledgers
// (D25) and a workflow's gates (D27) use the same rows; a ledger's name that
// names a toolkit skill opens it on its Evals tab. The library has no round
// row and no text link (LIBRARY_GAPS.md, Evals panels): the rows are styled
// with tokens and the name a plain button. Props only.
import { Panel, focusRing } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitEvals } from '../types.ts'
import { roundsEnd } from './evalsView.ts'
import { type ToolkitEvalsHeaderEnd, ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'

type Rounds = NonNullable<ToolkitEvals['rounds']>

// D20 482:1987: the rounds 47 apart (39 high, 8 apart); the line's small style is 16 high (d-072), so the rounds are
// 8 and 10 apart in turn, 47 apart on average.
const list = css({ display: 'flex', flexDirection: 'column', gap: '8', '& > :nth-child(even)': { mt: '2' } })
// D20 482:1987: the name and the meta on the top row (20 high), 8 apart, and the line 2 under it.
const round = css({ display: 'flex', flexDirection: 'column', gap: '2' })
const top = css({ display: 'flex', alignItems: 'baseline', gap: '8', minW: '[0]' })
const name = css({ textStyle: 'label', color: 'fg.default' })
const press = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { color: 'fg.accent' },
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
})
const meta = css({ textStyle: 'small', color: 'fg.muted' })
const text = css({ textStyle: 'small', color: 'fg.muted' })

// No screen draws a file outside the toolkit yet, such as a skill's ledger in projects/skill-evals/.
const waits = 'The ledger is outside the toolkit; no screen shows it yet.'

export type ToolkitEvalsRoundsProps = {
  rounds: Rounds
  /** Opens another tab of the open item, such as Files for "from the file" (D27). */
  onTabChange?: ((tab: string) => void) | undefined
  /** Opens the item a row names on its Evals tab, by its path (D25's ledgers). */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitEvalsRounds({ rounds, onTabChange, onOpenEvals }: ToolkitEvalsRoundsProps) {
  const at = roundsEnd(rounds)
  const end: ToolkitEvalsHeaderEnd | null =
    at === null
      ? null
      : at.action === 'none'
        ? { type: 'count', label: at.label }
        : at.action === 'tab'
          ? {
              type: 'link',
              label: at.label,
              onPress: () => {
                onTabChange?.(at.tab)
              },
            }
          : { type: 'link', label: at.label, waits }
  return (
    <section aria-label={rounds.label} data-figma="panel · rounds">
      <Panel>
        <ToolkitEvalsHeader label={rounds.label} end={end} />
        <div className={list}>
          {rounds.items.map((r) => {
            const open = r.open
            return (
              <div key={r.name} className={round} data-figma={`round · ${r.name}`}>
                <div className={top}>
                  {open === undefined ? (
                    <span className={name}>{r.name}</span>
                  ) : (
                    <button
                      type="button"
                      className={cx(name, press)}
                      onClick={() => {
                        onOpenEvals?.(open)
                      }}
                    >
                      {r.name}
                    </button>
                  )}
                  <span className={meta}>{r.meta}</span>
                </div>
                <p className={text}>{r.text}</p>
              </div>
            )
          })}
        </div>
      </Panel>
    </section>
  )
}
