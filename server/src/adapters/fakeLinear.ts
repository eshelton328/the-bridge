// The fake of the Linear port (f-008 increment three) for tests: the issues
// of each team, as given, and the number of reads. No network.
import { ok } from '@bridge/shared'
import type { LinearIssue, LinearIssues } from '../services/qa.ts'

export type FakeIssue = LinearIssue

/** A Linear that holds `teams` (team key to issues) and counts each read. */
export function createFakeLinear(teams: Readonly<Record<string, readonly FakeIssue[]>>): LinearIssues & {
  readonly reads: () => number
} {
  let reads = 0
  return {
    qaIssues(team, labels) {
      reads += 1
      const issues = teams[team] ?? []
      return Promise.resolve(ok(issues.filter((i) => i.labels.some((l) => labels.includes(l)))))
    },
    reads: () => reads,
  }
}
