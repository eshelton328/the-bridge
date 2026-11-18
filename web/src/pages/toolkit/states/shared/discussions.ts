// The skill writer's discussion, which its Discuss button opens (shared data, not a state): the desktop's side panel
// (D5 438:2), with one question and Claude's answer as sample messages, and the tablet's and phone's pages (T5 438:64,
// M7 435:556), before the first message. Copy word for word from references/toolkit/D05, T05 and M07/frame.json.
import type { ToolkitDiscussion, ToolkitItemDetailView } from '../../types.ts'

const empty: ToolkitDiscussion['empty'] = {
  title: 'Talk writer through',
  text: 'Ask how it works, why a step exists or where it runs. Answers cite the file and line. Nothing here changes the toolkit.',
  canLabel: 'It can',
  can: [
    { icon: 'book', text: 'Explain a step, a file or a script' },
    { icon: 'links', text: 'Find what links to writer and where it runs' },
    { icon: 'external', text: 'Open the chat in Workbench to change writer' },
  ],
  suggestions: [
    'Why does step 7 use a separate agent?',
    'What does scripts/check test?',
    'Which skills link to writer?',
  ],
}

const card: ToolkitDiscussion['card'] = {
  kind: 'Skill',
  meta: 'toolkit/skills/writer/ · 11 files',
  guard:
    'Reads writer’s files and what links to it. Can’t run commands or edit files. To change writer, open this chat in Workbench.',
}

/** T5: the tablet's page, before the first message, on Sonnet 5.5 with 6% of the context used. */
const tablet: ToolkitDiscussion = {
  title: 'Discuss',
  openInWorkbench: 'Open in Workbench',
  badge: 'Discussion',
  model: 'Sonnet 5.5',
  context: 6,
  contextLabel: 'context',
  card,
  placeholder: 'Ask about writer',
  entries: [],
  empty,
}

export const writerDiscussions = {
  // D5: the side panel with the sample question and answer, on Opus 5.5. The item beside it is D3's, in D5's layers.
  desktop: {
    ...tablet,
    note: 'Questions about writer. Nothing here changes the toolkit. Open in Workbench keeps this chat in a workspace, where it can change files.',
    attached: { text: 'toolkit/skills/writer/ attached', readOnly: 'Read-only' },
    model: 'Opus 5.5',
    context: undefined,
    itemLayers: { title: '432:1461', description: '432:1462' },
    entries: [
      { type: 'user', text: 'Why does writer hand a draft to writing-reviewer instead of checking it itself?' },
      {
        type: 'reply',
        name: 'Claude',
        text: 'Step 7 of SKILL.md runs the writing-reviewer agent on anything meant for another reader. The agent gets only the draft and its sources, so it reads each claim as a stranger would.',
        sources: ['skills/writer/SKILL.md:106', 'agents/writing-reviewer.md'],
        copy: 'Copy',
      },
    ],
  },
  tablet,
  // M7: the phone's page says only Workbench, and the suggestions stack under "Try".
  phone: { ...tablet, openInWorkbench: 'Workbench', empty: { ...empty, tryLabel: 'Try' } },
} satisfies NonNullable<ToolkitItemDetailView['discuss']>
