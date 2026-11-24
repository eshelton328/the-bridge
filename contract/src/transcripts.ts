// The transcript of one chat: `GET /api/chats/:chat/transcript` and its
// event stream `GET /api/chats/:chat/transcript/events` (slice 3b). The
// server reads a chat's session file only for these two routes, and
// watches it only while a stream is open.
//
// Order: a new entry ID goes at the end; a changed entry keeps its place;
// the entries of one event are in transcript order. The stream sends only
// changes after it opens, and a replace by ID is idempotent, so a client
// opens the stream first, then reads the transcript, then applies each
// event by ID. After a reconnect it reads the transcript again.
import { z } from 'zod'
import { eventOf } from './events.ts'
import { ChatId } from './ids.ts'
import { maxAttachments } from './prompts.ts'

/** The most characters of user or assistant text in one entry; the server cuts longer text and sets `cut`. */
export const maxEntryText = 65_536

/** The most entries in one transcript read: the last ones. */
export const maxTranscriptEntries = 500

/** An entry's ID: stable in its chat, opaque to the client. */
export const EntryId = z.string().min(1).max(200)
export type EntryId = z.infer<typeof EntryId>

const Text = { text: z.string().max(maxEntryText), cut: z.boolean() }

/** The most characters of one attached file's name in a user entry. */
export const maxEntryFileName = 255

/**
 * A prompt the owner sent, as written. A prompt sent with files has `files`: the name of each file, never its
 * path; its text is the owner's own, without the lines that give the chat the paths.
 */
export const UserEntry = z.object({
  type: z.literal('user'),
  id: EntryId,
  ...Text,
  files: z.array(z.string().min(1).max(maxEntryFileName)).min(1).max(maxAttachments).optional(),
})

/**
 * The agent's reply text, in Markdown, as written. `replacedBy` marks a draft that a Stop hook sent back (R62):
 * the ID of the reply that the agent wrote after the hook's note. A draft with no later reply has none.
 */
export const AssistantEntry = z.object({
  type: z.literal('assistant'),
  id: EntryId,
  ...Text,
  replacedBy: EntryId.optional(),
})

/** The kind of a tool call (R32): a command, a file read or edit, a search, the web, an agent, a message, a plan step, an MCP tool, or other. */
export const ToolKind = z.enum(['shell', 'read', 'edit', 'search', 'web', 'agent', 'message', 'plan', 'mcp', 'other'])
export type ToolKind = z.infer<typeof ToolKind>

/**
 * A tool call: its name and a short target, never its arguments or its result. For a shell tool the target is
 * the program names only ("git | grep"); for a file tool the path from the repo, or with the home folder as "~";
 * for a web tool the host only; else "". `running` is false when the call has a result or the chat is no
 * longer `working`.
 */
export const ToolEntry = z.object({
  type: z.literal('tool'),
  id: EntryId,
  name: z.string().min(1).max(100),
  target: z.string().max(200),
  running: z.boolean(),
  /** What the call does, for its icon and for grouping (R32). The server sends it; an older client fixture may not. */
  kind: ToolKind.optional(),
  /** A readable title, such as "Ran a command" for `Bash`. */
  title: z.string().min(1).max(100).optional(),
  /** The call's own one-line `description`, as the agent wrote it for the owner; "" when it has none. */
  label: z.string().max(120).optional(),
})

/** One entry of a transcript, picked by its `type`. */
/** The most characters of an error entry's text; the server cuts longer text and sets `cut`. */
export const maxErrorText = 500

/** A slash command's error output, such as a /compact that failed: its text only, at most `maxErrorText`. */
export const ErrorEntry = z.object({
  type: z.literal('error'),
  id: EntryId,
  text: z.string().min(1).max(maxErrorText),
  cut: z.boolean(),
})

/** The most characters of a note entry's text. */
export const maxNoteText = 200

/** What a note tells (R46): a background task ended, another chat sent a message, or a Stop hook had the reply written again. */
export const NoteKind = z.enum(['task', 'peer', 'hook'])
export type NoteKind = z.infer<typeof NoteKind>

/** The most characters of the sender's name in a note's message. */
export const maxNoteFrom = 64

/**
 * The text of a message from another chat (R55): the sender's chat name (null when the line names none), how it
 * came (`message`: a peer message of Claude Code; `prompt`: typed into the pane in an `<agent-prompt>` wrapper),
 * and the text, cut at `maxEntryText`.
 */
export const NoteMessage = z.object({
  from: z.string().min(1).max(maxNoteFrom).nullable(),
  via: z.enum(['message', 'prompt']),
  ...Text,
})
export type NoteMessage = z.infer<typeof NoteMessage>

/**
 * A harness input that the chat got, never a prompt of the owner's (R46): a short line such as "Background task
 * finished: <summary>" or "Message from <chat name>". A `peer` note may have its `message` (R55), which the page
 * shows as another chat's text, not as the owner's bubble; no other kind has one.
 */
export const NoteEntry = z
  .object({
    type: z.literal('note'),
    id: EntryId,
    kind: NoteKind,
    text: z.string().min(1).max(maxNoteText),
    message: NoteMessage.optional(),
  })
  .refine((note) => note.message === undefined || note.kind === 'peer', {
    message: 'only a peer note has a message',
    path: ['message'],
  })

export const TranscriptEntry = z.discriminatedUnion('type', [
  UserEntry,
  AssistantEntry,
  ToolEntry,
  ErrorEntry,
  NoteEntry,
])
export type TranscriptEntry = z.infer<typeof TranscriptEntry>

/** A list of entries with no ID twice. */
const Entries = z.array(TranscriptEntry).check((ctx) => {
  const seen = new Set<string>()
  ctx.value.forEach((entry, i) => {
    if (seen.has(entry.id))
      ctx.issues.push({
        code: 'custom',
        message: `entry ID ${entry.id} is in the list twice`,
        input: entry.id,
        path: [i, 'id'],
      })
    seen.add(entry.id)
  })
})

/** The answer of `GET /api/chats/:chat/transcript`: the last entries, and whether older entries exist. */
export const TranscriptResponse = z.object({
  chat: ChatId,
  entries: Entries.max(maxTranscriptEntries),
  earlier: z.boolean(),
})
export type TranscriptResponse = z.infer<typeof TranscriptResponse>

/** Entries of the chat that are new or changed: replace an entry with the same ID, else add it at the end. */
export const TranscriptChangedEvent = eventOf('transcript.changed', z.object({ chat: ChatId, entries: Entries.min(1) }))
export type TranscriptChangedEvent = z.infer<typeof TranscriptChangedEvent>
