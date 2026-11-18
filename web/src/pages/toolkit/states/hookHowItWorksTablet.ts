// Figma Toolkit T38 "T38 · How a hook works": the hook commit-msg open on the
// iPad mini, on its How it works tab, as D39 (hookHowItWorks) shows it on the
// desktop: when it runs, then the five checks it makes on each commit in one
// column. The item keeps the header of its Overview (T19, hookOpenTablet): the
// back row to Toolkit, the kind badge, the name and the path row (no `named`).
// T38 draws nothing under the steps, so the tests line (`elsewhere`) is left
// out. Step 3's use, commits-and-prs, has the file icon here (495:2871) where
// D39 has the rule icon (500:8966); everything else is D39's data. Copy word
// for word from references/toolkit/T38/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { hookHowItWorks } from './hookHowItWorks.ts'

type How = NonNullable<ToolkitItemDetailView['how']>
type Use = How['steps'][number]['uses'][number]

// T38 495:2870: the rule's chip shows the file icon, in white.
function asFile(use: Use): Use {
  return use.label === 'commits-and-prs' ? { ...use, kind: 'file' } : use
}

// T38 495:2746 to 495:2890: when the hook runs and its steps; nothing under them.
function tabletHow(how: How): How {
  const { label, legend, trigger, steps, note } = how
  return {
    label,
    legend,
    steps: steps.map((s) => ({ ...s, uses: s.uses.map(asFile) })),
    ...(trigger === undefined ? {} : { trigger }),
    ...(note === undefined ? {} : { note }),
  }
}

export const hookHowItWorksTablet = {
  title: 'a hook open on a tablet, on How it works',
  frames: [{ id: 'T38', node: '495:2484', viewport: 'tablet' }],
  data: {
    ...hookHowItWorks.data,
    details: hookHowItWorks.data.details.map((d) =>
      d.path === 'hooks/commit-msg' && d.how !== undefined ? { ...d, how: tabletHow(d.how) } : d,
    ),
  },
  ui: { ...hookHowItWorks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
