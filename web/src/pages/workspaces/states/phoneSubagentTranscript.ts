// Figma Workbench M12 (147:314), "M12 · Subagent transcript": the chevron of
// Layout notes' card in bridge themes' subagents (M6) opens its full
// transcript on the phone. The trail returns to bridge themes or to the
// subagents; under it the sparkle, Layout notes and Running, "writer agent ·
// 0:34 · 11k tokens" and Stop. The transcript is the task bridge themes gave
// it, two Read lines, writer's message and the running Writing line; the
// read-only note stays at the foot. There is no tab bar. At a desktop width
// the state draws M1's sidebar with bridge themes alone and the subagents
// panel beside it. Starts from M6 (phoneSubagents), with Layout notes' full
// transcript.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneSubagents } from './phoneSubagents.ts'

const panel = phoneSubagents.data.subagents

export const phoneSubagentTranscript = {
  title: "A subagent's full transcript on the phone",
  frames: [{ id: 'M12', node: '147:314', viewport: 'phone' }],
  data: {
    ...phoneSubagents.data,
    subagents: {
      ...panel,
      fullTranscript: {
        trail: 'Trail',
        taskFrom: 'Task from {chat}',
        readOnly: 'Read-only: the result returns to {chat} when it finishes.',
      },
      items: panel.items.map((item) =>
        item.id === 'layout-notes'
          ? {
              ...item,
              full: {
                task: 'Write layout notes for the three directions, one section each, from the requirements and pages list.',
                entries: [
                  { type: 'tool', name: 'Read', target: 'captures/the-bridge-requirements.md' },
                  { type: 'tool', name: 'Read', target: 'f-005-the-bridge/pages.md' },
                  {
                    type: 'assistant',
                    kind: 'claude',
                    name: 'writer',
                    text: 'Helm puts every area on one home; Star map shows agents as a sky; Workbench tiles chats in split panes. Writing each section now.',
                  },
                  { type: 'tool', name: 'Writing', target: 'layout-notes.md', running: true },
                ],
              },
            }
          : item,
      ),
    },
    layers: {
      ...phoneSubagents.data.layers,
      subagentTranscript: {
        trail: '147:339',
        back: '147:340',
        chat: '147:342',
        subagents: '147:344',
        header: '147:345',
        title: '147:349',
        status: '147:351',
        meta: '147:354',
        stop: '147:356',
        task: '147:368',
        entries: ['147:371', '147:374', '147:377', '147:383'],
        note: '147:387',
      },
    },
  },
  ui: {
    ...phoneSubagents.ui,
    phoneView: 'transcript',
    subagentFor: 'layout-notes',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
