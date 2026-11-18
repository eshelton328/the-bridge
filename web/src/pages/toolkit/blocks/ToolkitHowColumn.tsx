// The How it works tab on a tablet or the phone (Figma T10 461:265 to 501:102): no box, no header and no source line,
// as on the desktop (`ToolkitHowItWorks`), but straight under the tabs, 12 apart: when the item loads, across the
// item; the steps in one column, each card a row as wide as the item (`ToolkitHowStep compact`) with the arrow down
// between them; then the shorter path a chat answer takes (the library's `ChatPath`) or what happens elsewhere instead
// (one line in a notice Panel). It takes any list of steps, so a rule's, an agent's or a hook's draw the same way.
// On the phone (M12 461:570 to 501:142) the rows are 10 apart. Props only.
import { ArrowDownIcon, ChatPath, Panel } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitItemDetailView } from '../types.ts'
import { ToolkitHowStep } from './ToolkitHowStep.tsx'

type How = NonNullable<ToolkitItemDetailView['how']>

// T10 461:256 to 501:102: the rows 12 apart. The tabs' panel puts its content 16 under the tabs, where Figma has 12
// (461:265 starts 12 under the tabs' end), so the column starts 4 higher.
const column = css({ display: 'flex', flexDirection: 'column', gap: '12', mt: '-4' })
// M12 461:561 to 501:142: on the phone the rows are 10 apart, and the trigger starts 10 under the tabs, so 6 higher.
const phoneColumn = css({ display: 'flex', flexDirection: 'column', gap: '10', mt: '-6' })
// T10 461:265: a green-bordered box across the item, its text 11 in and 7 above and below, with no icon. The notice
// Panel pads it 10/12, so it is 38 high against 31 (LIBRARY_GAPS.md, How it works trigger); the steps start 4 under it,
// not 12, 2 above Figma's place, so the 1 px each card and its arrow add (ToolkitHowStep) ends the column at Figma's.
const triggerText = css({ textStyle: 'small', color: 'status.done.fg' })
// T10 461:267: one column of cards as wide as the item, and between two cards the arrow down (`arrow` 461:274: a
// 12 px icon in a row 14 high; 2 above and below it, 16, keep the next card in place: see ToolkitHowStep).
// M12 461:572: on the phone the steps start 10 under the trigger; the trigger is 7 px taller, so 8 higher puts them
// 1 px above Figma's.
const steps = css({ display: 'flex', flexDirection: 'column', listStyle: 'none', m: '0', p: '0', mt: '-8' })
const down = css({ display: 'flex', justifyContent: 'center', py: '2', color: 'fg.muted' })
const elsewhereLine = css({ display: 'flex', alignItems: 'center', gap: '8' })
const elsewhereLabel = css({ textStyle: 'monoCaps', color: 'fg.muted' })
const elsewhereText = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitHowColumnProps = {
  how: How
  /** A tablet (T10) puts the rows 12 apart, the phone (M12) 10. */
  layout?: Exclude<Viewport, 'desktop'> | undefined
}

export function ToolkitHowColumn({ how, layout = 'tablet' }: ToolkitHowColumnProps) {
  return (
    <div className={layout === 'phone' ? phoneColumn : column}>
      {how.trigger === undefined ? null : (
        <div data-figma="trigger">
          <Panel variant="notice" tone="done">
            <p className={triggerText}>{how.trigger}</p>
          </Panel>
        </div>
      )}
      <ol className={steps} aria-label="Steps" data-figma="steps">
        {how.steps.map((step, i) => (
          <Fragment key={step.number}>
            {i === 0 ? null : (
              <li className={down} aria-hidden="true">
                <ArrowDownIcon size="12" />
              </li>
            )}
            <ToolkitHowStep step={step} compact />
          </Fragment>
        ))}
      </ol>
      {how.shortPath === undefined ? null : (
        <div data-figma="chat path">
          <ChatPath title={how.shortPath.title} description={how.shortPath.description} steps={how.shortPath.steps} />
        </div>
      )}
      {how.elsewhere === undefined ? null : (
        <div data-figma="chat path">
          <Panel variant="notice">
            <p className={elsewhereLine}>
              <span className={elsewhereLabel}>{how.elsewhere.label}</span>
              <span className={elsewhereText}>{how.elsewhere.text}</span>
            </p>
          </Panel>
        </div>
      )}
    </div>
  )
}
