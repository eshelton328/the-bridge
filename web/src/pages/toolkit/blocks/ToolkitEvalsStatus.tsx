// The status panel of the Evals tab (Figma `panel · status`, D20 482:1895):
// the header (what the panel sums up, such as the done criteria after the
// latest round, and the note at its end), the badges (`criteria` 482:1900:
// one library Badge for each criterion or test run, in its state's colour)
// and a line on what they mean. The badges are a list, and each says its
// state in visually hidden text after its label ("D1 Quality failed"),
// since the library's Badge hides its icon from assistive technology. A badge that names another item's results (D5
// Reviewer, the agent writing-reviewer) is a button that opens that item on
// its Evals tab; the library's Badge takes no press, so the button around it
// is a plain one styled with tokens (LIBRARY_GAPS.md, Evals panels). An item
// with no evals (D25, D27) has no badges: the line says why. Props only.
import { Badge, CheckIcon, CloseCircleIcon, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitEvals } from '../types.ts'
import { badgeLayer, badgeLook, badgeResult } from './evalsView.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'

// D20 482:1900: the badges 6 apart; on the phone (M18 482:2570) they wrap, the rows 6 apart. The library's Badge is 2
// px wider than Figma's (D1 Quality 4.5), so the badges sit 4 apart, which keeps each within 3 px of Figma's x.
const badges = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: '4', rowGap: '6' })
const badgeBox = css({ display: 'inline-flex' })
const srOnly = css({ srOnly: true })
const press = css({
  display: 'inline-flex',
  p: '0',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'full',
  cursor: 'pointer',
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
})
// D20 482:1925, D25 492:428: the line is 8 under the badges and 25 under the header in Figma; the header and the
// badges are each 1 px shorter in the render (the 16 px text styles, d-072), so 2 more above the line.
const text = css({ textStyle: 'small', color: 'fg.muted', mt: '2' })

const icons = { check: <CheckIcon size="12" />, cross: <CloseCircleIcon size="12" /> }

export type ToolkitEvalsStatusProps = {
  status: ToolkitEvals['status']
  /** Opens the item a badge names on its Evals tab, by its path. */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitEvalsStatus({ status, onOpenEvals }: ToolkitEvalsStatusProps) {
  return (
    <section aria-label={status.label} data-figma="panel · status">
      <Panel>
        <ToolkitEvalsHeader
          label={status.label}
          end={status.meta === undefined ? null : { type: 'note', label: status.meta }}
        />
        {status.badges === undefined || status.badges.length === 0 ? null : (
          <div className={badges} role="list" aria-label="Criteria" data-figma="criteria">
            {status.badges.map((b) => {
              const look = badgeLook(b.state)
              const result = badgeResult(b)
              const badge = (
                <>
                  <Badge
                    size="sm"
                    tone={look.tone}
                    label={b.label}
                    icon={look.icon === null ? undefined : icons[look.icon]}
                  />
                  {result === null ? null : <span className={srOnly}>{` ${result}`}</span>}
                </>
              )
              const open = b.open
              return open === undefined ? (
                <span key={b.label} role="listitem" className={badgeBox} data-figma={badgeLayer(b)}>
                  {badge}
                </span>
              ) : (
                <span key={b.label} role="listitem" className={badgeBox}>
                  <button
                    type="button"
                    className={press}
                    data-figma={badgeLayer(b)}
                    onClick={() => {
                      onOpenEvals?.(open)
                    }}
                  >
                    {badge}
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <p className={text}>{status.text}</p>
      </Panel>
    </section>
  )
}
