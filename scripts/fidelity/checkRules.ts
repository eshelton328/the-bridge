// The rule check (fidelity loop step 4): no text hidden by overflow, no
// visible scroll bar, the render fills the full height of its viewport
// (the frame less Figma's status bar on a tablet or phone, d-102), and no
// badge or pill stretched to its container's width. inPage.ts measures
// the first, second and fourth in the browser; this adds the height rule
// and applies the exceptions.
import { renderViewport } from './checkPosition.ts'
import type { FrameRef } from './figmaMetadata.ts'
import type { Box, RuleFinding } from './inPage.ts'
import type { Exceptions } from './references.ts'

export type RulesResult = { ok: boolean; findings: RuleFinding[]; excepted: RuleFinding[] }

export function checkRules(
  ref: Pick<FrameRef, 'w' | 'h' | 'device' | 'tolerance' | 'layers' | 'exclude'>,
  exceptions: Pick<Exceptions, 'rules'>,
  measured: { rules: readonly RuleFinding[]; rootBox: Box },
): RulesResult {
  const all = [...measured.rules]
  const { rootBox } = measured
  const { h, statusBar } = renderViewport(ref)
  const of = statusBar > 0 ? `${String(h)} px below its ${String(statusBar)} px status bar` : `${String(h)} px`
  if (rootBox.y > ref.tolerance || rootBox.y + rootBox.h < h - ref.tolerance)
    all.push({
      rule: 'fullHeight',
      selector: '#storybook-root > :first-child',
      detail: `the ${ref.device} render covers y ${String(Math.round(rootBox.y))}–${String(Math.round(rootBox.y + rootBox.h))} of the frame's ${of}`,
    })
  const isExcepted = (f: RuleFinding) => exceptions.rules.some((e) => e.rule === f.rule && e.selector === f.selector)
  const findings = all.filter((f) => !isExcepted(f))
  return { ok: findings.length === 0, findings, excepted: all.filter(isExcepted) }
}
