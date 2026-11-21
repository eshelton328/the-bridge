// Makes the status chat's fake agent lose its next Enter, as a terminal
// client can, so the prompt's text stays in its box (fakeAgent.ts).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inject } from 'vitest'

export function dropNextEnter(): Promise<void> {
  const folder = join(inject('claudeProjects'), 'drop-enter')
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, encodeURIComponent(inject('statusChat').title)), '')
  return Promise.resolve()
}
