// The workspaces and their chats, as the server sends them. A chat is an
// agent session (Claude Code or Codex) or a shell; herdr's own terms (panes,
// keys, terminal text) stay in the server's herdr adapter (d-110).
import { z } from 'zod'
import { ChatId, MachineId, PaneId, WorkspaceId } from './ids.ts'

/** What runs in the chat. */
export const ChatKind = z.enum(['claude', 'codex', 'shell'])
export type ChatKind = z.infer<typeof ChatKind>

/**
 * What the chat does now: `working`, `needsYou` (it waits for an answer or
 * an approval), `idle` (it waits for a prompt), `done` (it finished work
 * that the owner has not seen), or `unknown`.
 */
export const ChatStatus = z.enum(['working', 'needsYou', 'idle', 'done', 'unknown'])
export type ChatStatus = z.infer<typeof ChatStatus>

/** The effort level of a Claude chat, as Claude Code's `/effort` names it. */
export const ChatEffort = z.enum(['low', 'medium', 'high', 'xhigh', 'max'])
export type ChatEffort = z.infer<typeof ChatEffort>

/** The family of a Claude model, as `claude --model` takes it: "claude-opus-5-5" is "opus". */
export const ModelAlias = z.enum(['fable', 'opus', 'sonnet', 'haiku'])
export type ModelAlias = z.infer<typeof ModelAlias>

/** The chat that started this one, and how: a subtask or a fork. */
export const ChatParent = z.object({ id: ChatId, relation: z.enum(['subtask', 'fork']) })
export type ChatParent = z.infer<typeof ChatParent>

/** One chat in a workspace. */
export const ChatSummary = z.object({
  id: ChatId,
  kind: ChatKind,
  title: z.string(),
  /** The model ID, such as "claude-opus-5-5", or for a shell its program, such as "zsh"; null when not known. */
  model: z.string().nullable(),
  /** The family of a Claude chat's model; null for another model, a Codex chat or a shell. */
  modelId: ModelAlias.nullable(),
  /** The effort of a Claude chat's last turn; null when not known, and for a Codex chat or a shell. */
  effort: ChatEffort.nullable(),
  /** The share of the context window the chat used, from 0 to 1; null when not known. */
  contextUsed: z.number().min(0).max(1).nullable(),
  status: ChatStatus,
  parent: ChatParent.nullable(),
  /** The pane that shows the chat. A page that follows it keeps the chat open when the chat ID changes. */
  pane: PaneId,
})
export type ChatSummary = z.infer<typeof ChatSummary>

/** One workspace and its chats, in the order the workspace shows them. */
export const WorkspaceSummary = z.object({
  id: WorkspaceId,
  label: z.string(),
  chats: z.array(ChatSummary),
})
export type WorkspaceSummary = z.infer<typeof WorkspaceSummary>

/** The response of `GET /api/workspaces`: the workspaces of one machine, in its order. */
export const WorkspacesResponse = z.object({
  machine: MachineId,
  workspaces: z.array(WorkspaceSummary),
})
export type WorkspacesResponse = z.infer<typeof WorkspacesResponse>
