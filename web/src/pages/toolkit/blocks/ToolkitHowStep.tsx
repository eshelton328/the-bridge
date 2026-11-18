// One step card of How it works (Figma `step 6`, D14 460:48): the step's
// number and title on the top row, what it does in small text, then what it
// uses, one chip a line, each with the icon of what it is (a file it reads, a
// script it runs, a toolkit item it starts or loads), and, for a step that
// repeats, until what, in amber; such a card has the amber border. The library's
// FlowDiagram draws a step with the number beside the body, top to bottom, and
// no grid of cards (LIBRARY_GAPS.md, How it works steps), so the card is drawn
// with the FlowDiagram card's tokens, as D8's `ToolkitFlowStep` is; the number
// is a `Badge variant="outline"`, the chips `Badge variant="outline"` with the
// kind's icon (LIBRARY_GAPS.md, How it works use chip) and the repeat a
// `Badge variant="tag" tone="needsYou"`. Every card of a row has one height:
// the steps' grid makes its rows equal. Props only.
import {
  AgentIcon,
  Badge,
  CodeIcon,
  FileIcon,
  HookIcon,
  LoopIcon,
  RuleIcon,
  SkillIcon,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

type Step = NonNullable<ToolkitItemDetailView['how']>['steps'][number]
type UseKind = Step['uses'][number]['kind']

// D14 460:3: 198 × 148, the content 12 in from the 1 px border; the top row, the text and the uses 7 apart (6).
// Figma's cards are 148 high, 17 under the tallest card's uses (step 8, 460:81); 16 under the content keeps it.
const card = css.raw({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  minW: '[0]',
  p: '12',
  pb: '16',
  bg: 'surface.raised',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
})
// D14 460:48: a step that repeats has the amber border, as FlowDiagram's loop card.
const repeating = css.raw({ borderColor: 'status.needsYou.border' })
// D14 460:4: the number (24 × 19) and the title 8 apart.
const top = css({ display: 'flex', alignItems: 'center', gap: '8' })
const title = css({ textStyle: 'label', color: 'fg.default' })
const description = css({ textStyle: 'small', color: 'fg.muted' })
// D14 460:16: the chips (23 high) one under another, 5 apart; the render's are 22 high, so 6 apart keeps each at
// Figma's y. As wide as their text.
const uses = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6' })
// The chip's icon takes the colour of what it is, as FlowDiagram's chips do: a script in the accent colour, a toolkit
// item in its kind's colour.
const iconTone: Readonly<Record<UseKind, string>> = {
  file: css({ display: 'inline-flex', color: 'fg.default' }),
  code: css({ display: 'inline-flex', color: 'fg.accent' }),
  skill: css({ display: 'inline-flex', color: 'kind.skill' }),
  agent: css({ display: 'inline-flex', color: 'kind.agent' }),
  rule: css({ display: 'inline-flex', color: 'kind.rule' }),
  workflow: css({ display: 'inline-flex', color: 'kind.workflow' }),
  hook: css({ display: 'inline-flex', color: 'kind.hook' }),
}
const icons = {
  file: <FileIcon size="12" />,
  code: <CodeIcon size="12" />,
  skill: <SkillIcon size="12" />,
  agent: <AgentIcon size="12" />,
  rule: <RuleIcon size="12" />,
  workflow: <WorkflowIcon size="12" />,
  hook: <HookIcon size="12" />,
}

export type ToolkitHowStepProps = {
  step: Step
  /** The grid cell the card takes, from the steps' grid. */
  className?: string | undefined
}

export function ToolkitHowStep({ step, className }: ToolkitHowStepProps) {
  const repeats = step.repeats !== undefined && step.repeats !== ''
  return (
    <li
      // css() merges the raw styles, so a repeating step's border wins over the card's.
      className={cx(css(card, repeats ? repeating : {}), className)}
      data-figma={`step ${step.number}`}
    >
      <div className={top}>
        <Badge variant="outline" label={step.number} />
        <h4 className={title}>{step.title}</h4>
      </div>
      {step.description === undefined ? null : <p className={description}>{step.description}</p>}
      {step.uses.length === 0 && !repeats ? null : (
        <ul className={uses} aria-label="Uses">
          {step.uses.map((u) => (
            <li key={u.label} data-figma={`uses · ${u.label}`}>
              <Badge
                variant="outline"
                label={u.label}
                icon={<span className={iconTone[u.kind]}>{icons[u.kind]}</span>}
              />
            </li>
          ))}
          {repeats ? (
            <li>
              <Badge variant="tag" tone="needsYou" label={step.repeats ?? ''} icon={<LoopIcon size="12" />} />
            </li>
          ) : null}
        </ul>
      )}
    </li>
  )
}
