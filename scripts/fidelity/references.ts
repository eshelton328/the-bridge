// Reads the saved references (references/<page>/<frameId>/) and the
// hand-written exceptions beside them, each checked with Zod. A frame is a
// Figma frame (frame.json and frame.png) or, for a page with no Figma frame,
// a PNG reference (reference.json and frame.png, d-119).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { normaliseFrameId, type FrameRef } from './figmaMetadata.ts'

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
export const referencesDir = join(repoRoot, 'references')
export const reportsDir = join(repoRoot, 'reports', 'fidelity')

const layer = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  path: z.string(),
  text: z.string().optional(),
})

const frameRef = z.object({
  frameId: z.string(),
  code: z.string(),
  name: z.string(),
  node: z.string(),
  fileKey: z.string(),
  device: z.enum(['desktop', 'tablet', 'phone']),
  w: z.number(),
  h: z.number(),
  tolerance: z.number().nonnegative(),
  source: z.string(),
  layers: z.array(layer),
  exclude: z.array(z.object({ id: z.string(), text: z.string(), reason: z.string() })),
  skipped: z.record(z.string(), z.number()),
}) satisfies z.ZodType<FrameRef>

const reason = z.string().min(1)

/**
 * reference.json: a PNG reference for a page with no Figma frame (d-119),
 * written by hand. The PNG has no layers, so only the checks in
 * `pngChecks` can run against it.
 */
const pngRef = z
  .strictObject({
    frameId: z.string().regex(/^[A-Z]\d{2}[a-z]?$/, 'must be a frame id such as D01 or M02b'),
    code: z.string(),
    name: z.string().min(1),
    device: z.enum(['desktop', 'tablet', 'phone']),
    /** The frame's size in CSS px; frame.png is this size, at 1:1. */
    w: z.int().positive(),
    h: z.int().positive(),
    /** The colour scheme the render's browser reports (prefers-color-scheme). */
    mode: z.enum(['light', 'dark']),
    /** The full-height rule's slack in px, as a Figma frame's tolerance. */
    tolerance: z.number().nonnegative(),
    /** Where the picture comes from, such as "lab a52ab2d4 + d-119". */
    source: z.string().min(1),
    /** The original picture that frame.png was scaled from. */
    original: z.strictObject({
      file: z.string().min(1),
      w: z.int().positive(),
      h: z.int().positive(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/, 'must be a sha256 in hex'),
    }),
  })
  .superRefine((r, ctx) => {
    if (normaliseFrameId(r.code) !== r.frameId)
      ctx.addIssue({ code: 'custom', path: ['code'], message: `code ${r.code} is not frame ${r.frameId}` })
    const letter = r.device === 'desktop' ? 'D' : r.device === 'tablet' ? 'T' : 'M'
    if (!r.frameId.startsWith(letter))
      ctx.addIssue({ code: 'custom', path: ['frameId'], message: `a ${r.device} frame id starts with ${letter}` })
    if (r.original.w * r.h !== r.original.h * r.w)
      ctx.addIssue({ code: 'custom', path: ['original'], message: "the original must have the frame's aspect ratio" })
  })

export type PngRef = z.infer<typeof pngRef>

/** Hand-written exceptions for one frame; each needs a reason. */
const exceptions = z.object({
  /**
   * Figma strings the render may leave out, each in the text layers named by
   * id; the same string in another layer is still checked (d-101).
   */
  missing: z.array(z.object({ text: z.string(), layers: z.array(z.string()).min(1), reason })).default([]),
  /** Render strings Figma does not have that are allowed. */
  extra: z.array(z.object({ text: z.string(), reason })).default([]),
  /** data-figma keys whose box may differ. */
  position: z
    .array(
      z.object({
        layer: z.string(),
        /**
         * For an iconSize diff: the size in px the render draws the icon at
         * in place of Figma's. Only that size (± the icon slack) passes; with
         * no iconSize the entry passes the icon at any size.
         */
        iconSize: z.number().positive().optional(),
        reason,
      }),
    )
    .default([]),
  /** Rule findings to accept, by rule and CSS selector of the element. */
  rules: z.array(z.object({ rule: z.string(), selector: z.string(), reason })).default([]),
})

export type Exceptions = z.infer<typeof exceptions>

export function frameDir(page: string, frameId: string): string {
  return join(referencesDir, page, frameId)
}

/**
 * A position tolerance in px from the command line: a plain number of 0 or
 * more ("4", "2.5"). "4px", "", "-1" or "Infinity" would let every box pass
 * or none, so each is an error that names `source`.
 */
export function parseTolerance(value: string, source: string): number {
  const n = /^\s*\d+(\.\d+)?\s*$/.test(value) ? Number(value) : Number.NaN
  if (!Number.isFinite(n) || n < 0)
    throw new Error(`${source}: the tolerance must be a number of px, 0 or more, such as 4; got "${value}"`)
  return n
}

/** The three checks of a frame; `--checks` picks which of them decide its result. */
export const fidelityChecks = ['text', 'position', 'rules'] as const
/**
 * The names --checks takes: the three checks, and `icons`, the iconSize
 * part of the position check alone, so CI can gate a page's icon sizes
 * before its other position diffs are gone.
 */
export const gateChecks = [...fidelityChecks, 'icons'] as const
export type GateCheck = (typeof gateChecks)[number]

/** Each gate name's result from a frame's three check results. */
export function gateResults(r: {
  text: { ok: boolean }
  position: { ok: boolean; diffs: readonly { problem: string }[] }
  rules: { ok: boolean }
}): Record<GateCheck, boolean> {
  return {
    text: r.text.ok,
    position: r.position.ok,
    rules: r.rules.ok,
    icons: !r.position.diffs.some((d) => d.problem === 'iconSize'),
  }
}

/** Parses `--checks text,rules`: one or more check names, comma-separated, each once. */
export function parseChecks(value: string, source: string): GateCheck[] {
  const names = value.split(',').map((s) => s.trim())
  const picked: GateCheck[] = []
  for (const name of names) {
    const check = gateChecks.find((c) => c === name)
    if (check === undefined || picked.includes(check))
      throw new Error(
        `${source}: name each check once, from ${gateChecks.join(', ')}, such as text,rules; got "${value}"`,
      )
    picked.push(check)
  }
  return picked
}

/** Checks a parsed frame.json; `file` names it in the error. */
export function parseFrameRef(data: unknown, file: string): FrameRef {
  const parsed = frameRef.safeParse(data)
  if (!parsed.success) throw new Error(`${file}: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

export function readFrameRef(page: string, frameId: string): FrameRef {
  const file = join(frameDir(page, frameId), 'frame.json')
  return parseFrameRef(JSON.parse(readFileSync(file, 'utf8')), file)
}

/** The checks a PNG reference can run: it has no Figma layers for text, position or icons. */
const pngChecks = ['rules'] as const satisfies readonly GateCheck[]

/** Checks a parsed reference.json; `file` names it in the error. */
export function parsePngRef(data: unknown, file: string): PngRef {
  const parsed = pngRef.safeParse(data)
  if (!parsed.success) throw new Error(`${file}: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

export function readPngRef(page: string, frameId: string): PngRef {
  const file = join(frameDir(page, frameId), 'reference.json')
  return parsePngRef(JSON.parse(readFileSync(file, 'utf8')), file)
}

/**
 * What a frame folder holds: a Figma frame (frame.json), a PNG reference
 * (reference.json) or neither. Both at once is an error, so a PNG reference
 * can never stand in for a Figma frame's checks.
 */
export function frameKind(dir: string): 'figma' | 'png' | undefined {
  const figma = existsSync(join(dir, 'frame.json'))
  const png = existsSync(join(dir, 'reference.json'))
  if (figma && png) throw new Error(`${dir} has both frame.json and reference.json; keep one`)
  return figma ? 'figma' : png ? 'png' : undefined
}

/**
 * The checks that decide a PNG frame's result: those of `--checks`, or all
 * of `pngChecks` without it. A check that needs Figma layers is an error,
 * never a pass.
 */
export function checksForPng(picked: readonly GateCheck[] | undefined): GateCheck[] {
  if (picked === undefined) return [...pngChecks]
  const needFigma = picked.filter((c) => !pngChecks.some((p) => p === c))
  if (needFigma.length > 0)
    throw new Error(
      `A PNG reference has no Figma layers, so it cannot run ${needFigma.join(', ')}; it runs ${pngChecks.join(', ')}`,
    )
  return [...picked]
}

/** Checks a parsed exceptions.json; `file` names it in the error. */
export function parseExceptions(data: unknown, file: string): Exceptions {
  const parsed = exceptions.safeParse(data)
  if (!parsed.success) throw new Error(`${file}: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

export function readExceptions(page: string, frameId: string): Exceptions {
  const file = join(frameDir(page, frameId), 'exceptions.json')
  if (!existsSync(file)) return exceptions.parse({})
  return parseExceptions(JSON.parse(readFileSync(file, 'utf8')), file)
}
