// Figma Inbox D3 "Edit the prompt, choose where it runs": the suggested
// prompt is in its editor with an edit, and the Run in picker is open.
// Copy word for word from references/inbox/D03/frame.json; Figma draws the
// text caret as a "|" after the prompt, which the editor's own caret shows.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

const base = nextStep.data.detail

export const promptEditing = {
  title: 'edit the prompt, choose where it runs',
  frames: [{ id: 'D3', node: '346:821', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    detail: {
      ...base,
      prompt: {
        text: 'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md. Link each ticket to its requirement IDs and put them in the Increment 1 cycle, assigned to me.',
        edited: true,
        long: false,
      },
      runIn: {
        ...base.runIn,
        picker: {
          search: 'Search workspaces and chats',
          sections: [
            {
              label: 'New chat',
              choices: [
                {
                  value: 'new-claude',
                  label: 'New Claude Code chat',
                  description: 'the-bridge · Sonnet 5.5',
                  pill: { tone: 'working', label: 'Recommended', dot: false },
                },
                { value: 'new-codex', label: 'New Codex chat', description: 'the-bridge · GPT-5.5' },
                { value: 'new-elsewhere', label: 'New chat in another workspace…' },
              ],
            },
            {
              label: 'Existing chats · the-bridge',
              choices: [
                {
                  value: 'hono-server',
                  label: 'hono server',
                  description: 'Sonnet 5.5 · 78% context',
                  pill: { tone: 'needsYou', label: 'Needs you', dot: true },
                },
              ],
            },
            {
              label: 'Existing chats · omni-brain',
              choices: [
                {
                  value: 'bridge-themes',
                  label: 'bridge themes',
                  description: 'Opus 5.5 · 42% context',
                  pill: { tone: 'working', label: 'Working', dot: true },
                },
                {
                  value: 'drift-check',
                  label: 'drift check',
                  description: 'GPT-5.5 · 23% context',
                  pill: { tone: 'needsYou', label: 'Needs you', dot: true },
                },
              ],
            },
          ],
          selected: 'new-claude',
          note: 'Shells are not listed: a prompt needs Claude Code or Codex.',
        },
      },
      notes: null,
    },
  },
  ui: { ...nextStep.ui, editingPrompt: true, pickerOpen: true },
} satisfies ScreenState<InboxData, InboxUi>
