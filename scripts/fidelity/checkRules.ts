// The rule check (fidelity loop step 4): no text hidden by overflow, no
// visible scroll bar, the render fills the frame's full height, and no
// badge or pill stretched to its container's width. inPage.ts measures
// the first, second and fourth in the browser; this adds the height rule
// and applies the exceptions.
import type { FrameRef } from './figmaMetadata.ts'
import type { Box, RuleFinding } from './inPage.ts'
import type { Exceptions } from './references.ts'

export type RulesResult = { ok: boolean; findings: RuleFinding[]; excepted: RuleFinding[] }

export function checkRules(
  ref: Pick<FrameRef, 'h' | 'device' | 'tolerance'>,
  exceptions: Pick<Exceptions, 'rules'>,
  measured: { rules: readonly RuleFinding[]; rootBox: Box },
): RulesResult {
  const all = [...measured.rules]
  const { rootBox } = measured
  if (rootBox.y > ref.tolerance || rootBox.y + rootBox.h < ref.h - ref.tolerance)
    all.push({
      rule: 'fullHeight',
      selector: '#storybook-root > :first-child',
      detail: `the ${ref.device} render covers y ${String(Math.round(rootBox.y))}–${String(Math.round(rootBox.y + rootBox.h))} of the frame's ${String(ref.h)} px`,
    })
  const isExcepted = (f: RuleFinding) => exceptions.rules.some((e) => e.rule === f.rule && e.selector === f.selector)
  const findings = all.filter((f) => !isExcepted(f))
  return { ok: findings.length === 0, findings, excepted: all.filter(isExcepted) }
}
