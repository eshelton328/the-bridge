// How an agent runs (Figma `kind section · agent`, D7 433:526) or when a
// hook runs (`kind section · hook`, D9 433:1538): the section's label in
// capitals over four cards of one size, one for each fact of the item. An
// agent's cards are its Claude model, its Codex settings, its tools and its
// own context; a hook's are its git event, whether it is on, the rule it
// enforces and its test. Each card has its icon and label, the value (or a
// badge for a state that is on or off), and a caption: in mono for an
// agent, in small text for a hook. Props only.
import {
  AgentIcon,
  Badge,
  BranchIcon,
  CheckIcon,
  CodeIcon,
  CpuIcon,
  Grid,
  Panel,
  RuleIcon,
  ToolkitIcon,
} from '@eshelton328/component-library-1701'
import { Fragment, type ReactNode } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

type Runs = NonNullable<ToolkitItemDetailView['runs']>
type Fact = Runs['facts'][number]

// D7 433:526: the label (433:527, 17 high) and the cards (433:528) are 10 apart.
const section = css({ display: 'flex', flexDirection: 'column', gap: '10' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
// D7 433:529: the head (433:530), the value (433:535) and the caption (433:536) are 6 apart.
const fact = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6', minW: '[0]' })
// T19 487:1131: on a tablet the head starts 13 under the card's top and the card is 109 high; the notice variant pads
// 10 above and below, so 4 more keeps the head and the card's foot within 1 px of Figma's.
const factCompact = css({ py: '4' })
// D7 433:530: the 14 px icon (no icon token has 14: 16), then the label 6 after it.
const head = css({ display: 'flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted' })
const value = css({ textStyle: 'label', color: 'fg.default' })
// D7 433:536: an agent's captions are mono; D9 433:1548: a hook's are small text.
const captions = {
  agent: css({ textStyle: 'mono', color: 'fg.muted' }),
  hook: css({ textStyle: 'small', color: 'fg.muted' }),
}

// D7: the icons take the agent kind's colour: icon/cpu for the two models (433:531, 433:539), icon/wrench for the
// tools (433:547) and icon/agent for the agent's own context (500:8274). D9: icon/git for the event (433:1543; the
// library has no git icon, LIBRARY_GAPS.md, Git icon) and icon/code for the test (433:1566) in the hook kind's
// colour, icon/check for the state (433:1551) in the done colour, icon/rule for the rule it enforces (500:8416) in
// the rule kind's colour.
const iconColour = {
  agent: css({ display: 'inline-flex', color: 'kind.agent' }),
  hook: css({ display: 'inline-flex', color: 'kind.hook' }),
  rule: css({ display: 'inline-flex', color: 'kind.rule' }),
  done: css({ display: 'inline-flex', color: 'status.done.fg' }),
}
const icons: Readonly<Record<Fact['icon'], { icon: ReactNode; className: string }>> = {
  model: { icon: <CpuIcon size="16" />, className: iconColour.agent },
  tools: { icon: <ToolkitIcon size="16" />, className: iconColour.agent },
  context: { icon: <AgentIcon size="16" />, className: iconColour.agent },
  event: { icon: <BranchIcon size="16" />, className: iconColour.hook },
  state: { icon: <CheckIcon size="16" />, className: iconColour.done },
  rule: { icon: <RuleIcon size="16" />, className: iconColour.rule },
  test: { icon: <CodeIcon size="16" />, className: iconColour.hook },
}

export type ToolkitAgentRunsProps = {
  runs: Runs
  /** The open item's kind: it names the Figma section and picks the captions' style. An agent when not set. */
  kind?: 'agent' | 'hook' | undefined
  /** A tablet's cards are narrower (T19 487:1130, 170 wide): they pad 12 at the sides, so the text keeps Figma's lines. */
  compact?: boolean | undefined
}

/** A fact's value: its text, or for a state (D9 479:21, 73 × 20) a small badge, on in the done colour with a check. */
function FactValue({ f }: { f: Fact }) {
  if (f.status === undefined) return <span className={value}>{f.value}</span>
  return f.status === 'on' ? (
    <span data-figma="badge · Enabled · icon">
      <Badge size="sm" tone="done" label={f.value} icon={<CheckIcon size="12" />} />
    </span>
  ) : (
    <Badge size="sm" label={f.value} />
  )
}

/**
 * T19 487:1147: Figma breaks a narrow card's caption after a path's slash ("toolkit/" over "hooks, set by link.sh");
 * the browser does not break there, so a `wbr` after each slash allows it. The text stays the same.
 */
function Breakable({ text }: { text: string }) {
  const parts = text.split('/')
  return parts.map((part, i) => (
    // The parts of one caption never reorder, so a part's place and text name it.
    <Fragment key={`${String(i)}:${part}`}>
      {part}
      {i < parts.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </Fragment>
  ))
}

export function ToolkitAgentRuns({ runs, kind = 'agent', compact = false }: ToolkitAgentRunsProps) {
  return (
    <section aria-label={runs.label} className={section} data-figma={`kind section · ${kind}`}>
      <h3 className={heading}>{runs.label}</h3>
      {/* D7 433:528: four cards across, 10 apart. T19 487:1130: on a tablet each card is 170 wide and pads 15 at the
          sides, leaving its text 140; the section variant's 16 leaves 135.5 in the 708 px item, which breaks the Enforces
          value and the State caption onto an extra line. The notice variant pads 12 at the sides and 10 above and below
          (Figma 13; LIBRARY_GAPS.md, Agent fact card). */}
      <Grid columns="4" gap="10" data-figma="facts">
        {runs.facts.map((f) => (
          <div key={f.label} data-figma={`fact · ${f.label}`}>
            <Panel variant={compact ? 'notice' : 'section'}>
              <div className={compact ? cx(fact, factCompact) : fact}>
                <span className={head}>
                  <span className={icons[f.icon].className}>{icons[f.icon].icon}</span>
                  {f.label}
                </span>
                <FactValue f={f} />
                <span className={captions[kind]}>{compact ? <Breakable text={f.caption} /> : f.caption}</span>
              </div>
            </Panel>
          </div>
        ))}
      </Grid>
    </section>
  )
}
