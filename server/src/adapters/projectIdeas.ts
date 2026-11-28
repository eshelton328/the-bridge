// A project's idea records (f-008, R10, R11): `<project>/ideas/*.md` with
// `type: idea` in the front matter. Only a plain file whose real path stays
// in the ideas folder, never a symlink, of at most 256 KiB; a record it
// cannot decode, or one with no ID or title, is skipped. `tags`, `kind` and
// `state` are optional keys: a record without them has no tags, the kind
// idea and the state open. A detail also gives `created`, the kind of its
// `source` (never the text, which can hold the owner's name) and the brain
// records its body links to: an idea, a decision or a feature of the same
// project folder, read as a record for its title, never a path.
import { lstat, readdir, readFile, realpath } from 'node:fs/promises'
import { join, posix, sep } from 'node:path'
import {
  IdeaFile,
  IdeaId,
  type IdeaLink,
  IdeaKind,
  type IdeaSource,
  IdeaState,
  maxIdeaBody,
  maxIdeaLinks,
  maxProjectSummary,
  maxProjectTitle,
} from '@bridge/contract'
import type { IdeaRecord } from '../services/projects.ts'
import { splitRecord } from './diskInbox.ts'

/** A record larger than this is not read. */
const maxIdeaBytes = 256 * 1024

/** A plain file's text when its real path stays in `folder` and it is at most `max` bytes, else null. */
export async function readInside(folder: string, path: string, max: number): Promise<string | null> {
  const stat = await lstat(path).catch(() => null)
  if (!stat?.isFile() || stat.size > max) return null
  const real = await realpath(path)
  if (!real.startsWith(folder + sep)) return null
  return readFile(real, 'utf8')
}

type Value = string | string[] | null | undefined

const text = (v: Value) => (typeof v === 'string' ? v : null)
const time = (v: Value) => {
  const t = text(v)
  const parsed = t === null ? Number.NaN : Date.parse(t)
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString()
}

/**
 * The first paragraph of a record's body after its first heading, as one line: the row's summary. A heading, a
 * list or a quote ends the search; a record with no such paragraph gives an empty summary.
 */
export function summaryOf(body: string): string {
  const lines = body.replaceAll('\r\n', '\n').split('\n')
  const heading = lines.findIndex((l) => /^#\s/.test(l))
  const paragraph: string[] = []
  for (const line of lines.slice(heading + 1)) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (paragraph.length > 0) break
      continue
    }
    if (/^(#|[-*>]\s|\d+\.\s|```|\|)/.test(trimmed)) {
      if (paragraph.length > 0) break
      continue
    }
    paragraph.push(trimmed)
  }
  const joined = paragraph.join(' ').replace(/\s+/g, ' ')
  return joined.length > maxProjectSummary ? `${joined.slice(0, maxProjectSummary - 1)}…` : joined
}

/** The kind of a record's `source`: a chat with the owner, a capture, the vault inbox or another; null with none. */
export function sourceOf(source: string | null): IdeaSource | null {
  const t = source?.trim() ?? ''
  if (t === '') return null
  if (/^(\.\.\/)?captures\//.test(t)) return 'capture'
  if (t.startsWith('inbox/') || /\bvault inbox\b/.test(t)) return 'inbox'
  if (/\b(discussion|request|chat)\b/i.test(t)) return 'chat'
  return 'other'
}

/** The project-relative paths of the Markdown files a body links to, from `ideas/`, in body order, each once. */
export function linkedPaths(body: string): string[] {
  const found: string[] = []
  for (const match of body.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    const target = (match[1] ?? '').split('#')[0] ?? ''
    // A URL or an absolute path is no brain record of this folder.
    if (target === '' || target.includes(':') || target.startsWith('/') || !target.endsWith('.md')) continue
    const path = posix.normalize(posix.join('ideas', target))
    if (path.startsWith('../') || found.includes(path)) continue
    found.push(path)
    if (found.length >= maxIdeaLinks) break
  }
  return found
}

/** A linked path's kind and `d-NNN` or `f-NNN` ref by its folder and name; null for any other file. */
const linkKindOf = (path: string): { kind: IdeaLink['kind']; ref: string | null } | null => {
  if (/^ideas\/[A-Za-z0-9._-]+\.md$/.test(path)) return { kind: 'idea', ref: null }
  const decision = /^decisions\/(d-\d{3})-[A-Za-z0-9._-]+\.md$/.exec(path)
  if (decision?.[1] !== undefined) return { kind: 'decision', ref: decision[1] }
  const feature = /^product\/features\/(f-\d{3})(?:-[A-Za-z0-9._-]+\.md|-[A-Za-z0-9._-]+\/README\.md)$/.exec(path)
  if (feature?.[1] !== undefined) return { kind: 'feature', ref: feature[1] }
  return null
}

/**
 * The records a body links to, in body order: each an idea, decision or feature file of the project folder whose
 * real path stays in it, read as a record of that type with a title. Any other link, and a file that does not read,
 * is left out. It throws on a read fault, as `readIdeas` does.
 */
export async function readLinks(projectFolder: string, body: string): Promise<IdeaLink[]> {
  const folder = await realpath(projectFolder)
  const links: IdeaLink[] = []
  for (const path of linkedPaths(body)) {
    const known = linkKindOf(path)
    if (known === null) continue
    const fileText = await readInside(folder, join(folder, ...path.split('/')), maxIdeaBytes)
    let record: ReturnType<typeof splitRecord>
    try {
      record = fileText === null ? null : splitRecord(fileText)
    } catch {
      continue
    }
    if (record === null || text(record.front.type) !== known.kind) continue
    const title = text(record.front.title)?.trim()
    if (title === undefined || title === '') continue
    const idea = known.kind === 'idea' ? IdeaId.safeParse(text(record.front.id)) : null
    if (idea !== null && !idea.success) continue
    links.push({ kind: known.kind, ref: known.ref, title: title.slice(0, maxProjectTitle), idea: idea?.data ?? null })
  }
  return links
}

function ideaOf(textOfFile: string, name: string): IdeaRecord | null {
  let record: ReturnType<typeof splitRecord>
  try {
    record = splitRecord(textOfFile)
  } catch {
    return null
  }
  if (record === null || text(record.front.type) !== 'idea') return null
  const { front, body } = record
  const id = IdeaId.safeParse(text(front.id))
  const title = text(front.title)?.trim()
  const updated = time(front.updated) ?? time(front.created)
  if (!id.success || title === undefined || title === '' || updated === null) return null
  const kind = IdeaKind.safeParse(text(front.kind))
  const state = IdeaState.safeParse(text(front.state))
  const tags = Array.isArray(front.tags) ? front.tags.filter((t) => t.length > 0 && t.length <= 100).slice(0, 20) : []
  return {
    created: time(front.created),
    source: sourceOf(text(front.source)),
    idea: {
      id: id.data,
      title: title.slice(0, maxProjectTitle),
      summary: summaryOf(body),
      tags,
      kind: kind.success ? kind.data : 'idea',
      state: state.success ? state.data : 'open',
      updated,
    },
    body: body.trim().slice(0, maxIdeaBody),
    // The folder entry's name, never the record's text; a name `IdeaFile` refuses gives none.
    file: IdeaFile.safeParse(`ideas/${name}`).data ?? null,
  }
}

/** The idea records of one project folder; none when it has no real `ideas` folder. It throws on a read fault. */
export async function readIdeas(projectFolder: string): Promise<IdeaRecord[]> {
  const named = join(projectFolder, 'ideas')
  const stat = await lstat(named).catch(() => null)
  if (!stat?.isDirectory()) return []
  // The real path, so a record's real path compares with it when a folder above is a link.
  const folder = await realpath(named)
  const found: IdeaRecord[] = []
  const entries = (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const fileText = await readInside(folder, join(folder, entry.name), maxIdeaBytes)
    const idea = fileText === null ? null : ideaOf(fileText, entry.name)
    // Two records with one ID: the first by file name wins, so the detail and the row agree.
    if (idea !== null && !found.some((f) => f.idea.id === idea.idea.id)) found.push(idea)
  }
  return found
}
