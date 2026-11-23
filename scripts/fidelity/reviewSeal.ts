// The committed reviewer record of a PNG frame (d-119). CI cannot run the
// fidelity-reviewer agent, so a passing `pnpm fidelity <page> <frameId>
// --review <file>` saves the agent's record beside the reference as
// review.json, sealed with a hash of what the review saw: the frame's
// reference files, its state, the page's stories, every repository file
// they import (the app frame and shared blocks too) and the library
// version. `pnpm
// check:reviews` (CI) recomputes the hash and fails a built PNG frame whose
// record is missing, stale, edited by hand or holds a P1 or P2 finding, so
// any change to those inputs needs a fresh review.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { z } from 'zod'
import { parseReview, pngReviewGate } from './pngReview.ts'
import { frameKind, parsePngRef } from './references.ts'
import { stateForFrame } from './storyServer.ts'

/** The name of the sealed record in a frame folder. */
export const reviewFileName = 'review.json'

const hex64 = z.string().regex(/^[0-9a-f]{64}$/, 'must be a sha256 in hex')

const sealedReview = z.strictObject({
  frameId: z.string(),
  /** inputsDigest of the review's inputs when it was saved. */
  inputs: hex64,
  /** The library version the inputs hash holds, for a reader. */
  library: z.string(),
  /** sha256 of the record's canonical JSON. */
  recordSha256: hex64,
  /** The fidelity-reviewer agent's record, as it returned it. */
  record: z.unknown(),
})
export type SealedReview = z.infer<typeof sealedReview>

export type InputFile = { readonly path: string; readonly sha256: string }

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')

/** JSON with each object's keys sorted, so equal records hash the same. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object' && value !== null)
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

/** The hash of a review's inputs: each file's path and content hash, in path order, and the library version. */
export function inputsDigest(files: readonly InputFile[], library: string): string {
  const lines = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((f) => `${f.path}\t${f.sha256}`)
  return sha256(`${lines.join('\n')}\nlibrary\t${library}\n`)
}

/** The library version pinned in the catalog of pnpm-workspace.yaml. */
function libraryVersion(workspaceYaml: string): string {
  const m = /^\s*"@eshelton328\/component-library-1701":\s*(\S+)\s*$/m.exec(workspaceYaml)
  if (m?.[1] === undefined)
    throw new Error('pnpm-workspace.yaml pins no @eshelton328/component-library-1701 in its catalog')
  return m[1]
}

/** The build files every story depends on, outside the import walk. */
const buildInputs: ReadonlySet<string> = new Set([
  'web/panda.config.ts',
  'web/vite.config.ts',
  'web/postcss.config.js',
  'pnpm-lock.yaml',
])

/**
 * The workspace packages and subpaths web imports by name, as their entry
 * file. A `@bridge/` specifier that is not here makes the walk throw, so
 * a new subpath can never drop an input from the hash.
 */
const packageEntries: Record<string, string> = {
  '@bridge/shared': 'shared/src/index.ts',
  '@bridge/contract': 'contract/src/index.ts',
  '@bridge/contract/push': 'contract/src/push.ts',
  '@bridge/server/client': 'server/src/client.ts',
}

/** Every module specifier in a source file: static and dynamic imports, side-effect imports and re-exports. */
export function importSpecifiers(source: string): string[] {
  const re = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm
  return [...source.matchAll(re)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))
}

/**
 * The repository path a specifier of `from` names, when it is one of
 * `known` (files git tracks or would track): a relative path or a
 * workspace package. A package from node_modules gives undefined; the
 * library's version stands for it.
 */
export function resolveImport(from: string, spec: string, known: ReadonlySet<string>): string | undefined {
  const entry = packageEntries[spec]
  if (entry !== undefined) return known.has(entry) ? entry : undefined
  if (spec.startsWith('@bridge/'))
    throw new Error(`${from} imports ${spec}, which the review seal does not know: add it to packageEntries`)
  if (!spec.startsWith('.')) return undefined
  const base = posix.normalize(posix.join(posix.dirname(from), spec))
  const stem = base.replace(/\.js$/, '')
  return [base, `${stem}.ts`, `${stem}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find((c) => known.has(c))
}

/**
 * The inputs of a PNG frame's review in `root`: the frame's reference
 * files (not the sealed record itself); the state file that lists the
 * frame, the page's stories, Storybook's own config (its preview draws
 * every story), the build configs (Panda, Vite, PostCSS) and the lockfile, and every repository file they import, transitively
 * (web/src, shared, contract; not generated or ignored files); and the
 * library version.
 */
export function reviewInputs(root: string, page: string, frameId: string): { files: InputFile[]; library: string } {
  const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
  // Listed by git but deleted in the work tree: not an input any more.
  const known = new Set(listed.split('\0').filter((p) => p !== '' && existsSync(join(root, p))))
  const frameFolder = `references/${page}/${frameId}/`
  const own = `${frameFolder}${reviewFileName}`
  const pageFolder = `web/src/pages/${page}/`
  const ref = parsePngRef(JSON.parse(readFileSync(join(root, frameFolder, 'reference.json'), 'utf8')), frameFolder)
  const state = stateForFrame(page, ref.code, join(root, 'web', 'src', 'pages'))
  const roots = [...known].filter(
    (p) =>
      (p.startsWith(frameFolder) && p !== own) ||
      p === `${pageFolder}states/${state ?? ''}.ts` ||
      (p.startsWith(pageFolder) && p.endsWith('.stories.tsx')) ||
      /^web\/\.storybook\/[^/]+\.tsx?$/.test(p) ||
      // Panda's config decides the generated CSS (styled-system/, not hashed) that every story draws with;
      // Vite's and PostCSS's configs build it, and the lockfile pins every package a story loads (fonts included).
      buildInputs.has(p),
  )
  const seen = new Set<string>()
  const queue = [...roots]
  for (let path = queue.pop(); path !== undefined; path = queue.pop()) {
    if (seen.has(path)) continue
    seen.add(path)
    if (!/\.(ts|tsx)$/.test(path)) continue
    for (const spec of importSpecifiers(readFileSync(join(root, path), 'utf8'))) {
      const next = resolveImport(path, spec, known)
      if (next !== undefined && !seen.has(next)) queue.push(next)
    }
  }
  const files = [...seen].map((path) => ({ path, sha256: sha256(readFileSync(join(root, path))) }))
  return { files, library: libraryVersion(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')) }
}

/**
 * Why a `--review` run cannot seal a record, or undefined when it can. A
 * record is for one frame's render, so the run names one frame. It must
 * build Storybook: with `--skip-build`, a Storybook built before a source
 * change would match the render the reviewer saw, and the seal would
 * take the new source's hash for an old render.
 */
export function reviewRunProblem(frames: number, skipBuild: boolean): string | undefined {
  if (frames !== 1) return '--review <file> takes one frame id: pnpm fidelity <page> <frameId> --review <file>'
  if (skipBuild)
    return '--review builds Storybook from the current source before it seals the record; run it without --skip-build'
  return undefined
}

/** The sealed record of a passing review of `frameId` whose inputs hash to `inputs`. */
export function sealReview(frameId: string, inputs: string, library: string, record: unknown): SealedReview {
  return { frameId, inputs, library, recordSha256: sha256(canonicalJson(record)), record }
}

export type SealCheck = {
  ok: boolean
  problem: 'missing' | 'invalid' | 'otherFrame' | 'edited' | 'stale' | 'gate' | null
  detail: string
}

/**
 * Checks a parsed review.json of `frameId` against the hash of its inputs
 * now: it must be this frame's, its record unedited, its inputs hash the
 * current one, and its record must pass the reviewer gate (no P1 or P2
 * finding, not unreviewable).
 */
export function checkSeal(data: unknown, frameId: string, inputs: string): SealCheck {
  const parsed = sealedReview.safeParse(data)
  if (!parsed.success) return { ok: false, problem: 'invalid', detail: z.prettifyError(parsed.error) }
  const sealed = parsed.data
  if (sealed.frameId !== frameId)
    return { ok: false, problem: 'otherFrame', detail: `the record is for ${sealed.frameId}, not ${frameId}` }
  if (sha256(canonicalJson(sealed.record)) !== sealed.recordSha256)
    return { ok: false, problem: 'edited', detail: 'the record differs from the one the review saved' }
  if (sealed.inputs !== inputs)
    return {
      ok: false,
      problem: 'stale',
      detail: 'the reference, the page source or the library changed since the review; review the frame again',
    }
  let gate
  try {
    gate = pngReviewGate(parseReview(sealed.record, `${frameId}/${reviewFileName}`), true)
  } catch (error) {
    return { ok: false, problem: 'invalid', detail: error instanceof Error ? error.message : String(error) }
  }
  return gate.ok
    ? { ok: true, problem: null, detail: gate.detail }
    : { ok: false, problem: 'gate', detail: gate.detail }
}

export type FrameSeal = SealCheck & { frame: string }

/**
 * Checks the sealed record of every PNG frame under `root`/references: a
 * frame that a state file lists (built) needs a current one, and a record
 * that exists is checked whether or not its frame is built.
 */
export function checkReviews(root: string): FrameSeal[] {
  const refs = join(root, 'references')
  const pages = existsSync(refs) ? readdirSync(refs, { withFileTypes: true }).filter((d) => d.isDirectory()) : []
  return pages.flatMap(({ name: page }) =>
    readdirSync(join(refs, page), { withFileTypes: true })
      .filter((d) => d.isDirectory() && frameKind(join(refs, page, d.name)) === 'png')
      .flatMap(({ name: frameId }): FrameSeal[] => {
        const dir = join(refs, page, frameId)
        const frame = `${page}/${frameId}`
        const file = join(dir, reviewFileName)
        const ref = parsePngRef(
          JSON.parse(readFileSync(join(dir, 'reference.json'), 'utf8')),
          join(dir, 'reference.json'),
        )
        const built = stateForFrame(page, ref.code, join(root, 'web', 'src', 'pages')) !== undefined
        if (!existsSync(file))
          return built
            ? [
                {
                  frame,
                  ok: false,
                  problem: 'missing',
                  detail: `a state lists ${ref.code}, but ${frame} has no ${reviewFileName}; run pnpm fidelity ${page} ${frameId} --review <file>`,
                },
              ]
            : []
        let data: unknown
        try {
          data = JSON.parse(readFileSync(file, 'utf8'))
        } catch (error) {
          return [
            { frame, ok: false, problem: 'invalid', detail: error instanceof Error ? error.message : String(error) },
          ]
        }
        const inputs = reviewInputs(root, page, frameId)
        return [{ frame, ...checkSeal(data, frameId, inputsDigest(inputs.files, inputs.library)) }]
      }),
  )
}
