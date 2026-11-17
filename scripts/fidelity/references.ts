// Reads the saved Figma references (references/<page>/<frameId>/) and the
// hand-written exceptions beside them, each checked with Zod.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import type { FrameRef } from './figmaMetadata.ts'

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

/** Hand-written exceptions for one frame; each needs a reason. */
const exceptions = z.object({
  /** Figma strings the render may leave out. */
  missing: z.array(z.object({ text: z.string(), reason })).default([]),
  /** Render strings Figma does not have that are allowed. */
  extra: z.array(z.object({ text: z.string(), reason })).default([]),
  /** data-figma keys whose box may differ. */
  position: z.array(z.object({ layer: z.string(), reason })).default([]),
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

export function readExceptions(page: string, frameId: string): Exceptions {
  const file = join(frameDir(page, frameId), 'exceptions.json')
  if (!existsSync(file)) return exceptions.parse({})
  const parsed = exceptions.safeParse(JSON.parse(readFileSync(file, 'utf8')))
  if (!parsed.success) throw new Error(`${file}: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}
