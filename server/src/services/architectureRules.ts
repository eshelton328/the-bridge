// The first rules of a repository's diagram (f-008 increment two, A1b): its
// packages and its Stack from the tracked package.json files. It reads file
// text as data: a file that is not a JSON object is skipped, a key is read
// with Object.hasOwn and Object.entries only, and "__proto__" is skipped. A
// name is file text, so it is cut at the contract's caps; the service cleans
// control characters and checks the model. Parts and arrows are sorted by
// path and cut at the caps in that order, so one commit gives one model.
// Two packages can have one name: an arrow to that name goes to the first
// part of it in path order.
// No import but types: the worker of the reader runs it.
import type { ArchitectureArrow, ArchitectureModel, ArchitecturePart, StackGroup } from '@bridge/contract'

/** A tracked file's path from the repository root and its text. */
export type RuleFile = { readonly path: string; readonly text: string }

/** The contract's caps (contract/src/architecture.ts), here so the worker imports nothing. */
const caps = { text: 200, badge: 100, parts: 200, arrows: 400, badges: 50 }

type Manifest = {
  readonly folder: string
  readonly name: string
  readonly dependencies: readonly (readonly [string, string])[]
  readonly devDependencies: readonly (readonly [string, string])[]
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The string entries of one dependency key, with no "__proto__". */
function depsOf(pkg: Record<string, unknown>, key: string): (readonly [string, string])[] {
  if (!Object.hasOwn(pkg, key)) return []
  const deps = pkg[key]
  if (!isObject(deps)) return []
  return Object.entries(deps).flatMap(([name, spec]) =>
    name !== '__proto__' && name !== '' && typeof spec === 'string' ? [[name, spec] as const] : [],
  )
}

/** The folder of a package.json from the repository root: "." for the root one. */
const folderOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.')

function manifestOf(file: RuleFile): Manifest | null {
  let pkg: unknown
  try {
    pkg = JSON.parse(file.text)
  } catch {
    return null
  }
  if (!isObject(pkg)) return null
  const folder = folderOf(file.path)
  const named = Object.hasOwn(pkg, 'name') && typeof pkg.name === 'string' && pkg.name !== '' ? pkg.name : folder
  return {
    folder,
    name: named.slice(0, caps.text),
    dependencies: depsOf(pkg, 'dependencies'),
    devDependencies: depsOf(pkg, 'devDependencies'),
  }
}

const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** The model of a repository's package.json files, or null when it has none. */
export function modelOf(files: readonly RuleFile[]): ArchitectureModel | null {
  const manifests = [...files]
    .filter((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))
    .sort((a, b) => byPath(a.path, b.path))
    .flatMap((f) => manifestOf(f) ?? [])
    .slice(0, caps.parts)
  if (manifests.length === 0) return null
  const ids = new Map<string, string>()
  const parts: ArchitecturePart[] = manifests.map((m, i) => {
    const id = `p${String(i)}`
    if (!ids.has(m.name)) ids.set(m.name, id)
    return { id, name: m.name, shape: 'package', ours: true, typeLine: m.folder.slice(0, caps.text) }
  })
  const inside = (spec: string) => spec.startsWith('workspace:')
  const arrows: ArchitectureArrow[] = []
  const seen = new Set<string>()
  manifests.forEach((m, i) => {
    const deps = [...m.dependencies, ...m.devDependencies].filter(([, spec]) => inside(spec))
    for (const [name] of [...deps].sort((a, b) => byPath(a[0], b[0]))) {
      const to = ids.get(name)
      const from = `p${String(i)}`
      if (to === undefined || to === from || seen.has(`${from} ${to}`)) continue
      seen.add(`${from} ${to}`)
      arrows.push({ from, to, label: 'depends on' })
    }
  })
  const badges = (pick: (m: Manifest) => readonly (readonly [string, string])[]) =>
    [...new Set(manifests.flatMap((m) => pick(m).flatMap(([name, spec]) => (inside(spec) ? [] : [name]))))]
      .sort(byPath)
      .slice(0, caps.badges)
      .map((name) => name.slice(0, caps.badge))
  const stack: StackGroup[] = [
    { name: 'Runtime', badges: badges((m) => m.dependencies) },
    { name: 'Build', badges: badges((m) => m.devDependencies) },
  ].filter((g) => g.badges.length > 0)
  return { view: 'component', parts, boundaries: [], arrows: arrows.slice(0, caps.arrows), stack }
}
