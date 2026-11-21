import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claudeProjectFolder, modelAliasOf, readClaudeSession } from './sessionFile.ts'

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

  it('reads further back past long lines after the reply, up to its limit', async () => {
    const reply = JSON.stringify({ type: 'assistant', message: { model: 'claude-haiku-5-5' } })
    const prompt = JSON.stringify({ type: 'user', perTurnEffort: 'low', message: { content: 'go' } })
    // Claude Code writes lines of 80 KB and more (a prompt snapshot) after a reply.
    const filler = JSON.stringify({ type: 'prompt_snapshot', text: 'x'.repeat(80 * 1024) })
    const path = file('b.jsonl', [prompt, reply, filler, filler, filler].join('\n') + '\n')
    expect(await readClaudeSession(path)).toEqual({ model: 'claude-haiku-5-5', contextUsed: null, effort: 'low' })
    // A reply further back than the limit is not read.
    expect(await readClaudeSession(path, 128 * 1024)).toEqual({ model: null, contextUsed: null, effort: null })
  })

  it('gives null for a file that is missing or has no assistant entry', async () => {
    expect(await readClaudeSession(join(dir, 'missing.jsonl'))).toEqual({
      model: null,
      contextUsed: null,
      effort: null,
    })
    expect(await readClaudeSession(file('c.jsonl', '{"type":"user"}\n'))).toEqual({
      model: null,
      contextUsed: null,
      effort: null,
    })
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
    expect(await readClaudeSession(path)).toEqual({ model: 'claude-opus-5-5', contextUsed: 0.3, effort: null })
  })

  it('gives no share for a model whose window it does not know, and at most 1', async () => {
    const line = (model: string, input: number) =>
      JSON.stringify({ type: 'assistant', message: { model, usage: { input_tokens: input } } })
    expect(await readClaudeSession(file('e.jsonl', line('claude-next-9', 1000)))).toEqual({
      model: 'claude-next-9',
      contextUsed: null,
      effort: null,
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
    expect(dated).toEqual({ model: 'claude-haiku-4-5-20251001', contextUsed: 0.5, effort: null })
  })

  it("reads the effort of the newest entry that names one, the turn's own first, past a subagent's", async () => {
    const path = file(
      'i.jsonl',
      [
        JSON.stringify({
          type: 'assistant',
          effort: 'medium',
          perTurnEffort: 'medium',
          message: { model: 'claude-opus-5-5' },
        }),
        JSON.stringify({ type: 'user', effort: 'medium', perTurnEffort: 'xhigh', message: { content: 'go' } }),
        JSON.stringify({
          type: 'assistant',
          isSidechain: true,
          perTurnEffort: 'low',
          message: { model: 'claude-haiku-5-5' },
        }),
        JSON.stringify({ type: 'system', effort: 'turbo' }),
      ].join('\n'),
    )
    expect(await readClaudeSession(path)).toEqual({ model: 'claude-opus-5-5', contextUsed: null, effort: 'xhigh' })
    // The prompt names its turn's effort, and the reply after it names none.
    const older = file(
      'k.jsonl',
      [
        JSON.stringify({ type: 'user', perTurnEffort: 'high', message: { content: 'go' } }),
        JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5' } }),
      ].join('\n'),
    )
    expect(await readClaudeSession(older)).toEqual({ model: 'claude-opus-5-5', contextUsed: null, effort: 'high' })
    const effortOnly = file('j.jsonl', JSON.stringify({ type: 'user', effort: 'max' }))
    expect(await readClaudeSession(effortOnly)).toEqual({ model: null, contextUsed: null, effort: 'max' })
  })

  it('names the family of a Claude model ID, and none for another model', () => {
    expect(modelAliasOf('claude-opus-5-5')).toBe('opus')
    expect(modelAliasOf('claude-haiku-4-5-20251001')).toBe('haiku')
    expect(modelAliasOf('claude-fable-5')).toBe('fable')
    expect(modelAliasOf('claude-sonnet')).toBe('sonnet')
    for (const model of ['gpt-5.5', 'claude-next-9', 'claude-opusx-1', null]) expect(modelAliasOf(model)).toBeNull()
  })

  it("names a working directory's folder as Claude Code does", () => {
    expect(claudeProjectFolder('/home/dev/ncc-1701/the.bridge')).toBe('-home-dev-ncc-1701-the-bridge')
  })
})
