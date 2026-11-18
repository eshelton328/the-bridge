// Figma Toolkit T36 "T36 · How a rule works": the rule skills open on the iPad
// mini, on its How it works tab, as D37 (ruleHowItWorks) shows it on the
// desktop: when the rule loads, then the four steps from link.sh and its paths
// frontmatter to the agent that follows it, in one column. The item keeps the
// header of its Overview (T17, ruleOpenTablet): the back row to Toolkit, the
// kind badge, the name and the path row. T36 draws nothing under the steps, so
// the line on what Codex does instead is left out; everything else is D37's
// data. Copy word for word from references/toolkit/T36/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { ruleHowItWorks } from './ruleHowItWorks.ts'

type How = NonNullable<ToolkitItemDetailView['how']>

// T36 495:1936 to 495:2096: when the rule loads and its steps; nothing under them.
function tabletHow(how: How): How {
  const { label, legend, trigger, steps, note } = how
  return {
    label,
    legend,
    steps,
    ...(trigger === undefined ? {} : { trigger }),
    ...(note === undefined ? {} : { note }),
  }
}

export const ruleHowItWorksTablet = {
  title: 'a rule open on a tablet, on How it works',
  frames: [{ id: 'T36', node: '495:1741', viewport: 'tablet' }],
  data: {
    ...ruleHowItWorks.data,
    details: ruleHowItWorks.data.details.map((d) =>
      d.path === 'rules/skills.md' && d.how !== undefined ? { ...d, how: tabletHow(d.how) } : d,
    ),
  },
  ui: { ...ruleHowItWorks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
