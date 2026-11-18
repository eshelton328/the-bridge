// Figma Toolkit T10 "T10 · How a skill works": the skill writer open on the
// iPad mini, on its How it works tab, as D14 (skillHowItWorks) shows it on the
// desktop: the steps stand in one column, each with what it uses. The tablet's
// trigger and step lines are shorter than D14's; everything else is D14's data.
// Copy word for word from references/toolkit/T10/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { skillHowItWorks } from './skillHowItWorks.ts'

type How = NonNullable<ToolkitItemDetailView['how']>

// T10 461:268 to 461:363: each step's line, by its number.
const descriptions: Readonly<Record<string, string>> = {
  '1': 'Who reads it and what they do next.',
  '2': 'Follow the shape of the form.',
  '3': 'A source for each claim, read in this session.',
  '4': 'The first sentence gives the reader what they need.',
  '5': 'Delete what the reader would not act on.',
  '6': 'Fix every fail; run it again after an edit.',
  '7': 'Only the draft, the form and the source paths.',
  '8': 'For text that is committed or published.',
}

function tabletHow(how: How): How {
  return {
    ...how,
    // T10 461:266.
    trigger: 'Loads when a task writes text that another person reads',
    steps: how.steps.map((s) => ({ ...s, description: descriptions[s.number] ?? s.description })),
  }
}

export const skillHowItWorksTablet = {
  title: 'a skill open on a tablet, on How it works',
  frames: [{ id: 'T10', node: '461:2', viewport: 'tablet' }],
  data: {
    ...skillHowItWorks.data,
    details: skillHowItWorks.data.details.map((d) =>
      d.path === 'skills/writer/' && d.how !== undefined ? { ...d, how: tabletHow(d.how) } : d,
    ),
  },
  ui: { ...skillHowItWorks.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
