// Figma Toolkit T37 "T37 · How an agent works": the agent writing-reviewer open
// on the iPad mini, on its How it works tab, as D38 (agentHowItWorks) shows it
// on the desktop: when it starts, then the four steps in its prompt in one
// column. As on its Overview (T7, agentOpenTablet), the agent was opened from
// the links of the skill writer, so the back row shows the breadcrumb
// Toolkit › writer › writing-reviewer (`ui.from`), and the item keeps its kind
// badge, name and path row (no `named`). T37 draws nothing under the steps, so
// the only inputs line (`elsewhere`) is left out; everything else is D38's
// data. Copy word for word from references/toolkit/T37/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { agentHowItWorks } from './agentHowItWorks.ts'

type How = NonNullable<ToolkitItemDetailView['how']>

// T37 495:2334 to 495:2380: when the agent starts and its steps; nothing under them.
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

export const agentHowItWorksTablet = {
  title: 'an agent open on a tablet from a skill, on How it works',
  frames: [{ id: 'T37', node: '495:2097', viewport: 'tablet' }],
  data: {
    ...agentHowItWorks.data,
    details: agentHowItWorks.data.details.map((d) =>
      d.path === 'agents/writing-reviewer.md' && d.how !== undefined ? { ...d, how: tabletHow(d.how) } : d,
    ),
  },
  ui: { ...agentHowItWorks.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
