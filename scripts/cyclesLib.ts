// Pure functions for checkCycles.ts, ported from component-library-1701, so cycles.test.ts can test them:
// read the runtime imports of a file, build the import graph of a folder,
// and find the cycles in it (brain decision d-071).
import { globSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'

/**
 * What a file imports at runtime: the module names of static imports,
 * re-exports and dynamic imports, and the patterns of each
 * `import.meta.glob` call, which Vite turns into imports of each matching
 * file. `import type` and `export type` are left out, because TypeScript
 * erases them, so they cannot make a cycle when the code runs.
 *
 * An import the check cannot follow is listed in `unsupported`, with its
 * line: a dynamic import of a computed name, or a glob with a computed
 * pattern, an extglob such as `@(b)`, or any option but `eager` (`base`, `query`, `import` and
 * the rest change what Vite loads). Each one fails the check.
 */
export function runtimeImports(
  fileName: string,
  text: string,
): { modules: string[]; globs: string[][]; unsupported: string[] } {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true)
  const modules: string[] = []
  const globs: string[][] = []
  const unsupported: string[] = []
  const unwrap = (node: ts.Expression): ts.Expression =>
    ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node
  // The string literals of a name or a list of names, or undefined when any part is computed.
  const strings = (node: ts.Expression | undefined): string[] | undefined => {
    if (node === undefined) return undefined
    const n = unwrap(node)
    if (ts.isStringLiteralLike(n)) return [n.text]
    if (!ts.isArrayLiteralExpression(n)) return undefined
    const parts = n.elements.map((e) => strings(e))
    return parts.every((x) => x !== undefined) ? parts.flat() : undefined
  }
  const onlyEager = (node: ts.Expression | undefined): boolean => {
    if (node === undefined) return true
    const n = unwrap(node)
    return (
      ts.isObjectLiteralExpression(n) &&
      n.properties.every(
        (p) =>
          ts.isPropertyAssignment(p) &&
          p.name.getText(source) === 'eager' &&
          (p.initializer.kind === ts.SyntaxKind.TrueKeyword || p.initializer.kind === ts.SyntaxKind.FalseKeyword),
      )
    )
  }
  // import.meta.glob by its syntax tree, so spaces or comments in the callee do not hide it.
  const isMetaGlob = (e: ts.Expression): boolean => {
    const n = unwrap(e)
    return (
      ts.isPropertyAccessExpression(n) &&
      n.name.text === 'glob' &&
      ts.isMetaProperty(n.expression) &&
      n.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
      n.expression.name.text === 'meta'
    )
  }
  const where = (node: ts.Node) =>
    `${fileName}:${String(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1)}: ${node.getText(source)}`
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause?.phaseModifier !== ts.SyntaxKind.TypeKeyword &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      modules.push(node.moduleSpecifier.text)
    } else if (
      ts.isExportDeclaration(node) &&
      !node.isTypeOnly &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      modules.push(node.moduleSpecifier.text)
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const names = strings(node.arguments[0])
      if (names?.length === 1) modules.push(...names)
      else unsupported.push(where(node))
    } else if (ts.isCallExpression(node) && isMetaGlob(node.expression)) {
      const patterns = strings(node.arguments[0])
      // Node's globSync reads extglobs such as @(b) and Vite does not, so such a pattern cannot be followed.
      const plain = patterns?.every((g) => !/[@!+?*]\(/.test(g.replace(/^!/, '')))
      if (patterns !== undefined && plain === true && node.arguments.length <= 2 && onlyEager(node.arguments[1]))
        globs.push(patterns)
      else unsupported.push(where(node))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return { modules, globs, unsupported }
}

/**
 * The files one `import.meta.glob` call matches. A pattern that starts
 * with `/` is relative to root, as in Vite; one that starts with `!`
 * removes matches of the same call only. The file itself is never a
 * target, because Vite leaves the importing file out of its own glob.
 */
export function globTargets(file: string, patterns: readonly string[], root: string): string[] {
  const base = (p: string) => (p.startsWith('/') ? root : dirname(file))
  const rel = (p: string) => (p.startsWith('/') ? `.${p}` : p)
  const match = (p: string) => globSync(rel(p), { cwd: base(p) }).map((f) => resolve(base(p), f))
  const removed = new Set(patterns.filter((g) => g.startsWith('!')).flatMap((g) => match(g.slice(1))))
  return patterns
    .filter((g) => !g.startsWith('!'))
    .flatMap(match)
    .filter((f) => !removed.has(f) && f !== file)
}

/** Every .ts and .tsx file under dir, except declaration files. */
export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.d.ts'))
    .map((f) => join(dir, f))
    .sort()
}

/**
 * The import graph of the files: each file maps to the files in the same
 * set that it imports at runtime, glob matches included, and the imports
 * the check cannot follow. Imports that
 * resolve outside the set,
 * such as packages and generated code, are left out.
 */
export function importGraph(
  files: readonly string[],
  options: ts.CompilerOptions,
  root: string,
): { graph: Map<string, string[]>; unsupported: string[] } {
  const set = new Set(files)
  const graph = new Map<string, string[]>()
  const unsupported: string[] = []
  for (const file of files) {
    const found = runtimeImports(file, readFileSync(file, 'utf8'))
    unsupported.push(...found.unsupported)
    const targets = [
      ...found.modules.map(
        (spec) => ts.resolveModuleName(spec, file, options, ts.sys).resolvedModule?.resolvedFileName,
      ),
      ...found.globs.flatMap((g) => globTargets(file, g, root)),
    ].filter((t): t is string => t !== undefined && set.has(t))
    graph.set(file, [...new Set(targets)])
  }
  return { graph, unsupported }
}

/**
 * The cycles of a graph: each strongly connected component with more than
 * one file, or one file that imports itself (Tarjan's algorithm). Each
 * cycle lists its files sorted, and the cycles are sorted by first file.
 */
export function findCycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  let next = 0
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const cycles: string[][] = []
  const connect = (v: string) => {
    index.set(v, next)
    low.set(v, next)
    next += 1
    stack.push(v)
    onStack.add(v)
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        connect(w)
        low.set(v, Math.min(low.get(v) ?? 0, low.get(w) ?? 0))
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v) ?? 0, index.get(w) ?? 0))
      }
    }
    if (low.get(v) !== index.get(v)) return
    const component: string[] = []
    let w: string | undefined
    do {
      w = stack.pop()
      if (w === undefined) break
      onStack.delete(w)
      component.push(w)
    } while (w !== v)
    if (component.length > 1 || (graph.get(v) ?? []).includes(v)) cycles.push(component.sort())
  }
  for (const v of graph.keys()) if (!index.has(v)) connect(v)
  return cycles.sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''))
}

/**
 * Checks web/src and shared/src of the repository at repoRoot. A glob that
 * starts with `/` is resolved from web/, the Vite root, as Vite does.
 */
export function checkRepo(repoRoot: string): {
  ok: boolean
  files: number
  edges: number
  cycles: string[][]
  unsupported: string[]
} {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(repoRoot, 'web', 'tsconfig.json'),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  )
  const files = [...sourceFiles(join(repoRoot, 'web', 'src')), ...sourceFiles(join(repoRoot, 'shared', 'src'))]
  const { graph, unsupported } = importGraph(files, config?.options ?? {}, join(repoRoot, 'web'))
  const cycles = findCycles(graph).map((c) => c.map((f) => relative(repoRoot, f)))
  const edges = [...graph.values()].reduce((n, t) => n + t.length, 0)
  return {
    ok: cycles.length === 0 && unsupported.length === 0,
    files: graph.size,
    edges,
    cycles,
    unsupported: unsupported.map((u) => relative(repoRoot, u)),
  }
}
