// The transcript of a Claude Code chat, from its session file (a JSON line
// for each record). It reads the file from the end, in 1 MiB parts, until it
// has the last entries the contract allows, so a long session costs about
// the same as a short one. A line that is not JSON, such as the last line
// while Claude Code still writes it, is skipped.
//
// It keeps only the owner's prompts, the agent's reply text and each tool
// call's name and short target (toolTarget.ts): never thinking, a tool's
// arguments or a tool's result. Nothing here logs.
import { open } from 'node:fs/promises'
import {
  maxAttachments,
  maxEntryFileName,
  maxEntryText,
  maxErrorText,
  maxTranscriptEntries,
  maxNoteFrom,
  type NoteKind,
  type NoteMessage,
  type TranscriptEntry,
} from '@bridge/contract'
import { z } from 'zod'
import type { TranscriptRead } from '../services/agentPort.ts'
import { attachedLine } from '../services/uploads.ts'
import { type TargetContext, toolTarget } from './toolTarget.ts'
import { toolLabel } from './toolLabel.ts'

const partBytes = 1024 * 1024
/** The most bytes read from one file; a longer file still gives its last entries, with `earlier`. */
const maxReadBytes = 64 * 1024 * 1024

const Id = z.string().min(1).max(150)

const Block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('tool_use'), id: Id, name: z.string().min(1), input: z.unknown() }),
  z.object({ type: z.literal('tool_result'), tool_use_id: z.string() }),
])

/** Who wrote a line's input (R46): "human" for the owner, "task-notification" or "peer" for the harness. */
const Origin = z.object({ kind: z.string(), name: z.string().optional(), body: z.string().optional() })

const Line = z.object({
  type: z.enum(['user', 'assistant']),
  uuid: Id,
  isSidechain: z.boolean().optional(),
  isMeta: z.boolean().optional(),
  origin: Origin.optional(),
  isCompactSummary: z.boolean().optional(),
  message: z.object({ content: z.union([z.string(), z.array(z.unknown())]) }),
})

/**
 * A prompt that the owner sent while the chat worked: Claude Code stores it as a `queued_command` attachment at its
 * place in the file, with no user line, and marks it `origin.kind` "human", `commandMode` "prompt" and
 * `humanTurn`. A peer's message and a background task's report come the same way, with other marks.
 */
const QueuedLine = z.object({
  type: z.literal('attachment'),
  uuid: Id,
  isSidechain: z.boolean().optional(),
  attachment: z.object({
    type: z.literal('queued_command'),
    // Text, or text and image blocks when the owner pasted an image.
    prompt: z.union([z.string(), z.array(z.unknown())]),
    commandMode: z.string().optional(),
    humanTurn: z.boolean().optional(),
    isMeta: z.boolean().optional(),
    origin: Origin.optional(),
  }),
})

/** One line of at most `max` characters, with no control characters; "" for none. */
const oneLine = (text: string, max: number) => {
  let clean = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    clean += code < 0x20 || (code >= 0x7f && code <= 0x9f) ? ' ' : ch
  }
  const flat = clean.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  // A cut never splits a character's surrogate pair.
  const high = flat.charCodeAt(max - 2)
  const end = high >= 0xd800 && high <= 0xdbff ? max - 2 : max - 1
  return `${flat.slice(0, end).trimEnd()}…`
}

/**
 * The note of a harness input (R46), by the line's own marks, never by words in the text: a task notification
 * (`origin.kind` "task-notification") with the summary of its whole-message wrapper, a peer's message
 * (`origin.kind` "peer") with the sender's name, and a Stop hook's feedback (an `isMeta` line with no origin
 * that starts with the hook's own words). Undefined for any other line.
 */
function noteOf(
  origin: z.infer<typeof Origin> | undefined,
  isMeta: boolean | undefined,
  raw: string,
): { kind: NoteKind; text: string; message?: NoteMessage } | undefined {
  if (origin?.kind === 'task-notification') {
    const wrapped = raw.trimStart().startsWith('<task-notification>')
    const field = (name: string) =>
      wrapped ? oneLine(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(raw)?.[1] ?? '', 160) : ''
    // Only a completed task "finished"; a task that failed, waits or goes on says so, and one with no status is an update.
    const status = field('status')
    const lead =
      status === 'completed'
        ? 'Background task finished'
        : status === 'failed'
          ? 'Background task failed'
          : 'Background task update'
    const summary = field('summary')
    return { kind: 'task', text: summary === '' ? lead : `${lead}: ${summary}` }
  }
  if (origin?.kind === 'peer') {
    const name = oneLine(origin.name ?? '', maxNoteFrom)
    // The text is the origin's own body, else what the harness's wrapper holds (R55); with neither, the name only.
    const body = (origin.body ?? peerWrapper.exec(raw)?.[1] ?? '').replace(contentMark, '').trim()
    return {
      kind: 'peer',
      text: `Message from ${name === '' ? 'another chat' : name}`,
      ...(body !== '' && { message: { from: name === '' ? null : name, via: 'message', ...textOf(body) } }),
    }
  }
  if (origin === undefined && isMeta === true && raw.startsWith('Stop hook feedback:'))
    return { kind: 'hook', text: 'Stop hook: reply rewritten' }
  return undefined
}

/** Claude Code's wrapper of a peer's message, and the mark it can add inside it (R55). */
const peerWrapper = /<cross-session-message\b[^>]*>([\s\S]*?)<\/cross-session-message>/
const contentMark = /^<artifact-content-authored-by-others\/>$/gm

/** The text, cut at the limit; a cut never splits a character's surrogate pair. */
const textOf = (text: string) => {
  if (text.length <= maxEntryText) return { text, cut: false }
  const high = text.charCodeAt(maxEntryText - 1)
  return { text: text.slice(0, high >= 0xd800 && high <= 0xdbff ? maxEntryText - 1 : maxEntryText), cut: true }
}

export type TranscriptOptions = TargetContext & {
  /** True when the chat's status is `working`; a tool call with no result is running only then. */
  readonly working: boolean
  /** The folder of the owner's uploads: a prompt's file lines name files in it. None: a prompt keeps them as text. */
  readonly uploads?: string | undefined
}

/** The tags of a slash command's own lines: the command, its words and its args, then its output. */
const commandName = /^<command-name>\/?([^<]{1,100})<\/command-name>/
const commandArgs = /<command-args>([\s\S]*?)<\/command-args>/
const commandStdout = /^<local-command-stdout>[\s\S]*<\/local-command-stdout>$/
const commandStderr = /^<local-command-stderr>([\s\S]*)<\/local-command-stderr>$/
/** Terminal colour codes that a command's output can hold. */
const colour = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

/**
 * A slash command's lines: its own line as the owner typed it (`/compact keep the plan`), its error output as an
 * error's text, nothing for its other output, and undefined for any other text.
 */
function commandOf(text: string): { command: string } | { error: string } | null | undefined {
  const trimmed = text.trim()
  // Only a whole output block: a prompt that starts with the tag stays the owner's text.
  if (commandStdout.test(trimmed)) return null
  const stderr = commandStderr.exec(trimmed)
  if (stderr !== null) {
    const error = (stderr[1] ?? '').replace(colour, '').trim()
    return error === '' ? null : { error }
  }
  const name = commandName.exec(trimmed)
  if (name?.[1] === undefined) return undefined
  const args = commandArgs.exec(trimmed)?.[1]?.trim() ?? ''
  return { command: `/${name[1].trim()}${args === '' ? '' : ` ${args}`}` }
}

/** Claude Code's tags around pasted text, with the same ID on both; the text inside is the owner's. */
const pasted = /<pasted_content id="([^"]{1,100})">\n?([\s\S]*?)\n?<\/pasted_content id="\1">/g

/**
 * A message that another chat typed into this pane (R55): the whole prompt is one `<agent-prompt from="NAME">`
 * wrapper, so text the owner types with the tag inside it, or with more around it, stays the owner's.
 */
const agentPrompt = /^<agent-prompt from="([A-Za-z0-9][A-Za-z0-9._-]{0,63})">([\s\S]*)<\/agent-prompt>$/

function agentPromptOf(uuid: string, raw: string): TranscriptEntry | undefined {
  // herdr types a long prompt as a paste, so Claude Code's paste tags can hold the whole wrapper.
  const match = agentPrompt.exec(raw.replace(pasted, (_all, _id, inner: string) => inner).trim())
  const inner = match?.[2]
  if (match === null || inner === undefined || inner.includes('</agent-prompt>')) return undefined
  const name = oneLine(match[1] ?? '', maxNoteFrom)
  const body = inner.trim()
  if (name === '') return undefined
  return {
    type: 'note',
    id: uuid,
    kind: 'peer',
    text: `Message from ${name}`,
    ...(body !== '' && { message: { from: name, via: 'prompt', ...textOf(body) } }),
  }
}

/**
 * A prompt as the owner wrote it: each paste's tags removed, and the file lines that the server adds below a
 * prompt with files (`uploads.ts`) taken out, with the name of each file.
 */
function promptOf(raw: string, uploads: string | undefined): { text: string; files?: string[] } {
  // Only blank lines go from the start, so a first line indented as code keeps its indent.
  const text = raw
    .replace(pasted, (_all, _id, inner: string) => inner)
    .replace(/^(?:[ \t]*\n)+/, '')
    .trimEnd()
  const at = text.lastIndexOf(attachedLine)
  if (at < 0 || (at > 0 && !text.slice(0, at).endsWith('\n\n'))) return { text }
  const lines = text
    .slice(at + attachedLine.length)
    .split('\n')
    .slice(1)
  // Only paths in the uploads folder are the server's own lines; a prompt that only looks like one stays text.
  const inUploads = (l: string) => uploads !== undefined && l.startsWith(`- ${uploads}/`)
  if (lines.length === 0 || lines.length > maxAttachments || !lines.every(inUploads)) return { text }
  const files = lines.map((l) => (l.split('/').at(-1) ?? '').slice(0, maxEntryFileName))
  if (files.some((f) => f === '')) return { text }
  return { text: text.slice(0, at).trimEnd(), files }
}

/** The entry of an owner's prompt: a slash command as typed, its error output, or the prompt with its files. */
function promptEntries(uuid: string, raw: string, options: TranscriptOptions): TranscriptEntry[] {
  const agent = agentPromptOf(uuid, raw)
  if (agent !== undefined) return [agent]
  const command = commandOf(raw)
  if (command === null) return []
  if (command !== undefined && 'error' in command) {
    const cut = command.error.length > maxErrorText
    return [{ type: 'error', id: uuid, text: command.error.slice(0, maxErrorText), cut }]
  }
  if (command !== undefined) return [{ type: 'user', id: uuid, ...textOf(command.command) }]
  const prompt = promptOf(raw, options.uploads)
  if (prompt.text === '' && prompt.files === undefined) return []
  return [{ type: 'user', id: uuid, ...textOf(prompt.text), ...(prompt.files && { files: prompt.files }) }]
}

/** The entries of one session line, in order; `results` gets the IDs of the tool calls it answers. */
function entriesOf(value: unknown, options: TranscriptOptions, results: Set<string>): TranscriptEntry[] {
  const queued = QueuedLine.safeParse(value)
  if (queued.success) {
    const { uuid, isSidechain, attachment } = queued.data
    const owners =
      attachment.origin?.kind === 'human' &&
      attachment.commandMode === 'prompt' &&
      attachment.humanTurn === true &&
      attachment.isMeta !== true
    if (isSidechain === true) return []
    const { prompt } = attachment
    const raw =
      typeof prompt === 'string'
        ? prompt
        : prompt
            .map((b) => Block.safeParse(b))
            .flatMap((b) => (b.success && b.data.type === 'text' ? [b.data.text] : []))
            .join('\n\n')
    if (owners) return promptEntries(uuid, raw, options)
    const note = noteOf(attachment.origin, attachment.isMeta, raw)
    return note === undefined ? [] : [{ type: 'note', id: uuid, ...note }]
  }
  const line = Line.safeParse(value)
  const { data } = line
  // A compact summary is Claude Code's own text for the model, not a prompt.
  if (!line.success || data?.isSidechain === true || data?.isCompactSummary === true) return []
  const { type, uuid, message, origin, isMeta } = line.data
  // A meta line is never the owner's or the agent's text; only a harness note of it shows.
  if (isMeta === true && type === 'assistant') return []
  const blocks = (typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : message.content)
    .map((b) => Block.safeParse(b))
    .flatMap((b) => (b.success ? [b.data] : []))
  if (type === 'user') {
    for (const b of blocks) if (b.type === 'tool_result') results.add(b.tool_use_id)
    const raw = blocks.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n\n')
    const note = noteOf(origin, isMeta, raw)
    if (note !== undefined) return [{ type: 'note', id: uuid, ...note }]
    // Only text the owner typed or pasted is a prompt: origin "human", or an older line with no origin and no meta mark.
    const owners = origin === undefined ? isMeta !== true : origin.kind === 'human'
    return owners ? promptEntries(uuid, raw, options) : []
  }
  return blocks.flatMap((b, i): TranscriptEntry[] => {
    if (b.type === 'text')
      return b.text === '' ? [] : [{ type: 'assistant', id: `${uuid}:${String(i)}`, ...textOf(b.text) }]
    if (b.type === 'tool_use')
      return [
        {
          type: 'tool',
          id: b.id,
          name: b.name.slice(0, 100),
          target: toolTarget(b.name, b.input, options),
          running: options.working && !results.has(b.id),
          ...toolLabel(b.name, b.input),
        },
      ]
    return []
  })
}

/** The last entries of the session file at `path`; no entries when the file is missing or cannot be read. */
export async function readClaudeTranscript(path: string, options: TranscriptOptions): Promise<TranscriptRead> {
  const found: TranscriptEntry[] = [] // newest first
  const seen = new Set<string>()
  const results = new Set<string>()
  let handle
  try {
    handle = await open(path, 'r')
  } catch {
    return { entries: [], earlier: false }
  }
  try {
    const { size } = await handle.stat()
    let end = size
    let carry = Buffer.alloc(0)
    const stopAt = Math.max(0, size - maxReadBytes)
    while (end > stopAt && found.length <= maxTranscriptEntries) {
      const start = Math.max(stopAt, end - partBytes)
      const part = Buffer.alloc(end - start)
      await handle.read(part, 0, part.length, start)
      const data = Buffer.concat([part, carry])
      // The bytes before the first newline can be the end of a line that starts before this part: keep them as
      // bytes, as the part can start inside a character.
      const firstNewline = start > stopAt ? data.indexOf(10) : -1
      if (start > stopAt && firstNewline === -1) {
        carry = data
        end = start
        continue
      }
      carry = start > stopAt ? data.subarray(0, firstNewline) : Buffer.alloc(0)
      const lines = data
        .subarray(start > stopAt ? firstNewline + 1 : 0)
        .toString('utf8')
        .split('\n')
      for (const text of lines.reverse()) {
        if (text.trim() === '') continue
        let value: unknown
        try {
          value = JSON.parse(text)
        } catch {
          continue
        }
        for (const entry of entriesOf(value, options, results).reverse()) {
          if (seen.has(entry.id)) continue
          seen.add(entry.id)
          found.push(entry)
        }
        if (found.length > maxTranscriptEntries) break
      }
      end = start
    }
    const earlier = found.length > maxTranscriptEntries || stopAt > 0
    return { entries: found.slice(0, maxTranscriptEntries).reverse(), earlier }
  } catch {
    return { entries: [], earlier: false }
  } finally {
    await handle.close()
  }
}
