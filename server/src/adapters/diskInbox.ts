// The Inbox's adapters on disk (R20). The brain's attention requests are
// read from `<brain>/projects/<project>/inbox/*.md`: only a plain file
// whose real path stays in that folder, never a symlink, and only its front
// matter for the list. The owner's marks are inbox.json in a 0700 folder
// beside the database, 0600 and replaced in one rename. A fault gives its
// errno code only; no path, title or record text goes into an error.
import { createHash, randomUUID } from 'node:crypto'
import { chmod, lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { InboxId, InboxKind, maxInboxBody } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { BrainRequest, BrainRequests, InboxMarks, InboxMarkStore } from '../services/inbox.ts'

/** A record larger than this is not read: an attention request is a page of text. */
const maxRecordBytes = 256 * 1024
const projectName = /^[a-z0-9][a-z0-9._-]{0,63}$/

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

type Fault = { readonly reason: 'failed'; readonly code: string }
type Front = Record<string, string | string[] | null>

const simpleEscapes: Readonly<Record<string, string>> = {
  n: '\n',
  t: '\t',
  r: '\r',
  '0': '\0',
  '"': '"',
  '\\': '\\',
  '/': '/',
  ' ': ' ',
}

/** A YAML double-quoted string's text: its escapes, with x, u and U escapes as hex code points; an unknown one stays as written. */
const decodeDouble = (inner: string) =>
  inner.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (whole: string, code: string) =>
    code.length > 1 ? String.fromCodePoint(Number.parseInt(code.slice(1), 16)) : (simpleEscapes[code] ?? whole),
  )

const unquote = (value: string): string | null => {
  if (value === 'null' || value === '~' || value === '') return null
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) return value.slice(1, -1).replaceAll("''", "'")
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) return decodeDouble(value.slice(1, -1))
  return value
}

type Raw = { text: string; join: ' ' | '\n'; block: boolean }

/**
 * The front matter and the body of a record: the top-level keys with a scalar, a block scalar (`>` or `|`), an
 * inline empty list or a list of "- " lines, as the brain's records write them. An indented line goes on the value
 * before it, folded with a space, as YAML wraps a long title. Anything else is skipped. Null when the text has
 * none. It throws on a value it cannot decode; the caller skips that record.
 */
export function splitRecord(text: string): { front: Front; body: string } | null {
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end < 0) return null
  const raw: Record<string, Raw | Raw[]> = {}
  let list: Raw[] | undefined
  let open: Raw | undefined
  for (const line of lines.slice(1, end)) {
    const item = /^\s*- (.*)$/.exec(line)
    if (item?.[1] !== undefined && list !== undefined) {
      open = { text: item[1].trim(), join: ' ', block: false }
      list.push(open)
      continue
    }
    if (/^\s+\S/.test(line) && open !== undefined) {
      open.text = open.text === '' ? line.trim() : `${open.text}${open.join}${line.trim()}`
      continue
    }
    const pair = /^([a-z_]+):(?: (.*))?$/.exec(line)
    list = undefined
    open = undefined
    if (pair?.[1] === undefined) continue
    const value = (pair[2] ?? '').trim()
    if (value === '') raw[pair[1]] = list = []
    else if (value === '[]') raw[pair[1]] = []
    else if (/^[>|][-+]?$/.test(value))
      raw[pair[1]] = open = { text: '', join: value.startsWith('|') ? '\n' : ' ', block: true }
    else raw[pair[1]] = open = { text: value, join: ' ', block: false }
  }
  const read = (r: Raw) => (r.block ? r.text : unquote(r.text))
  const front: Front = {}
  for (const [key, value] of Object.entries(raw))
    front[key] = Array.isArray(value) ? value.flatMap((r) => read(r) ?? []) : read(value)
  return { front, body: lines.slice(end + 1).join('\n') }
}

const text = (v: string | string[] | null | undefined) => (typeof v === 'string' ? v : null)
const time = (v: string | string[] | null | undefined) => {
  const t = text(v)
  const parsed = t === null ? Number.NaN : Date.parse(t)
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString()
}

/** The request in a record's front matter; null for a record that is not an open or snoozed attention request. */
function requestOf(front: Front, id: InboxId, project: string): BrainRequest | null {
  const status = text(front.status)
  const title = text(front.title)?.trim()
  const created = time(front.created)
  if (text(front.type) !== 'attention-request' || (status !== 'open' && status !== 'snoozed')) return null
  if (title === undefined || title === '' || created === null) return null
  const kind = InboxKind.safeParse(text(front.kind))
  const tags = Array.isArray(front.tags) ? front.tags.filter((t) => t.length <= 100).slice(0, 20) : []
  return {
    id,
    kind: kind.success ? kind.data : 'action',
    title,
    project: projectName.test(project) ? project : null,
    tags,
    created,
    snoozedUntil: status === 'snoozed' ? time(front.snoozed_until) : null,
  }
}

/** A record's parts, or null for one it cannot read, so one bad record hides only itself. */
function recordOf(text: string): ReturnType<typeof splitRecord> {
  try {
    return splitRecord(text)
  } catch {
    return null
  }
}

type Found = { readonly request: BrainRequest; readonly body: string }

export function createBrainRequests(brainDir: string): BrainRequests {
  /** Each record's text, read only when its real path stays in its project's inbox folder. */
  const read = async (): Promise<Result<Found[], Fault>> => {
    let projects: string
    try {
      projects = await realpath(join(brainDir, 'projects'))
    } catch (thrown) {
      return codeOf(thrown) === 'ENOENT' ? ok([]) : err({ reason: 'failed', code: codeOf(thrown) })
    }
    const found: Found[] = []
    try {
      for (const project of await readdir(projects, { withFileTypes: true })) {
        if (!project.isDirectory()) continue
        const inbox = join(projects, project.name, 'inbox')
        const folder = await lstat(inbox).catch(() => null)
        if (!folder?.isDirectory()) continue
        for (const entry of await readdir(inbox, { withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith('.md')) continue
          const path = join(inbox, entry.name)
          const [real, stat] = await Promise.all([realpath(path), lstat(path)])
          if (!real.startsWith(inbox + sep) || stat.size > maxRecordBytes) continue
          const record = recordOf(await readFile(real, 'utf8'))
          if (record === null) continue
          const id = InboxId.parse(
            createHash('sha256').update(`brain|${project.name}/${entry.name}`).digest('hex').slice(0, 16),
          )
          const request = requestOf(record.front, id, project.name)
          if (request !== null) found.push({ request, body: record.body.trim().slice(0, maxInboxBody) })
        }
      }
    } catch (thrown) {
      return err({ reason: 'failed', code: codeOf(thrown) })
    }
    return ok(found)
  }
  return {
    async list() {
      const found = await read()
      return found.ok ? ok(found.value.map((f) => f.request)) : found
    },
    async body(id) {
      const found = await read()
      return found.ok ? ok(found.value.find((f) => f.request.id === id)?.body ?? null) : found
    },
  }
}

const Mark = z.discriminatedUnion('state', [
  z.strictObject({ state: z.enum(['done', 'dismissed']) }),
  z.strictObject({ state: z.literal('snoozed'), until: z.iso.datetime() }),
])
const Stored = z.record(InboxId, Mark)

export function createDiskInboxMarks(root: string): InboxMarkStore {
  const path = join(root, 'inbox.json')
  return {
    async load() {
      let raw: unknown
      try {
        raw = JSON.parse(await readFile(path, 'utf8'))
      } catch (thrown) {
        if (codeOf(thrown) === 'ENOENT') return ok({})
        // A file that JSON cannot read is a fault, never an empty list, so a save cannot write over it.
        return err({ reason: 'failed', code: thrown instanceof SyntaxError ? 'EBADDATA' : codeOf(thrown) })
      }
      const parsed = Stored.safeParse(raw)
      if (!parsed.success) return err({ reason: 'failed', code: 'EBADDATA' })
      const marks: InboxMarks = parsed.data
      return ok(marks)
    },
    async save(marks) {
      let temporary: string | undefined
      try {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        temporary = `${path}.${randomUUID()}.tmp`
        await writeFile(temporary, JSON.stringify(marks), { mode: 0o600 })
        await rename(temporary, path)
        return ok(undefined)
      } catch (thrown) {
        if (temporary !== undefined) await rm(temporary, { force: true }).catch(() => undefined)
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
    },
  }
}
