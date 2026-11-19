// Proof that the config gates of the type-safety audit (engine
// projects/ncc-1701/ideas/type-safety-errors-and-observability-audit.md,
// G-1 to G-3) catch a planted case: each test lints or builds planted code
// with the repository's own config and expects the gate to fail it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const root = fileURLToPath(new URL('..', import.meta.url))

// The rule IDs the repository's ESLint config reports for this code. The
// typed rules need a file the TypeScript project includes, so the code is
// written to shared/src for the run and removed after it.
async function ruleIds(code: string): Promise<string[]> {
  const path = join(root, 'shared/src', `plantedGate${String(process.pid)}.ts`)
  writeFileSync(path, code)
  try {
    const [result] = await new ESLint({ cwd: root }).lintFiles([path])
    return (result?.messages ?? []).map((message) => message.ruleId ?? message.message)
  } finally {
    rmSync(path, { force: true })
  }
}

void test('G-1: a default after every member of a union is handled fails the lint', async () => {
  const code = [
    "export function size(kind: 'a' | 'b'): number {",
    '  switch (kind) {',
    "    case 'a':",
    '      return 1',
    "    case 'b':",
    '      return 2',
    '    default:',
    '      return 3',
    '  }',
    '}',
    '',
  ].join('\n')
  assert.deepEqual(await ruleIds(code), ['@typescript-eslint/switch-exhaustiveness-check'])
})

void test('G-2: the lint never asks for a non-null assertion, which no-non-null-assertion bans', async () => {
  const code = [
    'export function first(m: Map<string, number>): number {',
    "  return m.get('a') as number",
    '}',
    '',
  ].join('\n')
  const ids = await ruleIds(code)
  assert.ok(!ids.includes('@typescript-eslint/non-nullable-type-assertion-style'), ids.join(', '))
  assert.deepEqual(ids, ['@typescript-eslint/no-unsafe-type-assertion'])
})

void test('G-3: a token reference that does not exist fails panda codegen and cssgen', () => {
  const name = `plantedGate${String(process.pid)}.config.ts`
  const path = join(root, 'web', name)
  writeFileSync(
    path,
    [
      "import base from './panda.config.ts'",
      'export default {',
      '  ...base,',
      "  theme: { extend: { semanticTokens: { colors: { plantedGate: { value: '{colors.no.such.token}' } } } } },",
      '}',
      '',
    ].join('\n'),
  )
  try {
    for (const args of [
      ['codegen', '--config', name, '--dry-run'],
      ['cssgen', '--config', name, '--max-warnings', '0', '--outfile', join('styled-system', `${name}.css`)],
    ]) {
      const run = spawnSync(join(root, 'web/node_modules/.bin/panda'), args, {
        cwd: join(root, 'web'),
        encoding: 'utf8',
      })
      assert.notEqual(run.status, 0, `panda ${args.join(' ')} passed: ${run.stdout}${run.stderr}`)
      assert.match(run.stdout + run.stderr, /config_token_missing_reference/)
    }
  } finally {
    rmSync(path, { force: true })
    rmSync(join(root, 'web/styled-system', `${name}.css`), { force: true })
  }
})
