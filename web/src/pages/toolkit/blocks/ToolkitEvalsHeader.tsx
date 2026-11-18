// The header of a panel of the Evals tab (Figma `panel header`, D20
// 482:1896): the panel's label in capitals at the start and, at the end, a
// note such as "x1, graded by Codex" or what `roundsEnd` gives a rounds
// panel: the count of its rows in the accent colour ("4 ledgers", D25
// 492:489), a link to another tab ("from the file", D27 492:1660) or a link
// that waits for a design, disabled ("Open the ledger", D20 482:1986). The
// library has no text link at the small size (LIBRARY_GAPS.md, Evals panels):
// a link is a plain button styled with tokens, as the Links panels' file and
// line is. Props only.
import { css, cx } from '../../../../styled-system/css/index.js'

// D20 482:1896: the label at the start, the note at the end, on one row 17 high (the text styles' 16).
const header = css({ display: 'flex', alignItems: 'center', gap: '8' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted' })
const meta = css({ ms: 'auto', textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' })
// A count or a link in the accent colour (D25 492:489, D27 492:1660). It is its own class, not `meta` and an accent
// class together: two colour classes on one element take the colour that comes later in the style sheet, which was
// the muted one.
const accent = css({ ms: 'auto', textStyle: 'small', color: 'fg.accent', whiteSpace: 'nowrap' })
const link = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { textDecoration: 'underline' },
  _disabled: { cursor: 'not-allowed', opacity: 'disabled', _hover: { textDecoration: 'none' } },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
})

/** What the header shows at its end: a note, a count in the accent colour, or a link that opens a tab or waits. */
export type ToolkitEvalsHeaderEnd =
  | { type: 'note'; label: string }
  | { type: 'count'; label: string }
  | { type: 'link'; label: string; onPress?: (() => void) | undefined; waits?: string | undefined }

export type ToolkitEvalsHeaderProps = {
  /** The panel's label, as written; it shows in capitals. */
  label: string
  end?: ToolkitEvalsHeaderEnd | null | undefined
  /** The label's heading level: 3 under an item's title, 2 in the Activity view, straight under the page's title. */
  level?: 2 | 3 | undefined
}

export function ToolkitEvalsHeader({ label: text, end, level = 3 }: ToolkitEvalsHeaderProps) {
  return (
    <div className={header}>
      {level === 2 ? <h2 className={label}>{text}</h2> : <h3 className={label}>{text}</h3>}
      {end === undefined || end === null || end.label === '' ? null : end.type === 'link' ? (
        <button
          type="button"
          className={cx(accent, link)}
          disabled={end.waits !== undefined}
          title={end.waits}
          onClick={end.onPress}
        >
          {end.label}
        </button>
      ) : (
        <span className={end.type === 'count' ? accent : meta}>{end.label}</span>
      )}
    </div>
  )
}
