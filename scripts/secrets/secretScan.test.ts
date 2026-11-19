// Tests for the rules and exceptions in .gitleaks.toml and the gitleaks
// flags of the two CI scans (the job secrets in ci.yml and
// secret-history.yml), ported from the library (#252). Each test writes
// planted files to a temporary folder and runs gitleaks there with the
// repository's config. The planted values are built from parts, so this
// file itself has no line that the scan finds. The job secrets runs it with
// `node --test scripts/secrets/secretScan.test.ts`; it needs gitleaks 8.30.1
// on PATH or in GITLEAKS, and fails without it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const gitleaks = process.env.GITLEAKS ?? 'gitleaks'
const repoConfig = readFileSync(join(root, '.gitleaks.toml'), 'utf8')

// The two workflows whose gitleaks call must ignore gitleaks:allow comments.
const workflows = ['.github/workflows/ci.yml', '.github/workflows/secret-history.yml']

// CI adds the rule personal-term from the secret PRIVACY_TERMS; the tests
// add it the same way with a made-up term.
const term = 'zorb' + 'ulon'
const personalRule = `\n[[rules]]\nid = "personal-term"\ndescription = "A test term"\nregex = '''(?i)\\b(?:${term})\\b'''\n`

function isFinding(value: unknown): value is { RuleID: string } {
  return typeof value === 'object' && value !== null && 'RuleID' in value && typeof value.RuleID === 'string'
}

// The rule IDs that gitleaks finds in these files (path to lines).
function scan(files: Record<string, string[]>, flags: string[] = []): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-'))
  const src = join(dir, 'src')
  const config = join(dir, 'gitleaks.toml')
  const report = join(dir, 'report.json')
  writeFileSync(config, repoConfig + personalRule)
  for (const [path, lines] of Object.entries(files)) {
    mkdirSync(dirname(join(src, path)), { recursive: true })
    writeFileSync(join(src, path), lines.join('\n') + '\n')
  }
  const run = spawnSync(
    gitleaks,
    [
      'dir',
      '--no-banner',
      '--redact',
      '--exit-code',
      '0',
      '--config',
      config,
      '--report-format',
      'json',
      '--report-path',
      report,
      ...flags,
      '.',
    ],
    { encoding: 'utf8', cwd: src },
  )
  if (run.error !== undefined)
    throw new Error(`gitleaks did not start (${run.error.message}); install gitleaks 8.30.1 or set GITLEAKS`)
  assert.equal(run.status, 0, run.stderr)
  const found: unknown = JSON.parse(readFileSync(report, 'utf8'))
  if (!Array.isArray(found)) throw new Error('the gitleaks report is not a list')
  return found
    .filter(isFinding)
    .map((f) => f.RuleID)
    .sort()
}

const literal = 'winter' + 'iscoming'

void test('a bare secret-named key with a literal value is found (library #252)', () => {
  assert.deepEqual(scan({ 'deploy.sh': ['PASS' + 'WORD="' + literal + '"'] }), ['env-assignment'])
  assert.deepEqual(scan({ 'deploy.sh': ['export TOK' + 'EN=' + literal] }), ['env-assignment'])
})

void test('a prefixed secret-named key is still found, and a value from a variable is not', () => {
  assert.deepEqual(scan({ 'deploy.sh': ['DB_PASS' + 'WORD="' + literal + '"'] }), ['env-assignment'])
  assert.deepEqual(scan({ 'deploy.sh': ['PASS' + 'WORD="$' + 'FROM_ENV_VALUE"'] }), [])
})

void test('an email address with an upper-case domain is found (library #252)', () => {
  assert.deepEqual(scan({ 'notes.md': ['Write to alice' + '@' + 'PERSONAL.COM today.'] }), ['email'])
  assert.deepEqual(scan({ 'notes.md': ['Write to alice' + '@' + 'personal.com today.'] }), ['email'])
})

void test('the email exceptions hold in any case, and a token pair is not an address', () => {
  assert.deepEqual(scan({ 'notes.md': ['1+bot' + '@' + 'USERS.NOREPLY.GITHUB.COM'] }), [])
  assert.deepEqual(scan({ 'notes.md': ['surface.inset' + '@' + 'surface.pane'] }), [])
})

void test('both CI scans ignore gitleaks:allow comments (library #252)', () => {
  for (const path of workflows) {
    const text = readFileSync(join(root, path), 'utf8')
    const calls = text.split('\n').filter((line) => line.includes('"$RUNNER_TEMP/gitleaks" git '))
    assert.equal(calls.length, 1, `${path} has one gitleaks git call`)
    assert.match(calls[0] ?? '', / --ignore-gitleaks-allow /, `${path} passes --ignore-gitleaks-allow`)
  }
  const line = 'API_TOK' + 'EN="' + literal + '" # gitleaks' + ':allow'
  assert.deepEqual(scan({ 'deploy.sh': [line] }), [])
  assert.deepEqual(scan({ 'deploy.sh': [line] }, ['--ignore-gitleaks-allow']), ['env-assignment'])
})

void test('a personal term is found in product code and docs, and not in references/', () => {
  assert.deepEqual(scan({ 'web/src/a.ts': [`// what ${term} typed`] }), ['personal-term'])
  assert.deepEqual(scan({ 'README.md': [`Ask ${term}.`] }), ['personal-term'])
  assert.deepEqual(scan({ 'references/toolkit/D18/frame.json': [`"text": "122 from ${term} · 991 replies"`] }), [])
})

void test('the Figma-bound lines pass only in their own files, and other lines there are found', () => {
  const activity = 'web/src/pages/toolkit/states/shared/activitySources.ts'
  const entry = 'web/src/pages/toolkit/blocks/ToolkitDiscussEntry.tsx'
  const figmaText = `  { label: 'Messages', value: '122 from ${term} · 991 replies' },`
  const figmaLayer = `      <div ref={ref} data-figma="message · ${term}">`
  assert.deepEqual(scan({ [activity]: [figmaText], [entry]: [figmaLayer] }), [])
  assert.deepEqual(scan({ [activity]: [`// ${term} reads this`] }), ['personal-term'])
  assert.deepEqual(scan({ 'web/src/pages/inbox/rows.ts': [figmaText] }), ['personal-term'])
})

void test('the Figma fileKey passes only on the fileKey line of a saved frame', () => {
  const key = '"fileKey": "PZoW9BBu' + '43qRgon1KhJcwU",'
  assert.deepEqual(scan({ 'references/inbox/D01/frame.json': ['{', key, '}'] }), [])
  assert.deepEqual(scan({ 'references/workspaces/D02b/frame.json': ['{', key, '}'] }), [])
  assert.deepEqual(scan({ 'web/src/figma.json': ['{', key, '}'] }), ['generic-api-key'])
})
