// The contract suite of the Linear port (f-008 increment three): the fake and
// the GraphQL adapter (with a stub fetch) both run it.
import { describe, expect, it } from 'vitest'
import type { LinearIssue, LinearIssues } from '../services/qa.ts'

const issue = (key: string, labels: string[], state = 'QA'): LinearIssue => ({
  key,
  title: `Work of ${key}`,
  url: `https://linear.app/example/issue/${key.toLowerCase()}`,
  state,
  labels,
  comments: [{ id: `${key}-c`, body: 'QA check\nPR: 1', createdAt: '2026-11-27T10:00:00.000Z' }],
})

/** The teams the suite gives `make`: a port must answer as if Linear held these. */
export const contractTeams: Readonly<Record<string, readonly LinearIssue[]>> = {
  NCC: [issue('NCC-1', ['Branch']), issue('NCC-2', ['Main', 'change'], 'Done'), issue('NCC-3', ['flake'])],
  OTH: [issue('OTH-1', ['Branch'])],
}

export function linearPortContract(make: () => LinearIssues) {
  describe('the Linear port contract', () => {
    it('gives the issues of the team with one of the labels, with their comments, in any state', async () => {
      const read = await make().qaIssues('NCC', ['Branch', 'Main'])
      expect(read.ok && read.value.map((i) => i.key).sort()).toEqual(['NCC-1', 'NCC-2'])
      expect(read.ok && read.value.find((i) => i.key === 'NCC-2')).toEqual(contractTeams.NCC?.[1])
    })
    it('gives none for a team with no such issue', async () => {
      expect(await make().qaIssues('NONE', ['Branch'])).toEqual({ ok: true, value: [] })
    })
  })
}
