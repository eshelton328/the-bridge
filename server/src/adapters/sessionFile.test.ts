import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claudeProjectFolder, readClaudeModel } from './sessionFile.ts'

const dir = mkdtempSync(join(tmpdir(), 'session-'))
const file = (name: string, text: string) => {
  const path = join(dir, name)
  writeFileSync(path, text)
  return path
}

describe('session file', () => {
  it('reads the model of the last assistant entry, past a synthetic one and a broken line', async () => {
    const path = file(
      'a.jsonl',
      [
        JSON.stringify({ type: 'assistant', message: { model: 'claude-sonnet-5-5' } }),
        JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5' } }),
        JSON.stringify({ type: 'assistant', message: { model: '<synthetic>' } }),
        '{"type": "user", "mess',
      ].join('\n'),
    )
    expect(await readClaudeModel(path)).toBe('claude-opus-5-5')
  })

  it('reads only the end of a long file', async () => {
    const old = JSON.stringify({ type: 'assistant', message: { model: 'claude-haiku-5-5' } })
    const filler = JSON.stringify({ type: 'user', message: { content: 'x'.repeat(70 * 1024) } })
    expect(await readClaudeModel(file('b.jsonl', `${old}\n${filler}\n`))).toBeNull()
  })

  it('gives null for a file that is missing or has no assistant entry', async () => {
    expect(await readClaudeModel(join(dir, 'missing.jsonl'))).toBeNull()
    expect(await readClaudeModel(file('c.jsonl', '{"type":"user"}\n'))).toBeNull()
  })

  it("names a working directory's folder as Claude Code does", () => {
    expect(claudeProjectFolder('/home/dev/ncc-1701/the.bridge')).toBe('-home-dev-ncc-1701-the-bridge')
  })
})
