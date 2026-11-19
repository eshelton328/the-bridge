// Tests for buildRecord.ts and the --guard mode of checkBuild.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  buildRecord,
  changeProblems,
  checkRecord,
  firstObject,
  framesInclude,
  gapRows,
  guardedReason,
  parseReport,
  storyLocksViewport,
  type BuildRecord,
  type Change,
  type FidelityReport,
  type RepoView,
} from './buildRecord.ts'

const record = (over: Partial<BuildRecord> = {}): BuildRecord => ({
  frame: 'inbox/D13',
  worktree: '/repo',
  status: 'deviations',
  state: 'web/src/pages/inbox/states/filtered.ts',
  fixRounds: 2,
  fidelity: { ok: false, text: true, position: false, rules: true },
  deviations: [{ what: 'list rows 58 px high, Figma 55 (`row · 1` h +3)', reason: 'the 4 px grid (d-072)' }],
  deviationsFile: 'references/inbox/D13/deviations.md',
  exceptionsFile: null,
  gaps: [{ part: 'Small text in the detail' }],
  sideBySide: 'reports/fidelity/inbox/D13.sideBySide.png',
  blocked: null,
  ...over,
})

const report = (over: Partial<FidelityReport> = {}): FidelityReport => ({
  ok: false,
  text: { ok: true, missing: [], extra: [], notVisible: [] },
  position: { ok: false, diffs: [{ key: 'row · 1' }] },
  rules: { ok: true, findings: [] },
  ...over,
})

const GAPS = `# Inbox library gaps

## Gaps

| Part or token | Frames | What is missing | Used now |
| --- | --- | --- | --- |
| Small text in the detail | D01–D13 | text | \`Checkbox\` |
| \`Regular 15 px\` text | D08, D12 | text | \`body\` |
`

const files: Record<string, string> = {
  'references/inbox/D13/frame.json': '{}',
  'references/inbox/D13/deviations.md': '# D13 deviations\n\n- `row · 1` h +3: the 4 px grid.\n',
  'reports/fidelity/inbox/D13.sideBySide.png': 'png',
  'web/src/pages/inbox/LIBRARY_GAPS.md': GAPS,
  'web/src/pages/inbox/screens/InboxScreen.stories.tsx': 'export const Filtered = { args: {} }\n',
}

const repo = (over: Partial<RepoView> = {}, extra: Record<string, string> = {}): RepoView => {
  const all = { ...files, ...extra }
  return {
    stateFile: 'web/src/pages/inbox/states/filtered.ts',
    report: report(),
    reportTime: 1000,
    newerThanReport: () => [],
    exists: (p) => p in all,
    read: (p) => all[p],
    changes: [
      { path: 'web/src/pages/inbox/states/filtered.ts', status: 'A', deleted: 0 },
      { path: 'web/src/pages/inbox/screens/InboxScreen.stories.tsx', status: 'M', deleted: 0 },
    ],
    exceptionsError: undefined,
    ...over,
  }
}

const has = (errors: string[], re: RegExp) => {
  assert.ok(
    errors.some((e) => re.test(e)),
    errors.join('\n'),
  )
}

void test('a complete record of a frame with deviations passes', () => {
  assert.deepEqual(checkRecord(record(), repo()), [])
})

void test('a passing record passes', () => {
  const pass = record({ status: 'pass', fidelity: { ok: true, text: true, position: true, rules: true } })
  const passed = report({ ok: true, position: { ok: true, diffs: [] } })
  assert.deepEqual(
    checkRecord({ ...pass, deviations: [], deviationsFile: null, gaps: [] }, repo({ report: passed })),
    [],
  )
})

void test('the schema rejects a 4th fix round, an unknown key, a bad frame and a relative worktree', () => {
  assert.equal(buildRecord.safeParse(record()).success, true)
  assert.equal(buildRecord.safeParse(record({ fixRounds: 4 })).success, false)
  assert.equal(buildRecord.safeParse({ ...record(), pr: 'https://github.com/x/y/pull/1' }).success, false)
  assert.equal(buildRecord.safeParse(record({ frame: 'D13' })).success, false)
  assert.equal(buildRecord.safeParse(record({ frame: 'workspaces/D02b' })).success, true)
  assert.equal(buildRecord.safeParse(record({ frame: 'workspaces/D02B' })).success, false)
  assert.equal(buildRecord.safeParse(record({ worktree: 'repo' })).success, false)
  assert.equal(buildRecord.safeParse(record({ state: '../outside.ts' })).success, false)
  assert.equal(buildRecord.safeParse(record({ deviations: [{ what: 'x', reason: ' ' }] })).success, false)
})

void test('firstObject finds the record inside a reply with a code fence', () => {
  const reply = `Done.\n\n\`\`\`json\n${JSON.stringify(record())}\n\`\`\`\nThat is all.`
  assert.deepEqual(firstObject(reply), record())
  assert.equal(firstObject('no record here'), undefined)
})

void test('a fidelity result that differs from the last report fails', () => {
  const claimed = record({ status: 'pass', fidelity: { ok: true, text: true, position: true, rules: true } })
  const errors = checkRecord(claimed, repo())
  has(errors, /fidelity\.ok is true, but the last pnpm fidelity report says false/)
  has(errors, /fidelity\.position is true/)
})

void test('a report that left out a check with --checks fails', () => {
  const claimed = record({ status: 'pass', fidelity: { ok: true, text: true, position: true, rules: true } })
  const partial = report({ ok: true, checks: ['text', 'rules'], position: { ok: true, diffs: [] } })
  has(checkRecord(claimed, repo({ report: partial })), /left out position \(--checks\)/)
  const full = report({ ok: true, checks: ['text', 'position', 'rules'], position: { ok: true, diffs: [] } })
  assert.deepEqual(
    checkRecord(claimed, repo({ report: full })).filter((e) => e.includes('--checks')),
    [],
  )
})

void test('a record without a report, or with a change after the report, fails', () => {
  has(checkRecord(record(), repo({ report: undefined })), /no report at reports\/fidelity\/inbox\/D13\.json/)
  has(
    checkRecord(record(), repo({ newerThanReport: () => ['web/src/pages/inbox/blocks/Row.tsx'] })),
    /changed after the last pnpm fidelity run: web\/src\/pages\/inbox\/blocks\/Row\.tsx/,
  )
})

void test('deviations.md must name every failing layer, rule and text', () => {
  const failing = report({
    position: { ok: false, diffs: [{ key: 'row · 1' }, { key: 'task pane' }] },
    rules: { ok: false, findings: [{ rule: 'scrollBar' }] },
    text: { ok: false, missing: [{ text: 'Clear' }], extra: [], notVisible: [] },
  })
  const errors = checkRecord(
    record({ fidelity: { ok: false, text: false, position: false, rules: false } }),
    repo({ report: failing }),
  )
  has(errors, /does not name: task pane \| scrollBar \| Clear/)
  const noDoc = repo({ read: (p) => (p.endsWith('deviations.md') ? undefined : files[p]) })
  has(checkRecord(record(), noDoc), /deviations\.md does not exist/)
})

void test('a failing result needs deviations, and blocked needs a reason', () => {
  has(
    checkRecord(record({ sideBySide: null }), repo()),
    /sideBySide must be reports\/fidelity\/inbox\/D13\.sideBySide\.png/,
  )
  has(checkRecord(record({ status: 'pass' }), repo()), /status is pass but the fidelity result is not ok/)
  has(checkRecord(record({ deviations: [], deviationsFile: null }), repo()), /list each remaining difference/)
  has(checkRecord(record({ status: 'blocked', blocked: null }), repo()), /say why in `blocked`/)
  const blocked = record({
    status: 'blocked',
    blocked: 'no frame.png',
    state: null,
    fidelity: null,
    deviations: [],
    deviationsFile: null,
    gaps: [],
  })
  assert.deepEqual(checkRecord(blocked, repo()), [])
})

void test('the state must be the file that lists the frame', () => {
  has(checkRecord(record({ state: 'web/src/pages/inbox/states/other.ts' }), repo()), /the state file that lists D13 is/)
  has(
    checkRecord(record(), repo({ stateFile: undefined })),
    /no state file in web\/src\/pages\/inbox\/states lists frame D13/,
  )
})

void test('each gap must be a LIBRARY_GAPS.md row that lists the frame', () => {
  has(checkRecord(record({ gaps: [{ part: 'Success tone' }] }), repo()), /gap "Success tone" is not a row/)
  has(checkRecord(record({ gaps: [{ part: 'Regular 15 px text' }] }), repo()), /does not list D13/)
  assert.deepEqual(checkRecord(record({ gaps: [{ part: 'small text in the detail' }] }), repo()), [])
})

void test('file fields must be the canonical paths and exist', () => {
  has(
    checkRecord(record({ deviationsFile: 'references/inbox/D13/notes.md' }), repo()),
    /deviationsFile must be references\/inbox\/D13\/deviations\.md/,
  )
  has(
    checkRecord(record({ exceptionsFile: 'references/inbox/D13/exceptions.json' }), repo()),
    /exceptionsFile: .* does not exist/,
  )
  has(checkRecord(record(), repo({ exceptionsError: 'exceptions.json: reason too short' })), /reason too short/)
  const changed = repo({ changes: [{ path: 'references/inbox/D13/exceptions.json', status: 'A', deleted: 0 }] })
  has(checkRecord(record(), changed), /set exceptionsFile/)
  const removed = repo({ changes: [{ path: 'references/inbox/D13/exceptions.json', status: 'D', deleted: 4 }] })
  assert.deepEqual(checkRecord(record(), removed), [])
})

void test('a guarded change or a story that sets globals.viewport fails the record', () => {
  const changes: Change[] = [...repo().changes, { path: 'scripts/fidelity/checkPosition.ts', status: 'M', deleted: 1 }]
  has(checkRecord(record(), repo({ changes })), /scripts\/fidelity\/checkPosition\.ts changed/)
  const locked = "export const Filtered = { globals: { viewport: { value: 'desktop' } } }\n"
  has(
    checkRecord(record(), repo({}, { 'web/src/pages/inbox/screens/InboxScreen.stories.tsx': locked })),
    /sets globals\.viewport/,
  )
})

void test('guardedReason covers checks, CI, references, baselines and check config', () => {
  for (const p of [
    'scripts/fidelity/checkText.ts',
    'scripts/templates/state.ts.tpl',
    '.github/workflows/ci.yml',
    'references/inbox/D13/frame.json',
    'references/inbox/D13/frame.png',
    'references/inbox/D13/note.txt',
    'web/src/pages/inbox/screens/__screenshots__/a.png',
    'web/x.snap',
    'vitest.config.ts',
    'web/tsconfig.app.json',
    'eslint.config.js',
    'web/.storybook/preview.ts',
    'web/src/structure.ts',
    'package.json',
  ])
    assert.notEqual(guardedReason(p), undefined, p)
  for (const p of [
    'references/inbox/D13/deviations.md',
    'references/inbox/D13/exceptions.json',
    'web/src/pages/inbox/LIBRARY_GAPS.md',
    'web/src/pages/inbox/states/filtered.ts',
    'web/src/pages/inbox/screens/InboxScreen.stories.tsx',
    'web/package.json',
  ])
    assert.equal(guardedReason(p), undefined, p)
})

void test('changeProblems allows new tests and added lines, not deleted tests or removed lines', () => {
  assert.deepEqual(
    changeProblems([
      { path: 'web/src/app/new.test.ts', status: 'A', deleted: 0 },
      { path: 'web/src/app/InboxRoute.test.tsx', status: 'M', deleted: 0 },
    ]),
    [],
  )
  const problems = changeProblems([
    { path: 'web/src/app/InboxRoute.test.tsx', status: 'M', deleted: 2 },
    { path: 'web/src/pages/inbox/inboxStore.test.ts', status: 'D', deleted: 27 },
  ])
  assert.equal(problems.length, 2)
})

void test('storyLocksViewport finds globals.viewport only', () => {
  assert.equal(storyLocksViewport("globals: { viewport: { value: 'phone', isRotated: false } }"), true)
  assert.equal(storyLocksViewport("args: { viewport: 'desktop' }"), false)
  assert.equal(storyLocksViewport('globals: { backgrounds: { value: "dark" } }'), false)
  assert.equal(storyLocksViewport("globals: { backgrounds: { value: 'dark' }, viewport: { value: 'phone' } }"), true)
  assert.equal(storyLocksViewport("globals: { backgrounds: { value: 'dark' } }, args: { viewport: 'phone' }"), false)
})

void test('gapRows reads the Gaps table and framesInclude reads its Frames cell', () => {
  assert.deepEqual(gapRows(GAPS), [
    { part: 'Small text in the detail', frames: 'D01–D13' },
    { part: 'Regular 15 px text', frames: 'D08, D12' },
  ])
  assert.equal(framesInclude('D01–D12', 'D07'), true)
  assert.equal(framesInclude('D01–D03', 'D02b'), true)
  assert.equal(framesInclude('D02b', 'D02b'), true)
  assert.equal(framesInclude('D02b', 'D02'), false)
  assert.equal(framesInclude('D02', 'D02b'), false)
  assert.equal(framesInclude('D02b–D04', 'D02'), false)
  assert.equal(framesInclude('D01–D12', 'D13'), false)
  assert.equal(framesInclude('D02–D05, D07, D09', 'D09'), true)
  assert.equal(framesInclude('D02–D05, D07', 'D06'), false)
  assert.equal(framesInclude('D1-D3', 'D02'), true)
  assert.equal(framesInclude('D01–D12', 'M05'), false)
})

void test('parseReport reads a pnpm fidelity report and names a wrong one', () => {
  assert.equal(typeof parseReport({ ...report(), frameId: 'D13', images: {} }), 'object')
  const wrong = parseReport({ ok: true })
  assert.equal(typeof wrong, 'string')
  if (typeof wrong === 'string') assert.match(wrong, /not a pnpm fidelity report/)
})

void test('checkBuild --guard exits 1 for a check and 0 for a page file', () => {
  const script = fileURLToPath(new URL('./checkBuild.ts', import.meta.url))
  const run = (p: string) => spawnSync(process.execPath, [script, '--guard', p], { encoding: 'utf8' })
  const guarded = run('scripts/fidelity/checkText.ts')
  assert.equal(guarded.status, 1)
  assert.match(guarded.stdout, /"ok":false/)
  assert.equal(run('web/src/pages/inbox/states/filtered.ts').status, 0)
  assert.equal(run('./scripts/fidelity/checkText.ts').status, 1)
  assert.equal(run('web/../scripts/fidelity/checkText.ts').status, 1)
})
