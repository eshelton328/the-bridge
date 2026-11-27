// The Projects app's adapters on disk (f-008). The brain's projects come
// from `<brain>/projects/<slug>/project.yaml`: only a plain file whose real
// path stays in its project folder, never a symlink, and only the keys the
// cards need. The pins, the last drift runs and the last CI answers are JSON
// files in a 0700 folder beside the database, 0600 and replaced in one rename. A fault gives
// its errno code only; no path or record text goes into an error.
import { createHash, randomUUID } from 'node:crypto'
import { chmod, lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  DriftRun,
  maxProjectSummary,
  maxProjectTitle,
  ProjectIcon,
  type ProjectRepository,
  ProjectSlug,
  RepositoryCi,
  RepositoryDriftRun,
  RepositoryId,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type {
  BrainProjects,
  DriftRuns,
  DriftStore,
  IdeaRecord,
  PinStore,
  ProjectFault,
  ProjectRecord,
  RepositoryDriftRuns,
  RepositoryDriftStore,
} from '../services/projects.ts'
import type { CiStore, KeptCi } from '../services/repositoryCi.ts'
import { unquote } from './diskInbox.ts'
import { readIdeas, readInside } from './projectIdeas.ts'

/** A `project.yaml` larger than this is not read: it is a page of keys. */
const maxProjectFileBytes = 64 * 1024

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

type Scalars = Record<string, string | null>

/**
 * The top-level scalar keys of a `project.yaml` and the maps of its `repositories` and `linear` lists ("- key:
 * value" and the indented keys under it), as the project template writes them. Any other block is skipped.
 */
export function readProjectYaml(text: string): { scalars: Scalars; repositories: Scalars[]; linear: Scalars[] } {
  const scalars: Scalars = {}
  const repositories: Scalars[] = []
  const linear: Scalars[] = []
  let list: Scalars[] | undefined
  let item: Scalars | undefined
  for (const line of text.replaceAll('\r\n', '\n').split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    const top = /^([a-z_]+):(?: (.*))?$/.exec(line)
    if (top?.[1] !== undefined) {
      const value = (top[2] ?? '').trim()
      list =
        value !== '' ? undefined : top[1] === 'repositories' ? repositories : top[1] === 'linear' ? linear : undefined
      item = undefined
      if (value !== '') scalars[top[1]] = unquote(value)
      continue
    }
    if (list === undefined) continue
    const start = /^\s*- ([a-z_]+):(?: (.*))?$/.exec(line)
    if (start?.[1] !== undefined) {
      item = { [start[1]]: unquote((start[2] ?? '').trim()) }
      list.push(item)
      continue
    }
    const key = /^\s+([a-z_]+):(?: (.*))?$/.exec(line)
    if (key?.[1] !== undefined && item !== undefined) item[key[1]] = unquote((key[2] ?? '').trim())
  }
  return { scalars, repositories, linear }
}

const githubUrl =
  /^https:\/\/github\.com\/([A-Za-z0-9][A-Za-z0-9._-]{0,99})\/([A-Za-z0-9][A-Za-z0-9._-]{0,99}?)(?:\.git)?\/?$/

/** The GitHub owner and name of a repository URL; null for any other URL, such as a local folder. */
export function githubOf(url: string | null | undefined): ProjectRepository['github'] {
  const found = url === null || url === undefined ? null : githubUrl.exec(url)
  if (found?.[1] === undefined || found[2] === undefined) return null
  return { owner: found[1], name: found[2] }
}

function recordOf(slug: ProjectSlug, text: string): ProjectRecord {
  const { scalars, repositories, linear } = readProjectYaml(text)
  const team = linear.map((t) => t.team).find((t) => typeof t === 'string' && /^[A-Z]+$/.test(t))
  const name = scalars.name?.trim()
  const icon = ProjectIcon.safeParse(scalars.icon)
  const repos: ProjectRepository[] = []
  for (const r of repositories) {
    const id = RepositoryId.safeParse(r.id)
    if (!id.success || repos.some((x) => x.id === id.data)) continue
    repos.push({ id: id.data, role: (r.role ?? '').slice(0, maxProjectSummary), github: githubOf(r.url) })
  }
  return {
    slug,
    name: (name === undefined || name === '' ? slug : name).slice(0, maxProjectTitle),
    purpose: (scalars.purpose ?? '').trim().slice(0, maxProjectSummary),
    icon: icon.success ? icon.data : null,
    repositories: repos,
    ...(typeof team === 'string' ? { linearTeam: team } : {}),
  }
}

export function createBrainProjects(brainDir: string): BrainProjects {
  /** The real `projects` folder, or null when the brain has none. */
  const root = async (): Promise<Result<string | null, ProjectFault>> => {
    try {
      return ok(await realpath(join(brainDir, 'projects')))
    } catch (thrown) {
      return codeOf(thrown) === 'ENOENT' ? ok(null) : err({ reason: 'failed', code: codeOf(thrown) })
    }
  }
  /** A project's real folder, never a symlink; null for a slug with no such folder. */
  const folderOf = async (projects: string, slug: string) => {
    const folder = join(projects, slug)
    const stat = await lstat(folder).catch(() => null)
    return stat?.isDirectory() === true ? folder : null
  }
  return {
    async list() {
      const projects = await root()
      if (!projects.ok || projects.value === null) return projects.ok ? ok([]) : projects
      const found: ProjectRecord[] = []
      try {
        for (const entry of await readdir(projects.value, { withFileTypes: true })) {
          const slug = ProjectSlug.safeParse(entry.name)
          if (!entry.isDirectory() || !slug.success) continue
          const folder = join(projects.value, entry.name)
          const text = await readInside(folder, join(folder, 'project.yaml'), maxProjectFileBytes)
          if (text !== null) found.push(recordOf(slug.data, text))
        }
      } catch (thrown) {
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
      return ok(found)
    },
    async ideas(slug) {
      const projects = await root()
      if (!projects.ok) return projects
      const folder = projects.value === null ? null : await folderOf(projects.value, slug)
      if (folder === null) return ok([])
      try {
        const ideas: IdeaRecord[] = await readIdeas(folder)
        return ok(ideas)
      } catch (thrown) {
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
    },
  }
}

/** A JSON file of the server's data, read with its schema: a missing file is `empty`, a bad one the fault `EBADDATA`. */
function jsonFile<T>(root: string, name: string, schema: z.ZodType<T>, empty: T) {
  const path = join(root, name)
  return {
    async load(): Promise<Result<T, ProjectFault>> {
      let raw: unknown
      try {
        raw = JSON.parse(await readFile(path, 'utf8'))
      } catch (thrown) {
        if (codeOf(thrown) === 'ENOENT') return ok(empty)
        // A file that JSON cannot read is a fault, never an empty store, so a save cannot write over it.
        return err({ reason: 'failed', code: thrown instanceof SyntaxError ? 'EBADDATA' : codeOf(thrown) })
      }
      const parsed = schema.safeParse(raw)
      return parsed.success ? ok(parsed.data) : err({ reason: 'failed', code: 'EBADDATA' })
    },
    async save(value: T): Promise<Result<void, ProjectFault>> {
      let temporary: string | undefined
      try {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        temporary = `${path}.${randomUUID()}.tmp`
        await writeFile(temporary, JSON.stringify(value), { mode: 0o600 })
        await rename(temporary, path)
        return ok(undefined)
      } catch (thrown) {
        if (temporary !== undefined) await rm(temporary, { force: true }).catch(() => undefined)
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
    },
  }
}

const StoredPins = z.strictObject({ pins: z.array(ProjectSlug) })

/** The owner's pins in `pins.json`. */
export function createDiskPins(root: string): PinStore {
  const file = jsonFile(root, 'pins.json', StoredPins, { pins: [] })
  return {
    async load() {
      const stored = await file.load()
      return stored.ok ? ok(stored.value.pins) : stored
    },
    save: (pins) => file.save({ pins: [...pins] }),
  }
}

const StoredRuns = z.record(ProjectSlug, DriftRun)

/** The last drift run of each project in `drift.json`. */
export function createDiskDriftStore(root: string): DriftStore {
  const file = jsonFile<DriftRuns>(root, 'drift.json', StoredRuns, {})
  return { load: () => file.load(), save: (runs) => file.save(runs) }
}

const StoredCi = z.strictObject({ ci: RepositoryCi, readAt: z.iso.datetime({ offset: true }) })

/** A repository's file name: the sha256 hex of `owner/name` in lower case, so no path comes from GitHub's text. */
const ciFileOf = (repository: { readonly owner: string; readonly name: string }) =>
  `${createHash('sha256').update(`${repository.owner}/${repository.name}`.toLowerCase()).digest('hex')}.json`

/** The last CI answer of each GitHub repository, one file each in `ci/`. */
export function createDiskCiStore(root: string): CiStore {
  const folder = join(root, 'ci')
  return {
    async load(repository) {
      try {
        const parsed = StoredCi.safeParse(JSON.parse(await readFile(join(folder, ciFileOf(repository)), 'utf8')))
        return parsed.success ? parsed.data : null
      } catch {
        // A missing file or one that JSON cannot read is no answer: the next read writes it again.
        return null
      }
    },
    save: (repository, kept: KeptCi) => jsonFile(folder, ciFileOf(repository), StoredCi, kept).save(kept),
    async prune(keep) {
      const kept = new Set(keep.map(ciFileOf))
      let names: string[]
      try {
        names = await readdir(folder)
      } catch (thrown) {
        return codeOf(thrown) === 'ENOENT' ? ok(undefined) : err({ reason: 'failed', code: codeOf(thrown) })
      }
      try {
        for (const name of names)
          if (/^[0-9a-f]{64}\.json$/.test(name) && !kept.has(name)) await rm(join(folder, name), { force: true })
        return ok(undefined)
      } catch (thrown) {
        return err({ reason: 'failed', code: codeOf(thrown) })
      }
    },
  }
}

const StoredRepositoryRuns = z.record(ProjectSlug, z.record(RepositoryId, RepositoryDriftRun))

/** The last drift run of each repository, by project slug and repository ID, in `repository-drift.json`. */
export function createDiskRepositoryDriftStore(root: string): RepositoryDriftStore {
  const file = jsonFile<RepositoryDriftRuns>(root, 'repository-drift.json', StoredRepositoryRuns, {})
  return { load: () => file.load(), save: (runs) => file.save(runs) }
}
