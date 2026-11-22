// The Claude artifacts that Claude Code chats publish (R27), found in the
// session files: an `Artifact` tool call with action `publish`, then its
// result. A result that is an error, or that has no claude.ai artifact
// link in its `toolUseResult`, is skipped. A chat in Code Mode calls the
// tool inside a script, which writes no such record, so its artifacts are
// not found. Each scan reads only what was written since the last one,
// and stops at a time cap and a byte cap, so a large file cannot hold up a
// list; the next scan goes on from there. Nothing here logs.
import type { Dirent, Stats } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { chmod, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { ArtifactProject } from '@bridge/contract'
import { z } from 'zod'
import type { ArtifactFinder } from '../services/artifacts.ts'

/** An artifact as its session file records it. `cwd` is the chat's folder; it stays in the server. */
type FoundArtifact = {
  readonly link: string
  readonly title: string
  readonly description: string
  readonly publishedAt: string
  readonly session: string
  readonly cwd: string
}

type ArtifactScan = {
  /** The artifacts published since the last scan, oldest first in each file. */
  readonly found: readonly FoundArtifact[]
  /** The scan stopped at a cap; the next scan reads the rest. */
  readonly partial: boolean
}

type ArtifactScanner = { scan(): Promise<ArtifactScan> }

type Limits = {
  /** The most time one scan takes, in ms. */
  readonly maxMs?: number
  /** The most bytes one scan reads. */
  readonly maxBytes?: number
  readonly now?: () => number
  /**
   * Where the scan keeps how far it read each file, so a server restart reads on from there. A 0600 file in a 0700
   * folder; with none, a restart reads every file again.
   */
  readonly cursorFile?: string
}

/** How far a scan read one file: a line's start, and whether the scan is in a line over `maxLineBytes` it skips. */
const Cursor = z.record(z.string(), z.object({ offset: z.number().int().min(0), skipLine: z.boolean() }))
type Cursor = z.infer<typeof Cursor>

/** The saved cursor, or none when the file is missing or not one; then the scan reads every file. */
async function loadCursor(path: string): Promise<Cursor> {
  const text = await readFile(path, 'utf8').catch(() => undefined)
  if (text === undefined) return {}
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return {}
  }
  const parsed = Cursor.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

/** Saves the cursor in one rename. A fault only means that a restart reads more, so it is not an error. */
async function saveCursor(path: string, cursor: Cursor): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    await chmod(dirname(path), 0o700)
    await writeFile(temporary, JSON.stringify(cursor), { mode: 0o600 })
    await rename(temporary, path)
  } catch {
    await rm(temporary, { force: true }).catch(() => undefined)
  }
}

const claudeLink = /^https:\/\/claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9_-]+$/
/** The size of each read. */
const chunkBytes = 1024 * 1024
/**
 * The most bytes one scan reads. The time cap is the limit that counts: a first scan of a large projects folder
 * (several GiB) must not take hundreds of lists. This cap only stops a scan of a very fast disk at a size that
 * the time cap allows.
 */
const defaultMaxBytes = 1024 * 1024 * 1024
/** A line longer than this is skipped, so one line cannot hold the scan. */
const maxLineBytes = 8 * 1024 * 1024

const Publish = z.object({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.literal('Artifact'),
  input: z.object({
    action: z.literal('publish'),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
})
const Assistant = z.object({ type: z.literal('assistant'), message: z.object({ content: z.array(z.unknown()) }) })
const ToolResult = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  is_error: z.boolean().optional(),
})
const User = z.object({
  type: z.literal('user'),
  timestamp: z.iso.datetime(),
  sessionId: z.uuid(),
  cwd: z.string(),
  message: z.object({ content: z.array(z.unknown()) }),
  toolUseResult: z.object({ url: z.string(), title: z.string().optional() }).optional(),
})

type Pending = { readonly title: string | undefined; readonly description: string }
/** Where the next read of a file starts: `offset` is a line's start, and `carry` the bytes read after it. */
type FileState = { offset: number; carry: Buffer; skipLine: boolean; readonly pending: Map<string, Pending> }

/** A line can hold an Artifact call or the result it waits for only when it has one of these bytes. */
const callMark = Buffer.from('"Artifact"')
const resultMark = Buffer.from('"tool_result"')

/** The artifacts of one line, and the calls it starts or ends in `pending`. */
function readLine(line: Buffer, pending: Map<string, Pending>, found: FoundArtifact[]) {
  // Most lines hold neither mark: the check reads bytes, so such a line is never decoded or parsed.
  if (!line.includes(callMark) && (pending.size === 0 || !line.includes(resultMark))) return
  let value: unknown
  try {
    value = JSON.parse(line.toString('utf8'))
  } catch {
    return
  }
  const assistant = Assistant.safeParse(value)
  if (assistant.success) {
    for (const block of assistant.data.message.content) {
      const call = Publish.safeParse(block)
      if (call.success)
        pending.set(call.data.id, { title: call.data.input.title, description: call.data.input.description ?? '' })
    }
    return
  }
  const user = User.safeParse(value)
  if (!user.success) return
  for (const block of user.data.message.content) {
    const result = ToolResult.safeParse(block)
    if (!result.success) continue
    const call = pending.get(result.data.tool_use_id)
    if (call === undefined) continue
    pending.delete(result.data.tool_use_id)
    const link = user.data.toolUseResult?.url
    const title = user.data.toolUseResult?.title ?? call.title
    if (result.data.is_error === true || link === undefined || !claudeLink.test(link) || !title) continue
    found.push({
      link,
      title,
      description: call.description,
      publishedAt: user.data.timestamp,
      session: user.data.sessionId,
      cwd: user.data.cwd,
    })
  }
}

/** The session files: `<projects>/<folder>/<session>.jsonl`, newest change first. */
async function sessionFiles(projects: string): Promise<{ path: string; size: number }[]> {
  const folders: Dirent[] = await readdir(projects, { withFileTypes: true }).catch(() => [])
  const files: { path: string; info: Stats }[] = []
  for (const folder of folders) {
    if (!folder.isDirectory()) continue
    const entries: Dirent[] = await readdir(join(projects, folder.name), { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue
      const path = join(projects, folder.name, entry.name)
      const info = await stat(path).catch(() => undefined)
      if (info !== undefined) files.push({ path, info })
    }
  }
  return files.sort((a, b) => b.info.mtimeMs - a.info.mtimeMs).map((f) => ({ path: f.path, size: f.info.size }))
}

export function createArtifactScanner(
  projects: string,
  { maxMs = 1500, maxBytes = defaultMaxBytes, now = Date.now, cursorFile }: Limits = {},
): ArtifactScanner {
  const states = new Map<string, FileState>()
  // The cursor of the last run, read once at the first scan. A session file only grows, so its saved offset is a
  // line's start in it; a file that is now shorter is read from the start, as in one run.
  let saved: Cursor | undefined
  let savedText = ''
  // One scan at a time: two at once would read the same bytes from the same offset.
  let queue: Promise<unknown> = Promise.resolve()
  const scanOnce = async (): Promise<ArtifactScan> => {
    const start = now()
    const found: FoundArtifact[] = []
    let budget = maxBytes
    let partial = false
    // Each scan reads at least one chunk, also past its time cap, so a slow disk or a long listing still moves on.
    let progressed = false
    const allowed = () => budget > 0 && (!progressed || now() - start <= maxMs)
    if (cursorFile !== undefined && saved === undefined) {
      saved = await loadCursor(cursorFile)
      for (const [path, at] of Object.entries(saved))
        states.set(path, { offset: at.offset, carry: Buffer.alloc(0), skipLine: at.skipLine, pending: new Map() })
      savedText = JSON.stringify(saved)
    }
    const files = await sessionFiles(projects)
    for (const { path, size } of files) {
      let state = states.get(path)
      // A file that became shorter was written again: read it from the start.
      if (state === undefined || size < state.offset) {
        state = { offset: 0, carry: Buffer.alloc(0), skipLine: false, pending: new Map() }
        states.set(path, state)
      }
      if (state.offset + state.carry.length >= size) continue
      if (!allowed()) {
        partial = true
        break
      }
      const handle = await open(path, 'r').catch(() => undefined)
      if (handle === undefined) continue
      try {
        // Lines split on the byte 0x0a, which no UTF-8 character holds, so an offset is always a line's start. A line
        // that a scan does not finish stays in `carry`, and the next scan reads on after it.
        while (state.offset + state.carry.length < size && allowed()) {
          const at = state.offset + state.carry.length
          const length = Math.min(chunkBytes, size - at, budget)
          const buffer = Buffer.alloc(length)
          const { bytesRead } = await handle.read(buffer, 0, length, at)
          if (bytesRead === 0) break
          progressed = true
          budget -= bytesRead
          let bytes = Buffer.concat([state.carry, buffer.subarray(0, bytesRead)])
          let end = bytes.indexOf(10)
          while (end !== -1) {
            const line = bytes.subarray(0, end)
            state.offset += end + 1
            if (state.skipLine) state.skipLine = false
            else readLine(line, state.pending, found)
            bytes = bytes.subarray(end + 1)
            end = bytes.indexOf(10)
          }
          state.carry = bytes
          if (state.carry.length > maxLineBytes) {
            state.offset += state.carry.length
            state.skipLine = true
            state.carry = Buffer.alloc(0)
          }
        }
        if (state.offset + state.carry.length < size) partial = true
      } finally {
        await handle.close()
      }
      if (partial) break
    }
    if (cursorFile !== undefined) {
      // Only the files that are there now, so a removed session leaves the cursor.
      const cursor: Cursor = {}
      for (const { path } of files) {
        const state = states.get(path)
        if (state !== undefined) cursor[path] = { offset: state.offset, skipLine: state.skipLine }
      }
      const text = JSON.stringify(cursor)
      if (text !== savedText) {
        await saveCursor(cursorFile, cursor)
        savedText = text
      }
    }
    return { found, partial }
  }
  return {
    scan() {
      const next = queue.then(scanOnce, scanOnce)
      queue = next.catch(() => undefined)
      return next
    },
  }
}

/** The project of a chat folder: the name after `<chat root>/projects/`, else null. */
export function projectOf(chatRoot: string, cwd: string): ArtifactProject | null {
  const parts = relative(join(chatRoot, 'projects'), cwd).split(sep)
  if (parts[0] === undefined || parts[0] === '' || parts[0] === '..') return null
  const project = ArtifactProject.safeParse(parts[0])
  return project.success ? project.data : null
}

/** The finder of the artifacts service: the scanner, with each chat folder turned into its project. */
export function createClaudeArtifactFinder(projects: string, chatRoot: string, limits: Limits = {}): ArtifactFinder {
  const scanner = createArtifactScanner(projects, limits)
  return {
    async scan() {
      const { found, partial } = await scanner.scan()
      return {
        partial,
        found: found.map(({ cwd, ...artifact }) => ({ ...artifact, project: projectOf(chatRoot, cwd) })),
      }
    },
  }
}
