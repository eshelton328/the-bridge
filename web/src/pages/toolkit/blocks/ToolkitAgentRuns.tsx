// How an agent runs (Figma `kind section · agent`, D7 433:526): the section's
// label in capitals over four cards of one size, one for each fact of the
// agent's frontmatter: the Claude model, the Codex settings, its tools and
// its own context. Each card has its icon and label, the value, and a
// caption in mono. Props only.
import { AgentIcon, CpuIcon, Grid, Panel, ToolkitIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

type Runs = NonNullable<ToolkitItemDetailView['runs']>

// D7 433:526: the label (433:527, 17 high) and the cards (433:528) are 10 apart.
const section = css({ display: 'flex', flexDirection: 'column', gap: '10' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
// D7 433:529: the head (433:530), the value (433:535) and the caption (433:536) are 6 apart.
const fact = css({ display: 'flex', flexDirection: 'column', gap: '6', minW: '[0]' })
// D7 433:530: the 14 px icon (no icon token has 14: 16), then the label 6 after it.
const head = css({ display: 'flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted' })
// D7 433:531: the icons take the agent kind's colour.
const icon = css({ display: 'inline-flex', color: 'kind.agent' })
const value = css({ textStyle: 'label', color: 'fg.default' })
const caption = css({ textStyle: 'mono', color: 'fg.muted' })

// D7: icon/cpu for the two models (433:531, 433:539), icon/wrench for the tools (433:547) and icon/agent for the
// agent's own context (500:8274).
const icons = {
  model: <CpuIcon size="16" />,
  tools: <ToolkitIcon size="16" />,
  context: <AgentIcon size="16" />,
}

export type ToolkitAgentRunsProps = {
  runs: Runs
}

export function ToolkitAgentRuns({ runs }: ToolkitAgentRunsProps) {
  return (
    <section aria-label={runs.label} className={section} data-figma="kind section · agent">
      <h3 className={heading}>{runs.label}</h3>
      {/* D7 433:528: four cards across, 10 apart. */}
      <Grid columns="4" gap="10" data-figma="facts">
        {runs.facts.map((f) => (
          <div key={f.label} data-figma={`fact · ${f.label}`}>
            <Panel>
              <div className={fact}>
                <span className={head}>
                  <span className={icon}>{icons[f.icon]}</span>
                  {f.label}
                </span>
                <span className={value}>{f.value}</span>
                <span className={caption}>{f.caption}</span>
              </div>
            </Panel>
          </div>
        ))}
      </Grid>
    </section>
  )
}
