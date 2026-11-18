// The How it works tab of an open item (Figma `how it works`, D14 459:598):
// a box with the header (the label and the file the steps come from, and the
// legend of what a step reads, runs, starts and repeats), when the item loads,
// the steps, four to a row, left to right with an arrow between them and one
// down into the next row, then the shorter path a chat answer takes (the
// library's `ChatPath`) and where the steps come from. It takes any list of
// steps, so an agent's procedure or a hook's checks draw the same way. The
// library has no line between steps (LIBRARY_GAPS.md, How it works steps): the
// arrows are its arrow icons, and the elbow from the end of a row to the start
// of the next is the down arrow alone. Props only.
import {
  AgentIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ChatPath,
  CodeIcon,
  FileIcon,
  LoopIcon,
  Panel,
  TerminalIcon,
} from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'
import { ToolkitHowStep } from './ToolkitHowStep.tsx'

type How = NonNullable<ToolkitItemDetailView['how']>

// D14 459:598: the content 18 in from the box's border at the sides, 16 above and below, and its rows 14 apart (no
// space token has 18 or 14). The Panel pads 12 above and below and 16 at the sides; 4 and 2 more put the content at
// Figma's place and width (910), and the rows are 12 apart.
const body = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '4', pb: '4', px: '2' })
// D14 459:599: the label at the start, the legend at the end.
const header = css({ display: 'flex', alignItems: 'center', gap: '12' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted' })
// The file keeps its name as it is written, such as "SKILL.md".
const file = css({ textTransform: 'none' })
// D14 459:602: the legend's items 12 apart, each a 12 px icon and its word 5 apart (6).
const legend = css({ display: 'flex', alignItems: 'center', gap: '12', ms: 'auto' })
const legendItem = css({ display: 'flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted' })
const legendIcon = {
  reads: css({ display: 'inline-flex', color: 'fg.default' }),
  runs: css({ display: 'inline-flex', color: 'fg.accent' }),
  starts: css({ display: 'inline-flex', color: 'kind.agent' }),
  repeats: css({ display: 'inline-flex', color: 'status.needsYou.fg' }),
}
const legendIcons = {
  reads: <FileIcon size="12" />,
  runs: <CodeIcon size="12" />,
  starts: <AgentIcon size="12" />,
  repeats: <LoopIcon size="12" />,
}
// D14 459:621: a green-bordered box as wide as its line: the terminal icon and the text in green, 8 apart. The
// notice Panel pads it 10/12, where Figma has 7/11, so it is 7 px taller (LIBRARY_GAPS.md, How it works trigger):
// 2 more above it keeps it and the steps under it within 4 px of Figma's.
const trigger = css({ alignSelf: 'flex-start', mt: '2' })
const triggerLine = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  textStyle: 'small',
  color: 'status.done.fg',
})
// D14 460:2: four columns of cards (198 wide) with an arrow column between them (40: a 16 px icon with 12 each
// side), and under each row of cards a row (48: the icon with 16 above and below) with the arrow down into the next.
// The card rows are equal (1fr), so every card has the size of the tallest.
const steps = css({
  display: 'grid',
  gridTemplateColumns: '[1fr auto 1fr auto 1fr auto 1fr]',
  gridAutoRows: '[1fr auto]',
  listStyle: 'none',
  m: '0',
  p: '0',
})
const across = css({ display: 'flex', alignItems: 'center', px: '12', color: 'fg.muted' })
// The arrow down sits under the first card of the row, where the next row starts; the rest of its row is empty.
const down = css({ display: 'flex', justifyContent: 'center', py: '16', color: 'fg.muted' })
const downRest = css({ gridColumn: '[2 / -1]' })
// D14 501:62, 459:772: the chat path and the source line under it. ChatPath is 7 px taller than Figma's (its pills,
// LIBRARY_GAPS.md, How it works steps), so the source sits 8 under it, not 12, and stays within 4 px of Figma's. The
// chat path is 14 under the steps in Figma: 2 more than the rows' 12.
const foot = css({ display: 'flex', flexDirection: 'column', gap: '8', mt: '2' })
// D14 459:773: as wide as its line.
const note = css({ alignSelf: 'flex-start', textStyle: 'small', color: 'fg.muted' })

const perRow = 4

export type ToolkitHowItWorksProps = {
  how: How
}

export function ToolkitHowItWorks({ how }: ToolkitHowItWorksProps) {
  return (
    <div data-figma="how it works">
      <Panel>
        <div className={body}>
          <div className={header} data-figma="459:599">
            {/* The tab's heading, under the item's h2; the steps' titles and ChatPath's title are h4. */}
            <h3 className={label}>
              {how.label} <span className={file}>{how.file}</span>
            </h3>
            <ul className={legend} aria-label="Legend">
              {how.legend.map((l) => (
                <li key={l.type} className={legendItem} data-figma={`legend · ${l.label}`}>
                  <span className={legendIcon[l.type]}>{legendIcons[l.type]}</span>
                  {l.label}
                </li>
              ))}
            </ul>
          </div>
          {how.trigger === undefined ? null : (
            <div className={trigger} data-figma="trigger">
              <Panel variant="notice" tone="done">
                <p className={triggerLine}>
                  <TerminalIcon size="12" />
                  {how.trigger}
                </p>
              </Panel>
            </div>
          )}
          <ol className={steps} aria-label="Steps" data-figma="steps">
            {how.steps.map((step, i) => {
              const last = i === how.steps.length - 1
              const rowEnd = (i + 1) % perRow === 0
              return (
                <Fragment key={step.number}>
                  <ToolkitHowStep step={step} />
                  {last ? null : rowEnd ? (
                    <>
                      <li className={down} aria-hidden="true">
                        <ArrowDownIcon size="16" />
                      </li>
                      <li className={downRest} aria-hidden="true" />
                    </>
                  ) : (
                    <li className={across} aria-hidden="true">
                      <ArrowRightIcon size="16" />
                    </li>
                  )}
                </Fragment>
              )
            })}
          </ol>
          <div className={foot}>
            {how.shortPath === undefined ? null : (
              <div data-figma="chat path">
                <ChatPath
                  title={how.shortPath.title}
                  description={how.shortPath.description}
                  steps={how.shortPath.steps}
                />
              </div>
            )}
            {how.note === undefined ? null : (
              <p className={note} data-figma="source">
                {how.note}
              </p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}
