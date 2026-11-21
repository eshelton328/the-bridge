// The Artifacts library (R26, R27): the Claude artifacts that the finder
// reads from the chats' session files, and the links the owner adds. Each
// list reads what the finder found since the last list and keeps it in the
// store; nothing reads on a timer (d-112). An artifact's ID is the start
// of its link's sha256, so a link is found once and never goes in a URL.
// Remove keeps the entry, marked removed, so a later find does not add it
// again. No link, title or path goes into a log.
import { createHash } from 'node:crypto'
import {
  type AddArtifactRequest,
  type Artifact,
  ArtifactId,
  type ArtifactProject,
  type ArtifactsResponse,
  ChatId,
  type MachineId,
  maxArtifactDescription,
  maxArtifactTitle,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'

/** An artifact that a chat published, as the finder gives it. */
export type FoundArtifact = {
  readonly link: string
  readonly title: string
  readonly description: string
  readonly publishedAt: string
  readonly session: string
  readonly project: ArtifactProject | null
}

/** Reads the artifacts published since its last scan; `partial` when it stopped at a cap. */
type ArtifactFinder = {
  scan(): Promise<{ readonly found: readonly FoundArtifact[]; readonly partial: boolean }>
}

type StoredArtifact = Artifact & { readonly removed: boolean }
export type ArtifactLibrary = { readonly lastSeenAt: string | null; readonly artifacts: readonly StoredArtifact[] }
/** A store fault: its errno code only, never a path or a link. */
type ArtifactStoreError = { readonly reason: 'failed'; readonly code: string }

export type ArtifactStore = {
  load(): Promise<Result<ArtifactLibrary, ArtifactStoreError>>
  save(library: ArtifactLibrary): Promise<Result<void, ArtifactStoreError>>
}

type Deps = {
  readonly store: ArtifactStore
  readonly finder: ArtifactFinder
  readonly machine: MachineId
  readonly now?: () => Date
}

export type Artifacts = {
  list(): Promise<Result<ArtifactsResponse, ArtifactStoreError>>
  get(id: ArtifactId): Promise<Result<Artifact | 'notFound', ArtifactStoreError>>
  /** Adds a link; `added` is false when the library had it (a removed entry comes back). */
  add(request: AddArtifactRequest): Promise<Result<{ artifact: Artifact; added: boolean }, ArtifactStoreError>>
  file(id: ArtifactId, project: ArtifactProject | null): Promise<Result<'done' | 'notFound', ArtifactStoreError>>
  remove(id: ArtifactId): Promise<Result<'done' | 'notFound', ArtifactStoreError>>
  seen(): Promise<Result<void, ArtifactStoreError>>
}

/** The ID of the artifact at `link`: the first 16 hex characters of its sha256. */
export function artifactIdOf(link: string): ArtifactId {
  return ArtifactId.parse(createHash('sha256').update(link).digest('hex').slice(0, 16))
}

/** The artifact as the API gives it, with no `removed` mark. */
function shown(stored: StoredArtifact): Artifact {
  const { id, link, source, title, description, project, chat, publishedAt, foundAt, foundBy } = stored
  return { id, link, source, title, description, project, chat, publishedAt, foundAt, foundBy }
}
const newestFirst = (a: Artifact, b: Artifact) => b.publishedAt.localeCompare(a.publishedAt)

export function createArtifacts({ store, finder, machine, now = () => new Date() }: Deps): Artifacts {
  // One change at a time, so two lists or an add and a list cannot lose one.
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }
  /** Loads the library, lets `change` make the next one, and saves it when it changed. */
  const update = <T>(change: (library: ArtifactLibrary) => { next?: ArtifactLibrary | undefined; value: T }) =>
    serial(async (): Promise<Result<T, ArtifactStoreError>> => {
      const library = await store.load()
      if (!library.ok) return library
      const { next, value } = change(library.value)
      if (next === undefined) return ok(value)
      const saved = await store.save(next)
      return saved.ok ? ok(value) : err(saved.error)
    })

  /** The library with each found artifact in it: a new link is added, a republished one gets its new title. */
  const merged = (library: ArtifactLibrary, found: readonly FoundArtifact[]): ArtifactLibrary | undefined => {
    if (found.length === 0) return undefined
    const byId = new Map(library.artifacts.map((a) => [a.id, a]))
    const at = now().toISOString()
    let changed = false
    for (const f of found) {
      const id = artifactIdOf(f.link)
      const chat = ChatId.safeParse(`${machine}/${f.session}`)
      if (!chat.success) continue
      const title = f.title.slice(0, maxArtifactTitle)
      const description = f.description.slice(0, maxArtifactDescription)
      const known = byId.get(id)
      if (known === undefined) {
        changed = true
        byId.set(id, {
          id,
          link: f.link,
          source: 'claude',
          title,
          description,
          project: f.project,
          chat: chat.data,
          publishedAt: f.publishedAt,
          foundAt: at,
          foundBy: 'session',
          removed: false,
        })
      } else if (f.publishedAt > known.publishedAt) {
        changed = true
        byId.set(id, { ...known, title, description: description || known.description, publishedAt: f.publishedAt })
      }
    }
    return changed ? { ...library, artifacts: [...byId.values()] } : undefined
  }

  const find = (library: ArtifactLibrary, id: ArtifactId) => library.artifacts.find((a) => a.id === id && !a.removed)
  const replace = (library: ArtifactLibrary, artifact: StoredArtifact): ArtifactLibrary => ({
    ...library,
    artifacts: library.artifacts.map((a) => (a.id === artifact.id ? artifact : a)),
  })

  return {
    async list() {
      const scan = await finder.scan()
      const checkedAt = now().toISOString()
      return update((library) => {
        const next = merged(library, scan.found)
        const kept = next ?? library
        return {
          next,
          value: {
            checkedAt,
            lastSeenAt: kept.lastSeenAt,
            partial: scan.partial,
            artifacts: kept.artifacts
              .filter((a) => !a.removed)
              .map(shown)
              .sort(newestFirst),
          },
        }
      })
    },
    get: (id) =>
      update((library) => {
        const artifact = find(library, id)
        return { value: artifact === undefined ? 'notFound' : shown(artifact) }
      }),
    add: (request) =>
      update<{ artifact: Artifact; added: boolean }>((library) => {
        const id = artifactIdOf(request.link)
        const known = library.artifacts.find((a) => a.id === id)
        if (known !== undefined && !known.removed) return { value: { artifact: shown(known), added: false } }
        if (known !== undefined) {
          const back = { ...known, removed: false }
          return { next: replace(library, back), value: { artifact: shown(back), added: false } }
        }
        const at = now().toISOString()
        const artifact: StoredArtifact = {
          id,
          link: request.link,
          source: request.source,
          title: request.title,
          description: '',
          project: request.project ?? null,
          chat: null,
          publishedAt: at,
          foundAt: at,
          foundBy: 'owner',
          removed: false,
        }
        return {
          next: { ...library, artifacts: [...library.artifacts, artifact] },
          value: { artifact: shown(artifact), added: true },
        }
      }),
    file: (id, project) =>
      update((library) => {
        const artifact = find(library, id)
        if (artifact === undefined) return { value: 'notFound' as const }
        return { next: replace(library, { ...artifact, project }), value: 'done' as const }
      }),
    remove: (id) =>
      update((library) => {
        const artifact = find(library, id)
        if (artifact === undefined) return { value: 'notFound' as const }
        return { next: replace(library, { ...artifact, removed: true }), value: 'done' as const }
      }),
    seen: () => update((library) => ({ next: { ...library, lastSeenAt: now().toISOString() }, value: undefined })),
  }
}
