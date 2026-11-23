// Tests for reviewSeal.ts on a scratch git repository: a committed
// reviewer record passes only while the hash of its inputs is current and
// the record is the one the review saved. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  canonicalJson,
  checkReviews,
  checkSeal,
  importSpecifiers,
  inputsDigest,
  resolveImport,
  reviewInputs,
  sealReview,
} from './reviewSeal.ts'
import { referencesDir } from './references.ts'

const record = (findings: { priority: string }[] = []) => ({
  verdict: findings.length > 0 ? 'differences' : 'match',
  viewport: '1512x982 desktop',
  findings: findings.map((f, i) => ({ id: `F${String(i + 1)}`, kind: 'colour', region: 'mode switch', ...f })),
})

/** A scratch repo with the Settings D01 reference, a state that lists it and a pinned library. */
function scratch(t: { after: (fn: () => void) => void }) {
  const root = mkdtempSync(join(tmpdir(), 'review-seal-'))
  t.after(() => {
    rmSync(root, { recursive: true, force: true })
  })
  cpSync(join(referencesDir, 'settings', 'D01'), join(root, 'references', 'settings', 'D01'), { recursive: true })
  const write = (path: string, text: string) => {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  write('pnpm-workspace.yaml', 'catalog:\n  "@eshelton328/component-library-1701": 1.0.0-beta.105\n')
  write('web/src/pages/settings/states/desktopDark.ts', "export const desktopDark = { id: 'D1' }\n")
  write(
    'web/src/pages/settings/screens/SettingsScreen.stories.tsx',
    "import { Frame } from '../../../blocks/Frame.tsx'\nexport const DesktopDark = { render: Frame }\n",
  )
  write(
    'web/src/blocks/Frame.tsx',
    "import { rail } from '../app/rail.js'\nimport '@bridge/shared'\nexport const Frame = rail\n",
  )
  write('web/src/app/rail.ts', 'export const rail = 1\n')
  write('web/src/blocks/Unused.tsx', 'export const Unused = 1\n')
  write('shared/src/index.ts', 'export const shared = 1\n')
  write('web/.storybook/preview.ts', 'export default {}\n')
  execFileSync('git', ['init', '-q'], { cwd: root })
  /** Seals `rec` against the inputs as they are now and saves it as review.json. */
  const seal = (rec: unknown) => {
    const inputs = reviewInputs(root, 'settings', 'D01')
    const sealed = sealReview('D01', inputsDigest(inputs.files, inputs.library), inputs.library, rec)
    write('references/settings/D01/review.json', `${JSON.stringify(sealed, null, 2)}\n`)
    return sealed
  }
  const result = () => checkReviews(root)
  return { root, write, seal, result }
}

void test('a matching record passes', (t) => {
  const s = scratch(t)
  s.seal(record([{ priority: 'P3' }]))
  assert.deepEqual(
    s.result().map((r) => [r.frame, r.ok, r.problem]),
    [['settings/D01', true, null]],
  )
})

void test('a built frame with no record fails, and an unbuilt frame needs none', (t) => {
  const s = scratch(t)
  assert.equal(s.result()[0]?.problem, 'missing')
  rmSync(join(s.root, 'web'), { recursive: true })
  assert.deepEqual(s.result(), [])
})

void test('an input change with a stale record fails', (t) => {
  for (const change of [
    (s: ReturnType<typeof scratch>) => {
      s.write(
        'web/src/pages/settings/states/desktopDark.ts',
        "export const desktopDark = { id: 'D1', mode: 'light' }\n",
      )
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('web/src/pages/settings/screens/SettingsScreen.stories.tsx', 'export const DesktopDark = { args: {} }\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('web/src/blocks/Frame.tsx', 'export const Frame = 2\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('web/src/app/rail.ts', 'export const rail = 2\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('shared/src/index.ts', 'export const shared = 2\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('web/.storybook/preview.ts', 'export default { tags: [] }\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('references/settings/D01/note.txt', 'another note\n')
    },
    (s: ReturnType<typeof scratch>) => {
      s.write('pnpm-workspace.yaml', 'catalog:\n  "@eshelton328/component-library-1701": 1.0.0-beta.106\n')
    },
  ]) {
    const s = scratch(t)
    s.seal(record())
    assert.equal(s.result()[0]?.ok, true)
    change(s)
    assert.equal(s.result()[0]?.problem, 'stale', change.toString())
  }
})

void test('a change to a file no input imports keeps the record current', (t) => {
  const s = scratch(t)
  s.seal(record())
  s.write('web/src/blocks/Unused.tsx', 'export const Unused = 2\n')
  assert.equal(s.result()[0]?.ok, true)
})

void test('importSpecifiers and resolveImport follow every import form to a repository file', () => {
  assert.deepEqual(
    importSpecifiers(
      "import { a } from './a.ts'\nimport './b.css'\nexport { c } from '../c.js'\nconst d = import('./d.tsx')\nimport type { E } from '@bridge/contract'\nimport x from 'react'\n",
    ),
    ['./a.ts', './b.css', '../c.js', './d.tsx', '@bridge/contract', 'react'],
  )
  const known = new Set(['web/src/c.ts', 'web/src/x/a.ts', 'contract/src/index.ts', 'web/src/x/dir/index.ts'])
  assert.equal(resolveImport('web/src/x/y.tsx', '../c.js', known), 'web/src/c.ts')
  assert.equal(resolveImport('web/src/x/y.tsx', './a.ts', known), 'web/src/x/a.ts')
  assert.equal(resolveImport('web/src/x/y.tsx', './dir', known), 'web/src/x/dir/index.ts')
  assert.equal(resolveImport('web/src/x/y.tsx', '@bridge/contract', known), 'contract/src/index.ts')
  assert.equal(resolveImport('web/src/x/y.tsx', 'react', known), undefined)
  assert.equal(resolveImport('web/src/x/y.tsx', '../../styled-system/css/index.js', known), undefined)
})

void test('a planted edit to the record or its hashes fails', (t) => {
  const s = scratch(t)
  const sealed = s.seal(record())
  const file = 'references/settings/D01/review.json'
  const plant = (value: unknown) => {
    s.write(file, JSON.stringify(value))
  }
  plant({ ...sealed, inputs: '0'.repeat(64) })
  assert.equal(s.result()[0]?.problem, 'stale')
  plant({ ...sealed, recordSha256: 'f'.repeat(64) })
  assert.equal(s.result()[0]?.problem, 'edited')
  // A P1 finding edited out of a record the review saved.
  const failing = s.seal(record([{ priority: 'P1' }]))
  plant({ ...failing, record: record() })
  assert.equal(s.result()[0]?.problem, 'edited')
  plant({ ...sealed, frameId: 'D02' })
  assert.equal(s.result()[0]?.problem, 'otherFrame')
  s.write(file, '{')
  assert.equal(s.result()[0]?.problem, 'invalid')
})

void test('a record with a P1 or P2 finding or an unreviewable verdict fails even when sealed', (t) => {
  for (const priority of ['P1', 'P2']) {
    const s = scratch(t)
    s.seal(record([{ priority }]))
    assert.equal(s.result()[0]?.problem, 'gate')
  }
  const s = scratch(t)
  s.seal({ ...record(), verdict: 'unreviewable' })
  assert.equal(s.result()[0]?.problem, 'gate')
})

void test('the inputs hash ignores key order in the record and file order', () => {
  assert.equal(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }), '{"a":[{"c":3,"d":2}],"b":1}')
  const files = [
    { path: 'b', sha256: '1' },
    { path: 'a', sha256: '2' },
  ]
  assert.equal(inputsDigest(files, 'x'), inputsDigest([...files].reverse(), 'x'))
  assert.notEqual(inputsDigest(files, 'x'), inputsDigest(files, 'y'))
  assert.equal(checkSeal({}, 'D01', '0'.repeat(64)).problem, 'invalid')
})
