// The live New chat form (W3): Figma's form (D3, M7) with what the server
// can start. The server takes Claude Code alone (Codex waits for W8, and it
// starts no shell), picks the folder itself (the folder of the chat the new
// one goes beside, or of the workspace's first pane), and takes a model
// alias of the contract (`claude --model`) or none for Claude Code's default.
// The first message has no skill list, so its placeholder does not offer one.
import type { NewChatForm } from './types.ts'

/** The models New chat offers: Claude Code's own default, or one of the contract's aliases (`claude --model`). */
const modelOptions = [
  { value: 'default', label: 'Default model' },
  { value: 'fable', label: 'Fable' },
  { value: 'opus', label: 'Opus' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'haiku', label: 'Haiku' },
]

/**
 * The live New chat form: Figma's labels (D3, M7), Claude Code alone (Codex waits for W8, and the server starts no
 * shell), no folders (the server starts the chat in the folder of the chat it goes beside, or of the workspace's first
 * pane), the models above and an empty first message, in `workspace`.
 */
export function liveNewChatForm(workspace: string): NewChatForm {
  return {
    title: 'New chat',
    labels: {
      name: 'NAME · OPTIONAL',
      runsIn: 'RUNS IN',
      workspace: 'WORKSPACE',
      folders: 'FOLDERS',
      model: 'MODEL',
      message: 'FIRST MESSAGE',
    },
    name: { placeholder: 'quiet-nebula', hint: 'random if blank' },
    runsIn: {
      options: [
        { kind: 'claude', label: 'Claude Code' },
        { kind: 'codex', label: 'Codex', disabled: true },
        { kind: 'shell', label: 'shell', disabled: true },
      ],
      value: 'claude',
    },
    workspace,
    folders: [],
    addFolder: 'Add folder',
    model: { options: modelOptions, value: 'default' },
    message: { placeholder: 'What should it do?', skills: 'Pick a skill' },
    cancel: 'Cancel',
    start: 'Start chat',
    live: { starting: 'Starting…', newTab: 'new tab', beside: 'beside {chat}' },
  }
}
