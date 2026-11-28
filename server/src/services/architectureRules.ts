// The first rules of a repository's diagram (f-008 increment two, A1b): its
// packages and its Stack from the tracked package.json files. It reads file
// text as data: a file that is not a JSON object is skipped, a key is read
// with Object.hasOwn and Object.entries only, and "__proto__" is skipped. A
// name is file text, so it is cut at the contract's caps; the service cleans
// control characters and checks the model. Parts and arrows are sorted by
// path and cut at the caps in that order, so one commit gives one model.
// Two packages can have one name: an arrow to that name goes to the first
// part of it in path order. A pnpm alias ("x": "workspace:foo@*") points at
// foo.
// A workspace (a root package.json and others) is a component view (B2a, frame
// 230:2): the root is the repository's boundary, not a part, and each other
// package is a part named by its folder ("web/"), with a type line of its kind
// and frameworks, read from its runtime dependencies. A dependency on another
// repository of the project is a package part outside the boundary, and one of
// `services` is an outer system. A package with a `src/adapters` folder is a
// part for each of its layer folders, and each adapter file whose name starts
// with a word of `systems` adds that outer system. The worker gets the tracked
// paths for these folder rules. The Stack has a group for each package.
// No import but types: the worker of the reader runs it.
import type { ArchitectureArrow, ArchitectureModel, ArchitecturePart, StackGroup } from '@bridge/contract'

/** A tracked file's path from the repository root and its text. */
export type RuleFile = { readonly path: string; readonly text: string }

/** A part's kind and shape by a runtime dependency that shows it, the first match in this order; "Library" else. */
const kinds = [
  { dep: 'react-dom', kind: 'Web app', shape: 'webApp' },
  { dep: 'hono', kind: 'Server', shape: 'service' },
] as const
/** The frameworks a type line names by a runtime dependency (a name, or a prefix that ends in "/"), at most two. */
const frameworks = [
  ['react', 'React'],
  ['@tanstack/', 'TanStack'],
  ['hono', 'Hono'],
  ['@hono/node-server', 'Node'],
  ['zod', 'Zod'],
] as const
/**
 * The layers of a package that has a `src/adapters` folder (d-110: routes call
 * services, services reach the outside through adapters), in call order.
 */
const layers = [
  ['routes', 'Routes'],
  ['services', 'Services'],
  ['adapters', 'Adapters'],
] as const
/** The outer systems an adapter file names by the first word of its file name ("herdrSocket.ts"). */
const systems = [
  { word: 'herdr', name: 'herdr', shape: 'terminalApp', typeLine: 'Terminal app' },
  { word: 'claude', name: 'Claude Code', shape: 'folder', typeLine: 'Session files' },
  { word: 'disk', name: 'Disk stores', shape: 'dataStore', typeLine: 'Data store' },
  { word: 'gh', name: 'GitHub', shape: 'service', typeLine: 'External · gh' },
  { word: 'linear', name: 'Linear', shape: 'service', typeLine: 'External · Linear API' },
] as const
/** The outer systems a runtime dependency calls. */
const services = [
  { dep: 'web-push', name: 'Web Push service', shape: 'service', typeLine: 'External · web-push' },
] as const

/** What the rules know besides the package.json files: the project's other repositories and the tracked paths. */
export type RuleContext = { readonly others: readonly string[]; readonly paths: readonly string[] }

/** The contract's caps (contract/src/architecture.ts), here so the worker imports nothing. */
const caps = { text: 200, badge: 100, parts: 200, arrows: 400, badges: 50, groups: 20 }

type Manifest = {
  readonly folder: string
  /** The full name, for the arrows; a part shows it cut at the text cap. */
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
    name: named,
    dependencies: depsOf(pkg, 'dependencies'),
    devDependencies: depsOf(pkg, 'devDependencies'),
  }
}

const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const has = (deps: readonly (readonly [string, string])[], dep: string) =>
  deps.some(([name]) => (dep.endsWith('/') ? name.startsWith(dep) : name === dep))

/** The word an adapter file's name starts with, for a file that is not a test, a fake, a stub or a contract suite. */
function adapterWord(name: string): string | null {
  if (!name.endsWith('.ts') || name.endsWith('.test.ts') || name.endsWith('Contract.ts')) return null
  if (name.startsWith('fake') || name.startsWith('stub')) return null
  return /^[a-z]+/.exec(name)?.[0] ?? null
}

/** A workspace package's parts: one in the root's boundary, or one for each layer folder it has. */
function packageParts(m: Manifest, i: number, paths: ReadonlySet<string>): ArchitecturePart[] {
  const deps = m.dependencies
  const found = kinds.find((k) => has(deps, k.dep))
  const names = frameworks.flatMap(([dep, label]) => (has(deps, dep) ? [label] : [])).slice(0, 2)
  const line = (kind: string, withNames: boolean) =>
    (withNames && names.length > 0 ? `${kind} · ${names.join(', ')}` : kind).slice(0, caps.text)
  const base = { ours: true, boundary: 'b0' }
  if (paths.has(`${m.folder}/src/adapters`)) {
    return layers
      .filter(([folder]) => paths.has(`${m.folder}/src/${folder}`))
      .map(([folder, label], n) => ({
        ...base,
        id: `p${String(i)}.${folder}`,
        name: `${m.folder}/${folder}`.slice(0, caps.text),
        shape: 'service',
        typeLine: line(label, n === 0),
      }))
  }
  const kind = found?.kind ?? 'Library'
  const shape = found?.shape ?? 'service'
  return [{ ...base, id: `p${String(i)}`, name: `${m.folder}/`.slice(0, caps.text), shape, typeLine: line(kind, true) }]
}

/** A workspace's component view: the root as the boundary, the packages, other repositories and outer systems. */
function workspaceModel(root: Manifest, packages: readonly Manifest[], context: RuleContext): ArchitectureModel {
  // The folders that hold a tracked file, and the file names of each package's adapters.
  const folders = new Set<string>()
  for (const path of context.paths) {
    for (let at = path.indexOf('/'); at > 0; at = path.indexOf('/', at + 1)) folders.add(path.slice(0, at))
  }
  const perPackage = packages.map((m, i) => packageParts(m, i, folders))
  const ids = new Map<string, readonly ArchitecturePart[]>()
  packages.forEach((m, i) => {
    if (!ids.has(m.name)) ids.set(m.name, perPackage[i] ?? [])
  })
  const arrows: ArchitectureArrow[] = []
  const seen = new Set<string>()
  const arrow = (from: string, to: string, label: string) => {
    if (from === to || seen.has(`${from} ${to}`)) return
    seen.add(`${from} ${to}`)
    arrows.push({ from, to, label })
  }
  const outer: ArchitecturePart[] = []
  const outerPart = (key: string, part: Omit<ArchitecturePart, 'id'>) => {
    const known = outer.find((p) => p.id === key)
    if (known !== undefined) return known
    const made = { ...part, id: key }
    outer.push(made)
    return made
  }
  packages.forEach((m, i) => {
    const own = perPackage[i] ?? []
    const first = own[0]
    const last = own[own.length - 1]
    if (first === undefined || last === undefined) return
    own.slice(1).forEach((part, n) => {
      const before = own[n]
      if (before !== undefined) arrow(before.id, part.id, 'calls')
    })
    for (const [name, spec] of [...m.dependencies, ...m.devDependencies].sort((a, b) => byPath(a[0], b[0]))) {
      if (spec.startsWith('workspace:')) {
        const to = ids.get(targetOf(name, spec))?.[0]
        if (to !== undefined) arrow(first.id, to.id, 'depends on')
        continue
      }
      // A scoped name ("@owner/<id>") counts too, so a package of another owner with a repository's name does as well.
      const repo = context.others.find((id) => name === id || name.endsWith(`/${id}`))
      if (repo !== undefined) {
        const to = outerPart(`repo.${repo}`, { name: repo, shape: 'package', ours: true, typeLine: 'npm package' })
        arrow(first.id, to.id, 'depends on')
      }
      const service = m.dependencies.some(([dep]) => dep === name) ? services.find((s) => s.dep === name) : undefined
      if (service !== undefined) {
        const { name: label, shape, typeLine } = service
        arrow(last.id, outerPart(`dep.${service.dep}`, { name: label, shape, ours: false, typeLine }).id, 'calls')
      }
    }
    if (!folders.has(`${m.folder}/src/adapters`)) return
    const words = new Set(
      context.paths.flatMap((path) => {
        const prefix = `${m.folder}/src/adapters/`
        const rest = path.startsWith(prefix) ? path.slice(prefix.length) : ''
        const word = rest.includes('/') ? null : adapterWord(rest)
        return word === null ? [] : [word]
      }),
    )
    for (const system of systems) {
      if (!words.has(system.word)) continue
      const { name, shape, typeLine } = system
      arrow(last.id, outerPart(`system.${system.word}`, { name, shape, ours: false, typeLine }).id, 'calls')
    }
  })
  const group = (name: string, deps: readonly (readonly [string, string])[]) => ({
    name: name.slice(0, caps.text),
    badges: [...new Set(deps.flatMap(([dep, spec]) => (spec.startsWith('workspace:') ? [] : [dep])))]
      .sort(byPath)
      .slice(0, caps.badges)
      .map((dep) => dep.slice(0, caps.badge)),
  })
  const title = (folder: string) => folder.charAt(0).toUpperCase() + folder.slice(1)
  const stack: StackGroup[] = [
    group('Runtime', root.dependencies),
    ...packages.map((m) => group(title(m.folder), m.dependencies)),
    group(
      'Build',
      [root, ...packages].flatMap((m) => m.devDependencies),
    ),
  ]
    .filter((g) => g.badges.length > 0)
    .slice(0, caps.groups)
  // A part past the cap takes its arrows with it, or the contract refuses the whole model.
  const kept = [...perPackage.flat(), ...outer].slice(0, caps.parts)
  const keptIds = new Set(kept.map((p) => p.id))
  return {
    view: 'component',
    parts: kept,
    boundaries: [{ id: 'b0', label: `${root.name} repository`.slice(0, caps.text), kind: 'repository' }],
    arrows: arrows.filter((a) => keptIds.has(a.from) && keptIds.has(a.to)).slice(0, caps.arrows),
    stack,
  }
}

/** The package a workspace dependency names: its key, or the target of an alias such as "workspace:foo@*". */
function targetOf(name: string, spec: string) {
  const rest = spec.slice('workspace:'.length)
  const at = rest.lastIndexOf('@')
  return at > 0 ? rest.slice(0, at) : name
}

/** The model of a repository's package.json files, or null when it has none. */
export function modelOf(
  files: readonly RuleFile[],
  context: RuleContext = { others: [], paths: [] },
): ArchitectureModel | null {
  const manifests = [...files]
    .filter((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))
    .sort((a, b) => byPath(a.path, b.path))
    .flatMap((f) => manifestOf(f) ?? [])
    .slice(0, caps.parts)
  if (manifests.length === 0) return null
  const root = manifests.find((m) => m.folder === '.')
  if (root !== undefined && manifests.length > 1)
    return workspaceModel(
      root,
      manifests.filter((m) => m !== root),
      context,
    )
  const ids = new Map<string, string>()
  const parts: ArchitecturePart[] = manifests.map((m, i) => {
    const id = `p${String(i)}`
    if (!ids.has(m.name)) ids.set(m.name, id)
    return {
      id,
      name: m.name.slice(0, caps.text),
      shape: 'package',
      ours: true,
      typeLine: m.folder.slice(0, caps.text),
    }
  })
  const inside = (spec: string) => spec.startsWith('workspace:')
  const arrows: ArchitectureArrow[] = []
  const seen = new Set<string>()
  manifests.forEach((m, i) => {
    const deps = [...m.dependencies, ...m.devDependencies].filter(([, spec]) => inside(spec))
    for (const [name, spec] of [...deps].sort((a, b) => byPath(a[0], b[0]))) {
      const to = ids.get(targetOf(name, spec))
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
