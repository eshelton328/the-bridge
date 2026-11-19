// The record the fidelity-builder agent returns for one frame, and the
// checks code can decide about it: the record's shape, that its fidelity
// result is the one the last `pnpm fidelity` run wrote and that no change
// came after that run, that deviations.md names every failing check item,
// that each gap is a row of the page's LIBRARY_GAPS.md for this frame, and
// that the branch changes no check, test threshold, baseline or reference.
// checkBuild.ts reads the files and git; everything here is pure.
import { z } from 'zod'
import { fidelityChecks, gateChecks } from './references.ts'

const text = z.string().trim().min(1)
const repoPath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith('/') && !p.split('/').includes('..'), 'must be a path inside the repo')

export const buildRecord = z.strictObject({
  /** `<page>/<frameId>`, such as `inbox/D13`. */
  frame: z
    .string()
    .regex(/^[a-z][a-zA-Z0-9]*\/[A-Z]\d{2}[a-z]?$/, 'must be <page>/<frameId>, such as inbox/D13 or workspaces/D02b'),
  /** The worktree the agent built in, as an absolute path. */
  worktree: z.string().startsWith('/', 'must be an absolute path'),
  status: z.enum(['pass', 'deviations', 'blocked']),
  /** The state file, such as web/src/pages/inbox/states/filtered.ts. */
  state: repoPath.nullable(),
  /** Fix rounds after the first `pnpm fidelity` run: 0 to 3. */
  fixRounds: z.int().min(0).max(3),
  /** The last `pnpm fidelity` result; null only when blocked before a run. */
  fidelity: z
    .strictObject({ ok: z.boolean(), text: z.boolean(), position: z.boolean(), rules: z.boolean() })
    .nullable(),
  /** What still differs, each with its reason; the caller hands these to fidelity-reviewer as accepted deviations. */
  deviations: z.array(z.strictObject({ what: text, reason: text })),
  deviationsFile: repoPath.nullable(),
  exceptionsFile: repoPath.nullable(),
  /** Library parts or tokens the frame needs and the library lacks; each is a row of LIBRARY_GAPS.md. */
  gaps: z.array(z.strictObject({ part: text })),
  /** reports/fidelity/<page>/<frameId>.sideBySide.png, for the blind second review. */
  sideBySide: repoPath.nullable(),
  /** Why the agent stopped without a result; null unless status is blocked. */
  blocked: text.nullable(),
})

export type BuildRecord = z.infer<typeof buildRecord>

/** The first JSON object in a reply, which may hold prose or a code fence around it. */
export function firstObject(reply: string): unknown {
  for (let i = reply.indexOf('{'); i !== -1; i = reply.indexOf('{', i + 1)) {
    for (let j = reply.lastIndexOf('}'); j > i; j = reply.lastIndexOf('}', j - 1)) {
      try {
        const value: unknown = JSON.parse(reply.slice(i, j + 1))
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value
      } catch {
        // not JSON at this span; try a shorter one
      }
    }
  }
  return undefined
}

/** The parts of a `pnpm fidelity` report (reports/fidelity/<page>/<frameId>.json) the checks read. */
const fidelityReport = z.object({
  ok: z.boolean(),
  checks: z.array(z.enum(gateChecks)).optional(),
  state: z.string().optional(),
  text: z.object({
    ok: z.boolean(),
    missing: z.array(z.object({ text: z.string() })),
    extra: z.array(z.object({ text: z.string() })),
    notVisible: z.array(z.object({ text: z.string() })),
  }),
  position: z.object({ ok: z.boolean(), diffs: z.array(z.object({ key: z.string() })) }),
  rules: z.object({ ok: z.boolean(), findings: z.array(z.object({ rule: z.string() })) }),
})

export type FidelityReport = z.infer<typeof fidelityReport>

export function parseReport(data: unknown): FidelityReport | string {
  const parsed = fidelityReport.safeParse(data)
  return parsed.success ? parsed.data : `not a pnpm fidelity report: ${z.prettifyError(parsed.error)}`
}

/** One file the branch changed against its base. `deleted` counts removed lines. */
export type Change = { path: string; status: 'A' | 'M' | 'D'; deleted: number }

const guarded: [RegExp, string][] = [
  [/^scripts\//, 'a check, generator or template'],
  [/^\.github\//, 'CI'],
  [/^references\/[^/]+\/[^/]+\/(frame\.png|frame\.json|note\.txt)$/, 'a saved Figma reference'],
  [/(^|\/)__screenshots__\//, 'a screenshot baseline'],
  [/\.snap$/, 'a snapshot baseline'],
  [/(^|\/)(vitest\.config\.ts|eslint\.config\.js|biome\.json|knip\.json|tsconfig[^/]*\.json)$/, 'check config'],
  [/^web\/\.storybook\//, 'Storybook and story-test config'],
  [/^web\/src\/structure\.ts$/, 'the structure check config'],
  [/^package\.json$/, 'the verify command'],
]

/** Why the fidelity-builder may not change `path`, or undefined when it may. */
export function guardedReason(path: string): string | undefined {
  return guarded.find(([re]) => re.test(path))?.[1]
}

const isTest = (path: string) => /\.test\.tsx?$/.test(path)

/** Problems in the branch's changes: a guarded file, or an existing test that lost lines or was deleted. */
export function changeProblems(changes: readonly Change[]): string[] {
  const problems: string[] = []
  for (const c of changes) {
    const reason = guardedReason(c.path)
    if (reason !== undefined) problems.push(`${c.path} changed: it is ${reason}, which only Erik changes`)
    else if (isTest(c.path) && c.status === 'D') problems.push(`${c.path} deleted: never delete a test`)
    else if (isTest(c.path) && c.status !== 'A' && c.deleted > 0)
      problems.push(`${c.path} lost ${String(c.deleted)} line(s): add to a test, never weaken one`)
  }
  return problems
}

/** True when a story file sets `globals` with a viewport, which locks Storybook's viewport menu. */
export function storyLocksViewport(source: string): boolean {
  for (const m of source.matchAll(/\bglobals\s*:\s*\{/g)) {
    // Read the whole globals object, nested objects included.
    let depth = 0
    let end = m.index + m[0].length - 1
    for (; end < source.length; end++) {
      if (source[end] === '{') depth++
      else if (source[end] === '}' && --depth === 0) break
    }
    if (/\bviewport\b/.test(source.slice(m.index, end))) return true
  }
  return false
}

/** The rows of the `## Gaps` table of a LIBRARY_GAPS.md: part (backticks removed) and its Frames cell. */
export function gapRows(markdown: string): { part: string; frames: string }[] {
  const section = markdown.split(/^## Gaps\s*$/m)[1] ?? ''
  const rows: { part: string; frames: string }[] = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    const [part, frames] = cells
    if (part === undefined || frames === undefined || /^-+$/.test(part) || part === 'Part or token') continue
    rows.push({ part: part.replaceAll('`', ''), frames })
  }
  return rows
}

// A suffix letter sorts a frame after its number: D02 < D02b < D03.
const frameNumber = (id: string) => {
  const m = /^([A-Z])0*(\d+)([a-z]?)$/.exec(id.trim())
  if (m?.[1] === undefined || m[2] === undefined) return undefined
  const suffix = m[3] ? m[3].charCodeAt(0) - 96 : 0
  return { letter: m[1], n: Number(m[2]) * 100 + suffix }
}

/** True when a Frames cell such as "D01–D12", "D02–D05, D07", "D08, D12" or "D02b" includes `frameId`. */
export function framesInclude(cell: string, frameId: string): boolean {
  const want = frameNumber(frameId)
  if (want === undefined) return false
  return cell.split(',').some((item) => {
    const [from, to] = item.split(/[–-]/)
    if (from === undefined) return false
    const a = frameNumber(from)
    const b = frameNumber(to ?? from)
    return a !== undefined && b !== undefined && a.letter === want.letter && b.letter === want.letter
      ? want.n >= a.n && want.n <= b.n
      : false
  })
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
const named = (doc: string, item: string) => squash(doc).includes(squash(item))

/** What checkRecord reads from the repo, so the checks stay pure. */
export type RepoView = {
  /** The state file whose `frames` list the frame, as a repo path, or undefined. */
  stateFile: string | undefined
  /** The parsed report, an error message, or undefined when there is none. */
  report: FidelityReport | string | undefined
  /** The report's modification time in ms. */
  reportTime: number | undefined
  /** Changed non-Markdown files under web/ or the frame's references, with modification times. */
  newerThanReport: (time: number) => string[]
  exists: (path: string) => boolean
  read: (path: string) => string | undefined
  changes: readonly Change[]
  /** Why the frame's exceptions.json does not parse, or undefined. */
  exceptionsError: string | undefined
}

/** Every problem code can find in a parsed record; [] when it passes. */
export function checkRecord(record: BuildRecord, repo: RepoView): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(m)
  const [page = '', frameId = ''] = record.frame.split('/')
  const refDir = `references/${page}/${frameId}`
  const canonical = {
    state: repo.stateFile,
    deviations: `${refDir}/deviations.md`,
    exceptions: `${refDir}/exceptions.json`,
    sideBySide: `reports/fidelity/${page}/${frameId}.sideBySide.png`,
    gaps: `web/src/pages/${page}/LIBRARY_GAPS.md`,
  }

  if (!repo.exists(`${refDir}/frame.json`)) err(`${refDir}/frame.json does not exist: no reference for ${record.frame}`)

  // Status against the other fields.
  if (record.status === 'blocked') {
    if (record.blocked === null) err('status is blocked: say why in `blocked`')
  } else {
    if (record.blocked !== null) err(`status is ${record.status}: \`blocked\` must be null`)
    if (record.fidelity === null) err(`status is ${record.status}: \`fidelity\` needs the last pnpm fidelity result`)
    if (record.state === null) err(`status is ${record.status}: \`state\` needs the state file`)
  }
  if (record.fidelity !== null && record.sideBySide === null)
    err(`sideBySide must be ${canonical.sideBySide}: the caller hands it to fidelity-reviewer`)
  if (record.status === 'pass' && record.fidelity?.ok === false)
    err('status is pass but the fidelity result is not ok: use deviations')
  if (record.status === 'deviations' && record.deviations.length === 0)
    err('status is deviations but `deviations` is empty')
  if (record.fidelity?.ok === false && record.deviations.length === 0)
    err('the fidelity result is not ok: list each remaining difference in `deviations` with its reason')

  // The state file.
  if (record.state !== null) {
    if (canonical.state === undefined)
      err(`no state file in web/src/pages/${page}/states lists frame ${frameId}; record.state says ${record.state}`)
    else if (record.state !== canonical.state)
      err(`state is ${record.state}, but the state file that lists ${frameId} is ${canonical.state}`)
  }

  // The fidelity result against the report the last run wrote.
  if (record.fidelity !== null) {
    const report = repo.report
    if (report === undefined)
      err(`no report at reports/fidelity/${page}/${frameId}.json: run pnpm fidelity ${page} ${frameId}`)
    else if (typeof report === 'string') err(`reports/fidelity/${page}/${frameId}.json: ${report}`)
    else {
      const got = record.fidelity
      const skipped = fidelityChecks.filter((c) => report.checks !== undefined && !report.checks.includes(c))
      if (skipped.length > 0)
        err(
          `the last pnpm fidelity report left out ${skipped.join(', ')} (--checks): run pnpm fidelity ${page} ${frameId} without --checks`,
        )
      const want = { ok: report.ok, text: report.text.ok, position: report.position.ok, rules: report.rules.ok }
      for (const key of ['ok', 'text', 'position', 'rules'] as const)
        if (got[key] !== want[key])
          err(`fidelity.${key} is ${String(got[key])}, but the last pnpm fidelity report says ${String(want[key])}`)
      const newer = repo.reportTime === undefined ? [] : repo.newerThanReport(repo.reportTime)
      if (newer.length > 0)
        err(`changed after the last pnpm fidelity run: ${newer.join(', ')}; run pnpm fidelity ${page} ${frameId} again`)

      // deviations.md names every item that still fails.
      if (!report.ok) {
        const doc = repo.read(canonical.deviations)
        if (doc === undefined) err(`${canonical.deviations} does not exist: write it for the failing checks`)
        else {
          const items = [
            ...report.position.diffs.map((d) => d.key),
            ...report.rules.findings.map((f) => f.rule),
            ...[...report.text.missing, ...report.text.notVisible, ...report.text.extra].map((t) => t.text),
          ]
          const unnamed = [...new Set(items)].filter((i) => !named(doc, i))
          if (unnamed.length > 0) err(`${canonical.deviations} does not name: ${unnamed.join(' | ')}`)
        }
      }
    }
  }

  // File fields point at the files they stand for.
  const fileField = (field: 'deviationsFile' | 'exceptionsFile' | 'sideBySide', want: string) => {
    const got = record[field]
    if (got === null) return
    if (got !== want) err(`${field} must be ${want}, not ${got}`)
    else if (!repo.exists(got)) err(`${field}: ${got} does not exist`)
  }
  fileField('deviationsFile', canonical.deviations)
  fileField('exceptionsFile', canonical.exceptions)
  fileField('sideBySide', canonical.sideBySide)
  if (record.deviations.length > 0 && record.deviationsFile === null)
    err(`deviations are listed: write them to ${canonical.deviations} and set deviationsFile`)
  if (repo.exceptionsError !== undefined) err(repo.exceptionsError)
  // A deleted exceptions.json has no file to point at, so only an added or changed one needs the field.
  if (record.exceptionsFile === null && repo.changes.some((c) => c.path === canonical.exceptions && c.status !== 'D'))
    err(`${canonical.exceptions} changed: set exceptionsFile so the caller sees it`)

  // Each gap is a row of the page's LIBRARY_GAPS.md that lists this frame.
  if (record.gaps.length > 0) {
    const doc = repo.read(canonical.gaps)
    if (doc === undefined) err(`${canonical.gaps} does not exist`)
    else {
      const rows = gapRows(doc)
      for (const gap of record.gaps) {
        const row = rows.find((r) => squash(r.part) === squash(gap.part.replaceAll('`', '')))
        if (row === undefined) err(`gap "${gap.part}" is not a row of ${canonical.gaps}`)
        else if (!framesInclude(row.frames, frameId))
          err(`gap "${gap.part}" is in ${canonical.gaps}, but its Frames cell (${row.frames}) does not list ${frameId}`)
      }
    }
  }

  // Nothing guarded changed, and no story locks the viewport.
  errors.push(...changeProblems(repo.changes))
  for (const c of repo.changes) {
    if (c.status === 'D' || !c.path.endsWith('.stories.tsx')) continue
    const source = repo.read(c.path)
    if (source !== undefined && storyLocksViewport(source))
      err(`${c.path} sets globals.viewport: the viewport comes from Storybook's menu, never a story`)
  }
  return errors
}
