// Adds a prompt to the fake chat's session file (fakeAgent.ts), as Claude
// Code would, for the contract suite's transcript watch case. The file is
// <claude projects>/<folder>/fake-e2e-session.jsonl.
import { appendFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { inject } from 'vitest'

let appended = 0

export function appendTranscript(): Promise<void> {
  const projects = inject('claudeProjects')
  const folder = readdirSync(projects).find((f) => readdirSync(join(projects, f)).includes('fake-e2e-session.jsonl'))
  if (folder === undefined) throw new Error('no fake-e2e-session.jsonl in the claude projects folder')
  appended += 1
  const line = { type: 'user', uuid: `e2e-appended-${String(appended)}`, message: { role: 'user', content: 'Go on.' } }
  appendFileSync(join(projects, folder, 'fake-e2e-session.jsonl'), `${JSON.stringify(line)}\n`)
  return Promise.resolve()
}
