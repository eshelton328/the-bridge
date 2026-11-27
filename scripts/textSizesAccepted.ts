// The cuts that `pnpm check:text-sizes` accepts (NCC-143). Each entry cites the decision that accepts it: d-131
// names two exceptions (a file tree name may truncate, a tool-call line stays one line), and bridge-coord accepted
// the Figma D5 side chat by design (NCC-140). A cut that we plan to fix never goes here. An entry place (a state at
// a size) that no longer has its cut fails the check, so remove it with the fix that removes the cut.
import type { AcceptedCut } from './textSizesLib.ts'

const toolLine = 'd-131: a tool-call line stays one line'

export const accepted: readonly AcceptedCut[] = [
  {
    states: [
      'workspaces/phoneChat',
      'workspaces/phoneChatActions',
      'workspaces/phoneChatFull',
      'workspaces/phoneFork',
      'workspaces/phoneForkedChat',
      'workspaces/phoneMovedChat',
      'workspaces/phoneRenameChat',
      'workspaces/phoneSideChat',
      'workspaces/phoneSubtask',
      'workspaces/phoneSubtaskRunning',
    ],
    sizes: ['large'],
    kind: 'truncated',
    text: 'Read f-005-the-bridge/requirements.md',
    reason: toolLine,
  },
  {
    states: ['workspaces/phoneSubagentTranscript'],
    sizes: ['large'],
    kind: 'truncated',
    text: 'Read captures/the-bridge-requirements.md',
    reason: toolLine,
  },
  {
    // The transcript draws an event as the library's ToolLine (Figma D16 417:718), so it is a tool line too.
    states: ['workspaces/phoneSubtaskRunning'],
    sizes: ['default', 'large'],
    kind: 'truncated',
    text: 'Subtask layout notes started · returns here',
    reason: `${toolLine} (an event line is a ToolLine)`,
  },
  {
    states: ['toolkit/scriptExplained', 'toolkit/skillFiles'],
    sizes: ['large'],
    kind: 'truncated',
    text: 'chat-sourced-first-person/',
    reason: 'd-131: a file tree name may truncate, full name on tap',
  },
  {
    states: ['workspaces/sideChatInPane'],
    sizes: ['default', 'large'],
    kind: 'overlap',
    text: '/btw over Brainstorm layouts for the-bridge that go beyond a sidebar a',
    reason:
      'by design (Figma D5): side chat panel over the transcript, surface.overlay alpha 0.98; text shows through at max 5/255 (NCC-140 proof)',
  },
]
