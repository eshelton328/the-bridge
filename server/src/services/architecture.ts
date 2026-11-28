// The Architecture tab (f-008 increment two, R9 to R15): one diagram for each
// scope of a project, `@system` and each repository of its `project.yaml`. A
// runner makes a diagram; the service cleans and checks it, keeps it and tells
// the watchers. One run goes at a time over all projects: a regenerate of the
// running scope joins it, another scope is `busy`. `running` is in memory
// only. A log keeps a fault's code only, nothing of a model.
import {
  ArchitectureModel,
  type ArchitectureResponse,
  type ArchitectureScope,
  type ArchitectureScopeResponse,
  type ArchitectureScopeState,
  type ProjectRepository,
  type ProjectSlug,
  type RegenerateResponse,
  systemScope,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { BrainProjects, ProjectFault, ProjectRecord } from './projects.ts'

/** A kept diagram: its model, the commit it was made from and the time of the run. */
export type KeptDiagram = { readonly model: ArchitectureModel; readonly commit: string; readonly generatedAt: string }
type ScopeKey = { readonly slug: ProjectSlug; readonly scope: ArchitectureScope }

/** The kept diagram of each scope, across restarts. A missing or bad one loads as null, never a fault. */
export type ArchitectureStore = {
  load(key: ScopeKey): Promise<KeptDiagram | null>
  save(key: ScopeKey, kept: KeptDiagram): Promise<Result<void, ProjectFault>>
  /** Removes the diagram of each scope that `keep` does not name. */
  prune(keep: readonly ScopeKey[]): Promise<Result<void, ProjectFault>>
}

/** Makes one scope's diagram from the code: the model as the runner read it, and the commit it read. */
export type ArchitectureRunner = {
  run(
    input: ScopeKey & { readonly repositories: readonly ProjectRepository[] },
  ): Promise<Result<{ readonly model: ArchitectureModel; readonly commit: string }, ProjectFault>>
}

type NotFound = 'notFound'
export type Architecture = {
  scopes(slug: ProjectSlug): Promise<Result<ArchitectureResponse | NotFound, ProjectFault>>
  scope(
    slug: ProjectSlug,
    scope: ArchitectureScope,
  ): Promise<Result<ArchitectureScopeResponse | NotFound, ProjectFault>>
  regenerate(
    slug: ProjectSlug,
    scope: ArchitectureScope,
  ): Promise<Result<RegenerateResponse | NotFound | 'busy', ProjectFault>>
  /** Calls `onChange` at the end of each run, good or failed. */
  watch(onChange: (key: ScopeKey) => void): () => void
  /** Resolves when no run goes. */
  idle(): Promise<void>
}

const hexCommit = /^[0-9a-f]{40}$/

/** `text` with each control character made a space: a runner reads names from the code. */
function cleanText(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    out += code < 32 || code === 127 ? ' ' : ch
  }
  return out
}

/** The model with each text cleaned, before the contract checks it. */
function cleanModel(model: ArchitectureModel): ArchitectureModel {
  return {
    ...model,
    parts: model.parts.map((p) => ({ ...p, name: cleanText(p.name), typeLine: cleanText(p.typeLine) })),
    boundaries: model.boundaries.map((b) => ({ ...b, label: cleanText(b.label) })),
    arrows: model.arrows.map((a) => ({ ...a, label: cleanText(a.label) })),
    stack: model.stack.map((g) => ({ name: cleanText(g.name), badges: g.badges.map(cleanText) })),
  }
}

const scopesOf = (project: ProjectRecord): ArchitectureScope[] => [
  systemScope,
  ...project.repositories.map((r) => r.id),
]
const titleOf = (scope: ArchitectureScope) => (scope === systemScope ? 'How the system works' : `How ${scope} works`)
const keyOf = ({ slug, scope }: ScopeKey) => `${slug} ${scope}`

export function createArchitecture({
  brain,
  store,
  runner,
  log = () => undefined,
  now = () => new Date(),
}: {
  readonly brain: BrainProjects
  readonly store: ArchitectureStore
  readonly runner: ArchitectureRunner
  readonly log?: (fault: { readonly code: string }) => void
  readonly now?: () => Date
}): Architecture {
  let current: { readonly key: string; readonly done: Promise<void> } | null = null
  const watchers = new Set<(key: ScopeKey) => void>()

  const project = async (slug: ProjectSlug): Promise<Result<ProjectRecord | NotFound, ProjectFault>> => {
    const listed = await brain.list()
    if (!listed.ok) return listed
    return ok(listed.value.find((p) => p.slug === slug) ?? 'notFound')
  }

  const stateOf = async (
    key: ScopeKey,
  ): Promise<{ state: ArchitectureScopeState; model: ArchitectureModel | null }> => {
    const kept = await store.load(key)
    return {
      state: {
        scope: key.scope,
        title: titleOf(key.scope),
        commit: kept?.commit ?? null,
        generatedAt: kept?.generatedAt ?? null,
        // A1b compares the commit with the snapshot of main; until then a diagram is never stale.
        stale: false,
        running: current?.key === keyOf(key),
      },
      model: kept?.model ?? null,
    }
  }

  const runOnce = async (key: ScopeKey, repositories: readonly ProjectRepository[]) => {
    const ran = await runner.run({ ...key, repositories })
    if (!ran.ok) {
      log({ code: ran.error.code })
      return
    }
    const model = ArchitectureModel.safeParse(cleanModel(ran.value.model))
    if (!model.success) {
      log({ code: 'bad-model' })
      return
    }
    if (!hexCommit.test(ran.value.commit)) {
      log({ code: 'bad-commit' })
      return
    }
    const saved = await store.save(key, {
      model: model.data,
      commit: ran.value.commit,
      generatedAt: now().toISOString(),
    })
    if (!saved.ok) {
      log({ code: saved.error.code })
      return
    }
    // Prune only after a list read that succeeded, so a brain fault never removes a diagram.
    const listed = await brain.list()
    if (!listed.ok) {
      log({ code: listed.error.code })
      return
    }
    const pruned = await store.prune(listed.value.flatMap((p) => scopesOf(p).map((scope) => ({ slug: p.slug, scope }))))
    if (!pruned.ok) log({ code: pruned.error.code })
  }

  return {
    async scopes(slug) {
      const found = await project(slug)
      if (!found.ok) return err(found.error)
      if (found.value === 'notFound') return ok('notFound')
      const states = await Promise.all(
        scopesOf(found.value).map(async (scope) => (await stateOf({ slug, scope })).state),
      )
      return ok({ scopes: states })
    },
    async scope(slug, scope) {
      const found = await project(slug)
      if (!found.ok) return err(found.error)
      if (found.value === 'notFound') return ok('notFound')
      if (!scopesOf(found.value).includes(scope)) return ok('notFound')
      return ok(await stateOf({ slug, scope }))
    },
    async regenerate(slug, scope) {
      const found = await project(slug)
      if (!found.ok) return err(found.error)
      if (found.value === 'notFound') return ok('notFound')
      if (!scopesOf(found.value).includes(scope)) return ok('notFound')
      const key = { slug, scope }
      // No await between this check of `current` and its set below, so two regenerates that cross cannot both start.
      if (current !== null && current.key !== keyOf(key)) return ok('busy')
      if (current === null) {
        const repositories = found.value.repositories
        const done = runOnce(key, repositories)
          .catch(() => {
            log({ code: 'threw' })
          })
          .finally(() => {
            current = null
            for (const watcher of watchers)
              try {
                watcher(key)
              } catch {
                // A watcher that throws must not reject the run, which only idle() awaits.
                log({ code: 'watcher' })
              }
          })
        current = { key: keyOf(key), done }
      }
      return ok({ state: (await stateOf(key)).state })
    },
    watch(onChange) {
      watchers.add(onChange)
      return () => watchers.delete(onChange)
    },
    idle: async () => {
      await current?.done
    },
  }
}

/** The service of an app with none: each read fails, so each route answers 500. */
export const noArchitecture: Architecture = (() => {
  const fault = () => Promise.resolve(err({ reason: 'failed' as const, code: 'no-store' }))
  return { scopes: fault, scope: fault, regenerate: fault, watch: () => () => undefined, idle: () => Promise.resolve() }
})()
