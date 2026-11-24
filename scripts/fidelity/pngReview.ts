// The visual gate of a PNG reference (d-119): with no Figma layers, the
// text, position and icon checks cannot run, so a PNG frame passes only
// with a fidelity-reviewer record of its render that has no P1 or P2
// finding (bridge-coord's condition on #436). The record is the reviewer's
// JSON for this frame's side-by-side; `pnpm fidelity <page> <frameId>
// --review <file>` renders the frame again and takes the record only when
// the new render is the one the reviewer saw, byte for byte.
import { z } from 'zod'

/** The label every PNG frame's report carries. */
export const pngLabel = 'PNG reference: text, position and icons not checked'

/** The part of a fidelity-reviewer record the gate reads; the agent's own check validates the rest. */
const reviewRecord = z.object({
  verdict: z.enum(['match', 'differences', 'unreviewable']),
  findings: z.array(
    z.object({
      id: z.string(),
      priority: z.enum(['P1', 'P2', 'P3']),
      kind: z.string(),
      region: z.string(),
    }),
  ),
})

type ReviewFinding = z.infer<typeof reviewRecord>['findings'][number]

export type ReviewGate = {
  ok: boolean
  /** Why the frame fails; null when it passes. */
  problem: 'noReview' | 'renderChanged' | 'unreviewable' | 'findings' | 'seal' | null
  /** The P1 and P2 findings, which fail the frame. */
  blocking: ReviewFinding[]
  detail: string
}

/** Checks a parsed reviewer record; `file` names it in the error. */
export function parseReview(data: unknown, file: string): z.infer<typeof reviewRecord> {
  const parsed = reviewRecord.safeParse(data)
  if (!parsed.success) throw new Error(`${file}: not a fidelity-reviewer record: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

/**
 * The gate of a PNG frame: `review` is the reviewer's record (undefined
 * when none was given) and `sameRender` whether this run's render is
 * byte for byte the render the reviewer saw. Any P1 or P2 finding fails the
 * frame; P3 findings pass and stay in the record.
 */
export function pngReviewGate(review: z.infer<typeof reviewRecord> | undefined, sameRender: boolean): ReviewGate {
  if (review === undefined)
    return {
      ok: false,
      problem: 'noReview',
      blocking: [],
      detail: 'a PNG frame needs a fidelity-reviewer record of its side-by-side: pass --review <file>',
    }
  if (!sameRender)
    return {
      ok: false,
      problem: 'renderChanged',
      blocking: [],
      detail: 'the render differs from the one the reviewer saw; review the new side-by-side',
    }
  if (review.verdict === 'unreviewable')
    return { ok: false, problem: 'unreviewable', blocking: [], detail: 'the reviewer could not review the images' }
  const blocking = review.findings.filter((f) => f.priority === 'P1' || f.priority === 'P2')
  if (blocking.length > 0)
    return {
      ok: false,
      problem: 'findings',
      blocking,
      detail: `${String(blocking.length)} P1 or P2 finding(s): ${blocking.map((f) => `${f.id} ${f.priority} ${f.kind} (${f.region})`).join('; ')}`,
    }
  return { ok: true, problem: null, blocking: [], detail: 'the reviewer found no P1 or P2 difference' }
}
