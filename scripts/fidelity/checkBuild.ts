#!/usr/bin/env node
// `pnpm fidelity:check-build <record.json | ->`: checks the record the
// fidelity-builder agent returns for one frame against this checkout (see
// buildRecord.ts for what it checks). The input may be the bare JSON or a
// reply that holds it. Prints one JSON line {ok, frame, errors}; exits 1 on
// a problem and 2 on a usage error.
//
// `pnpm fidelity:check-build --guard <path>`: exits 1 and says why when the
// fidelity-builder may not change <path> (a check, a baseline, a saved
// Figma reference, check config). The agent's PreToolUse hook runs it.
//
// --base <ref> sets what the branch is compared with (default origin/main).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, normalize, relative } from 'node:path'
import { parseArgs } from 'node:util'
import {
  buildRecord,
  checkRecord,
  firstObject,
  guardedReason,
  parseReport,
  type Change,
  type RepoView,
} from './buildRecord.ts'
import { readExceptions, readFrameRef, repoRoot } from './references.ts'
import { stateForFrame } from './storyServer.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { base: { type: 'string', default: 'origin/main' }, guard: { type: 'string' } },
})

if (values.guard !== undefined) {
  // `./scripts/x.ts` and `web/../scripts/x.ts` name a guarded file too.
  const path = normalize(isAbsolute(values.guard) ? relative(realpathSync(repoRoot), values.guard) : values.guard)
  const reason = guardedReason(path)
  console.log(JSON.stringify({ ok: reason === undefined, path, reason: reason ?? null }))
  process.exit(reason === undefined ? 0 : 1)
}

const [input] = positionals
if (input === undefined) {
  console.error('Usage: pnpm fidelity:check-build <record.json | -> [--base <ref>]  |  --guard <path>')
  process.exit(2)
}
const raw = input === '-' ? readFileSync(0, 'utf8') : readFileSync(input, 'utf8')
const parsed = buildRecord.safeParse(firstObject(raw))
if (!parsed.success) {
  const errors = parsed.error.issues.map((i) => `${i.path.join('.') || 'record'}: ${i.message}`)
  if (firstObject(raw) === undefined) errors.unshift('no JSON object found in the input')
  console.log(JSON.stringify({ ok: false, frame: null, errors }))
  process.exit(1)
}
const record = parsed.data
const [page = '', frameId = ''] = record.frame.split('/')

const git = (...args: string[]) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })

function branchChanges(base: string): Change[] {
  const from = git('merge-base', 'HEAD', base).trim()
  const deleted = new Map<string, number>()
  for (const line of git('diff', '--no-renames', '--numstat', from).split('\n')) {
    const [, del, path] = line.split('\t')
    if (path !== undefined && del !== undefined) deleted.set(path, del === '-' ? 0 : Number(del))
  }
  const changes: Change[] = []
  for (const line of git('diff', '--no-renames', '--name-status', from).split('\n')) {
    const [status, path] = line.split('\t')
    if (path === undefined || (status !== 'A' && status !== 'M' && status !== 'D')) continue
    changes.push({ path, status, deleted: deleted.get(path) ?? 0 })
  }
  for (const path of git('ls-files', '--others', '--exclude-standard').split('\n'))
    if (path !== '') changes.push({ path, status: 'A', deleted: 0 })
  return changes
}

const errors: string[] = []
if (realpathSync(record.worktree) !== realpathSync(repoRoot))
  errors.push(`worktree is ${record.worktree}, but this check runs in ${repoRoot}; run the worktree's own copy`)

let changes: Change[] = []
try {
  changes = branchChanges(values.base)
} catch (error) {
  errors.push(`cannot compare with ${values.base}: ${error instanceof Error ? error.message : String(error)}`)
}

const refDir = join(repoRoot, 'references', page, frameId)
const code = existsSync(join(refDir, 'frame.json')) ? readFrameRef(page, frameId).code : frameId
const state = stateForFrame(page, code)
const reportFile = join(repoRoot, 'reports', 'fidelity', page, `${frameId}.json`)
let exceptionsError: string | undefined
try {
  readExceptions(page, frameId)
} catch (error) {
  exceptionsError = error instanceof Error ? error.message : String(error)
}

function readReport(file: string) {
  try {
    return parseReport(JSON.parse(readFileSync(file, 'utf8')))
  } catch (error) {
    return `cannot read it: ${error instanceof Error ? error.message : String(error)}`
  }
}

const read = (path: string) =>
  existsSync(join(repoRoot, path)) ? readFileSync(join(repoRoot, path), 'utf8') : undefined
const watched = (path: string) =>
  !path.endsWith('.md') && (path.startsWith('web/') || path.startsWith(`references/${page}/${frameId}/`))

const repo: RepoView = {
  stateFile: state === undefined ? undefined : `web/src/pages/${page}/states/${state}.ts`,
  report: existsSync(reportFile) ? readReport(reportFile) : undefined,
  reportTime: existsSync(reportFile) ? statSync(reportFile).mtimeMs : undefined,
  newerThanReport: (time) =>
    changes
      .filter((c) => c.status !== 'D' && watched(c.path) && existsSync(join(repoRoot, c.path)))
      .filter((c) => statSync(join(repoRoot, c.path)).mtimeMs > time)
      .map((c) => c.path),
  exists: (path) => existsSync(join(repoRoot, path)),
  read,
  changes,
  exceptionsError,
}

errors.push(...checkRecord(record, repo))
console.log(JSON.stringify({ ok: errors.length === 0, frame: record.frame, errors }))
process.exit(errors.length === 0 ? 0 : 1)
