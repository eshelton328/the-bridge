import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claudeProjectFolder, readClaudeSession } from './sessionFile.ts'

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
    expect((await readClaudeSession(path)).model).toBe('claude-opus-5-5')
  })

  it('reads only the end of a long file', async () => {
    const old = JSON.stringify({ type: 'assistant', message: { model: 'claude-haiku-5-5' } })
    const filler = JSON.stringify({ type: 'user', message: { content: 'x'.repeat(70 * 1024) } })
    expect(await readClaudeSession(file('b.jsonl', `${old}\n${filler}\n`))).toEqual({ model: null, contextUsed: null })
  })

  it('gives null for a file that is missing or has no assistant entry', async () => {
    expect(await readClaudeSession(join(dir, 'missing.jsonl'))).toEqual({ model: null, contextUsed: null })
    expect(await readClaudeSession(file('c.jsonl', '{"type":"user"}\n'))).toEqual({ model: null, contextUsed: null })
  })

  it("gives the last request's share of the model's context window, from its input and cache tokens", async () => {
    const usage = {
      input_tokens: 2,
      cache_read_input_tokens: 295_000,
      cache_creation_input_tokens: 4_998,
      output_tokens: 900,
    }
    const path = file(
      'd.jsonl',
      [
        JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5', usage } }),
        JSON.stringify({
          type: 'assistant',
          isSidechain: true,
          message: { model: 'claude-haiku-5-5', usage: { input_tokens: 10 } },
        }),
      ].join('\n'),
    )
    expect(await readClaudeSession(path)).toEqual({ model: 'claude-opus-5-5', contextUsed: 0.3 })
  })

  it('gives no share for a model whose window it does not know, and at most 1', async () => {
    const line = (model: string, input: number) =>
      JSON.stringify({ type: 'assistant', message: { model, usage: { input_tokens: input } } })
    expect(await readClaudeSession(file('e.jsonl', line('claude-next-9', 1000)))).toEqual({
      model: 'claude-next-9',
      contextUsed: null,
    })
    expect((await readClaudeSession(file('f.jsonl', line('claude-haiku-4-5', 250_000)))).contextUsed).toBe(1)
    expect((await readClaudeSession(file('g.jsonl', line('claude-haiku-4-5', 50_000)))).contextUsed).toBe(0.25)
  })

  it("gives no share for a model whose window the session picks, and a dated ID its alias's window", async () => {
    const line = (model: string, input: number) =>
      JSON.stringify({ type: 'assistant', message: { model, usage: { input_tokens: input } } })
    for (const model of ['claude-opus-4-6', 'claude-sonnet-4-6'])
      expect((await readClaudeSession(file(`${model}.jsonl`, line(model, 100_000)))).contextUsed).toBeNull()
    const dated = await readClaudeSession(file('h.jsonl', line('claude-haiku-4-5-20251001', 100_000)))
    expect(dated).toEqual({ model: 'claude-haiku-4-5-20251001', contextUsed: 0.5 })
  })

  it("names a working directory's folder as Claude Code does", () => {
    expect(claudeProjectFolder('/home/dev/ncc-1701/the.bridge')).toBe('-home-dev-ncc-1701-the-bridge')
  })
})
