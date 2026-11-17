// Figma Inbox D2 "A question that blocks a chat": the question "Hono RPC client or
// plain fetch for the API?" is open, with its options and a note. Copy
// word for word from references/inbox/D02/frame.json; the list is D1's.
import { InboxItemId } from '@bridge/shared'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { nextStep } from './nextStep.ts'

export const question = {
  title: 'a question that blocks a chat',
  frames: [{ id: 'D2', node: '346:428', viewport: 'desktop' }],
  data: {
    ...nextStep.data,
    detail: {
      kind: 'question',
      status: { tone: 'needsYou', label: 'Needs you' },
      origin: 'Question · asked 12m ago by hono server',
      title: 'Hono RPC client or plain fetch for the API?',
      chips: [
        { label: 'ncc-1701', icon: 'folder', issue: false },
        { label: 'f-005 the-bridge', icon: 'feature', issue: false },
        { label: 'NCC-31', icon: 'linear', issue: true },
      ],
      tags: ['global/decision'],
      waiting: {
        agent: 'claude',
        title: 'hono server is waiting for this answer',
        detail: 'the-bridge · Sonnet 5.5 · 78% context · waiting 12 min',
      },
      context:
        'The API routes are moving from omni into the-bridge. The Hono RPC client shares route types with the frontend, so a renamed field fails the build; plain fetch keeps the client independent of Hono but needs its own types.',
      options: [
        {
          value: 'hono-rpc',
          label: 'Hono RPC client',
          description: 'One source of types for server and client. Ties the frontend to Hono.',
          recommended: true,
        },
        {
          value: 'plain-fetch',
          label: 'Plain fetch with zod schemas',
          description: 'Works with any server. The schemas are a second copy of the types.',
          recommended: false,
        },
        {
          value: 'something-else',
          label: 'Something else',
          description: 'Write your own answer below.',
          recommended: false,
        },
      ],
      selected: 'hono-rpc',
      noteLabel: 'Note to the chat · optional',
      note: 'Keep the client in packages/api so omni can import it later.',
      answerLabel: 'Answer and resume hono server',
      answerHint: 'Sends your answer to the waiting chat.',
    },
  },
  ui: { ...nextStep.ui, selectedId: InboxItemId.parse('hono-rpc-or-fetch') },
} satisfies ScreenState<InboxData, InboxUi>
