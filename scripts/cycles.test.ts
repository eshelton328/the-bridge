// Tests for scripts/cyclesLib.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'
import { findCycles, importGraph, runtimeImports, sourceFiles } from './cyclesLib.ts'

void test('reads static imports, re-exports and dynamic imports', () => {
  const text =
    "import { a } from './a'\nexport { b } from './b'\nexport * from './c'\nconst d = () => import('./d')\nimport './e'"
  assert.deepEqual(runtimeImports('x.ts', text), {
    modules: ['./a', './b', './c', './d', './e'],
    globs: [],
    unsupported: [],
  })
})

void test('leaves out type-only imports and re-exports', () => {
  const text = "import type { A } from './a'\nexport type { B } from './b'\nimport { type C, d } from './c'"
  assert.deepEqual(runtimeImports('x.ts', text), { modules: ['./c'], globs: [], unsupported: [] })
})

void test('finds no cycle in a tree', () => {
  assert.deepEqual(
    findCycles(
      new Map([
        ['a', ['b', 'c']],
        ['b', ['c']],
        ['c', []],
      ]),
    ),
    [],
  )
})

void test('finds a two-file and a three-file cycle', () => {
  const graph = new Map([
    ['a', ['b']],
    ['b', ['a']],
    ['c', ['d']],
    ['d', ['e']],
    ['e', ['c']],
    ['f', ['a']],
  ])
  assert.deepEqual(findCycles(graph), [
    ['a', 'b'],
    ['c', 'd', 'e'],
  ])
})

void test('finds a file that imports itself', () => {
  assert.deepEqual(findCycles(new Map([['a', ['a']]])), [['a']])
})

void test('builds the graph from files on disk and finds their cycle', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cycles-'))
  try {
    mkdirSync(join(dir, 'shell'))
    writeFileSync(
      join(dir, 'shell', 'app-frame.tsx'),
      "import { NavRail } from './nav-rail'\nexport const AppFrame = NavRail\n",
    )
    writeFileSync(
      join(dir, 'shell', 'nav-rail.tsx'),
      "import { AppFrame } from './app-frame'\nexport const NavRail = () => AppFrame\n",
    )
    writeFileSync(
      join(dir, 'shell', 'header.tsx'),
      "import type { AppFrame } from './app-frame'\nimport { NavRail } from './nav-rail'\nexport type H = typeof AppFrame\nexport const Header = NavRail\n",
    )
    const options = {
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
    }
    const cycles = findCycles(importGraph(sourceFiles(dir), options, dir).graph)
    assert.deepEqual(cycles, [[join(dir, 'shell', 'app-frame.tsx'), join(dir, 'shell', 'nav-rail.tsx')]])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

void test('reads import.meta.glob patterns, also in a list', () => {
  const text =
    "const a = import.meta.glob('./b.ts', { eager: true })\nconst c = import.meta.glob(['./c/*.ts', '!./c/skip.ts'])"
  assert.deepEqual(runtimeImports('x.ts', text), {
    modules: [],
    globs: [['./b.ts'], ['./c/*.ts', '!./c/skip.ts']],
    unsupported: [],
  })
})

void test('an eager glob that closes a loop is a cycle (Codex review of #13)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cycles-'))
  try {
    mkdirSync(join(dir, 'shell'))
    writeFileSync(
      join(dir, 'shell', 'a.ts'),
      "export const a = 1\nexport const modules = import.meta.glob('./b.ts', { eager: true })\n",
    )
    writeFileSync(join(dir, 'shell', 'b.ts'), "import { a } from './a'\nexport const b = a\n")
    writeFileSync(
      join(dir, 'shell', 'c.ts'),
      "export const all = import.meta.glob(['/shell/*.ts', '!/shell/a.ts', '!/shell/b.ts'])\n",
    )
    const options = { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler }
    const { graph } = importGraph(sourceFiles(dir), options, dir)
    assert.deepEqual(findCycles(graph), [[join(dir, 'shell', 'a.ts'), join(dir, 'shell', 'b.ts')]])
    // c.ts matches itself, a.ts and b.ts; the negations and the self-match leave nothing.
    assert.deepEqual(graph.get(join(dir, 'shell', 'c.ts')), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

void test('lists the imports the check cannot follow (Codex review of #13)', () => {
  const text = [
    "const a = import(('./a'))",
    'const b = import(name)',
    "const c = import.meta.glob('./c.ts', { eager: true, query: '?raw' })",
    "const d = import.meta.glob('./d.ts', { base: '/src' })",
    'const e = import.meta.glob(pattern)',
    "const f = import.meta.glob(('./f.ts'), { eager: false })",
    "const g = import.meta .glob(['./*.ts', '!./@(b).ts'])",
  ].join('\n')
  const found = runtimeImports('x.ts', text)
  assert.deepEqual(found.modules, ['./a'])
  assert.deepEqual(found.globs, [['./f.ts']])
  assert.deepEqual(
    found.unsupported.map((u) => u.split(':')[1]),
    ['2', '3', '4', '5', '7'],
  )
})

void test('an exclusion applies only to its own glob call (Codex review of #13)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cycles-'))
  try {
    mkdirSync(join(dir, 'shell'))
    writeFileSync(
      join(dir, 'shell', 'a.ts'),
      "export const first = import.meta.glob('./b.ts', { eager: true })\nexport const second = import.meta.glob(['./*.ts', '!./b.ts'], { eager: true })\n",
    )
    writeFileSync(join(dir, 'shell', 'b.ts'), "import { first } from './a'\nexport const b = first\n")
    const options = { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler }
    assert.deepEqual(findCycles(importGraph(sourceFiles(dir), options, dir).graph), [
      [join(dir, 'shell', 'a.ts'), join(dir, 'shell', 'b.ts')],
    ])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
