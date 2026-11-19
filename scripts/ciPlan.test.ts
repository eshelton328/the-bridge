// Tests for ciPlan.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fidelityImports, isFidelityInput } from './ciPlan.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const readRepo = (path: string): string | undefined => {
  try {
    return readFileSync(root + path, 'utf8')
  } catch {
    return undefined
  }
}
const starts = readdirSync(root + 'scripts/fidelity')
  .filter((name) => name.endsWith('.ts'))
  .map((name) => `scripts/fidelity/${name}`)

void test('the import walk follows relative imports at any depth, and leaves out scripts/fidelity/', () => {
  const files: Record<string, string> = {
    'scripts/fidelity/a.ts': "import { b } from '../b.ts'\nimport './c.ts'",
    'scripts/fidelity/c.ts': "export const c = await import('../d.ts')",
    'scripts/b.ts': "import { e } from './e.ts'",
    'scripts/d.ts': '',
    'scripts/e.ts': "import { z } from 'zod'",
  }
  assert.deepEqual([...fidelityImports((p) => files[p], ['scripts/fidelity/a.ts'])].sort(), [
    'scripts/b.ts',
    'scripts/d.ts',
    'scripts/e.ts',
  ])
})

void test('in this repo the fidelity scripts import genRegistry.ts, and it is an input', () => {
  const imports = fidelityImports(readRepo, starts)
  assert.ok(imports.has('scripts/genRegistry.ts'))
  for (const path of imports) assert.equal(isFidelityInput(path, imports), true, path)
})

void test('web, references, fidelity, shared, config, lockfile and workflow files are inputs', () => {
  const imports = fidelityImports(readRepo, starts)
  for (const path of [
    'web/src/app/InboxRoute.tsx',
    'web/AGENTS.md',
    'references/inbox/D01/frame.json',
    'references/AGENTS.md',
    'scripts/fidelity/checkIcons.ts',
    'scripts/fidelity/AGENTS.md',
    'shared/src/result.ts',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.base.json',
    '.github/workflows/ci.yml',
    '.github/actions/setup/action.yml',
    'newfolder/anything.ts',
  ])
    assert.equal(isFidelityInput(path, imports), true, path)
})

void test('Markdown outside web/ and references/ and scripts the fidelity job does not import are not inputs', () => {
  const imports = fidelityImports(readRepo, starts)
  for (const path of [
    'README.md',
    'AGENTS.md',
    'shared/AGENTS.md',
    'scripts/AGENTS.md',
    'scripts/testShardTimes.json',
    'scripts/checkCi.ts',
    'scripts/ciPlan.ts',
  ])
    assert.equal(isFidelityInput(path, imports), false, path)
})
