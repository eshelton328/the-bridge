// What a fake agent's chat got from the owner (fakeAgent.ts): `text:<prompt>`
// for each prompt and `stop` for each Escape, in order, for the contract
// suite's input cases.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inject } from 'vitest'

export function receivedBy(title: string): Promise<string[]> {
  const file = join(inject('claudeProjects'), 'received', `${encodeURIComponent(title)}.jsonl`)
  if (!existsSync(file)) return Promise.resolve([])
  const items = readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line): unknown => JSON.parse(line))
  return Promise.resolve(
    items.map((item) =>
      typeof item === 'object' && item !== null && 'text' in item ? `text:${String(item.text)}` : 'stop',
    ),
  )
}
