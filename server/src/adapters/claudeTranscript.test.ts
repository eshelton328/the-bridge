import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { maxEntryText, maxTranscriptEntries, TranscriptEntry } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { withAttachments } from '../services/uploads.ts'
import { readClaudeTranscript } from './claudeTranscript.ts'

const dir = mkdtempSync(join(tmpdir(), 'transcript-'))
let files = 0
const file = (lines: readonly (object | string)[]) => {
  files += 1
  const path = join(dir, `${String(files)}.jsonl`)
  writeFileSync(path, lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n'))
  return path
}
const options = { working: true, cwd: '/home/dev/ncc-1701', home: '/home/dev' }
const user = (uuid: string, content: unknown, more: object = {}) => ({
  type: 'user',
  uuid,
  message: { content },
  ...more,
})
const assistant = (uuid: string, content: unknown[], more: object = {}) => ({
  type: 'assistant',
  uuid,
  message: { model: 'claude-opus-5-5', content },
  ...more,
})
const text = (t: string) => ({ type: 'text', text: t })
const toolUse = (id: string, command: string) => ({ type: 'tool_use', id, name: 'Bash', input: { command } })
const toolResult = (id: string, content: string) => ({ type: 'tool_result', tool_use_id: id, content })

describe('Claude transcript', () => {
  it('keeps prompts, reply text and tool calls in order, and drops thinking, results, side chains and meta lines', async () => {
    const path = file([
      { type: 'queue-operation', operation: 'enqueue' },
      user('u1', 'Fix the build'),
      assistant('a1', [{ type: 'thinking', thinking: 'private plan' }]),
      assistant('a2', [text('Checking.'), toolUse('t1', 'pnpm build')]),
      user('r1', [toolResult('t1', 'build output with a secret')]),
      assistant('s1', [text('a side chain reply')], { isSidechain: true }),
      user('m1', [text('<command-name>/clear</command-name>')], { isMeta: true }),
      assistant('a3', [text('**Fixed.**')]),
    ])
    const read = await readClaudeTranscript(path, options)
    expect(read).toEqual({
      entries: [
        { type: 'user', id: 'u1', text: 'Fix the build', cut: false },
        { type: 'assistant', id: 'a2:0', text: 'Checking.', cut: false },
        { type: 'tool', id: 't1', name: 'Bash', target: 'pnpm', running: false },
        { type: 'assistant', id: 'a3:0', text: '**Fixed.**', cut: false },
      ],
      earlier: false,
    })
    for (const entry of read.entries) TranscriptEntry.parse(entry)
    const json = JSON.stringify(read)
    for (const hidden of ['private plan', 'build output', 'side chain', '/clear']) expect(json).not.toContain(hidden)
  })

  it("shows a prompt the bridge sent as the owner's text, with no paste tags, and its files by name", async () => {
    const paste = (id: string, t: string) => `\n\n<pasted_content id="${id}">\n${t}\n</pasted_content id="${id}">\n`
    const uploads = '/home/dev/.local/share/the-bridge/uploads'
    const path = file([
      user(
        'p1',
        paste(
          '4251',
          withAttachments('Look at these.\n\nTwo lines.', [`${uploads}/u1/plan.pdf`, `${uploads}/u2/photo.jpg`]),
        ),
      ),
      user('p2', paste('ec42', withAttachments('', [`${uploads}/u3/notes.md`]))),
      user('p3', `Before ${paste('2602', 'a pasted log')} after`),
      user('p4', 'Attached files (read each one with your tools):\n- not a path'),
      user('p5', withAttachments('Read this', ['/etc/hosts'])),
    ])
    const read = await readClaudeTranscript(path, { ...options, uploads })
    expect(read.entries).toEqual([
      { type: 'user', id: 'p1', text: 'Look at these.\n\nTwo lines.', cut: false, files: ['plan.pdf', 'photo.jpg'] },
      { type: 'user', id: 'p2', text: '', cut: false, files: ['notes.md'] },
      { type: 'user', id: 'p3', text: 'Before \n\na pasted log\n after', cut: false },
      { type: 'user', id: 'p4', text: 'Attached files (read each one with your tools):\n- not a path', cut: false },
      // A path outside the uploads folder is the owner's own text.
      { type: 'user', id: 'p5', text: withAttachments('Read this', ['/etc/hosts']), cut: false },
    ])
    for (const entry of read.entries) TranscriptEntry.parse(entry)
    expect(JSON.stringify(read.entries.slice(0, 3))).not.toMatch(/pasted_content|\/home\/dev/)
  })

  it('keeps the indent of a first line in a paste, as a Markdown code block needs', async () => {
    const path = file([
      user('c1', '\n\n<pasted_content id="77">\n    pnpm build\n    pnpm test\n</pasted_content id="77">\n'),
    ])
    expect((await readClaudeTranscript(path, options)).entries).toEqual([
      { type: 'user', id: 'c1', text: '    pnpm build\n    pnpm test', cut: false },
    ])
  })

  it('shows a slash command as the owner typed it, its error output as an error, and drops its other output and the compact summary', async () => {
    const command = (name: string, args: string) =>
      `<command-name>/${name}</command-name>\n<command-message>${name}</command-message>\n<command-args>${args}</command-args>`
    const path = file([
      user('k1', command('compact', 'keep the plan')),
      user('k2', '<local-command-stdout>Compacted. ctrl+o to see full summary</local-command-stdout>'),
      user('k3', 'This session is being continued from a previous conversation.', { isCompactSummary: true }),
      user('k4', command('clear', '')),
      user('k5', '<local-command-stderr>Error: no such command</local-command-stderr>'),
      user('k6', 'Why does <command-name> show up here?'),
      user('k7', '<local-command-stdout> is showing in my transcript. Why?'),
      user('k8', '<local-command-stderr> shows too'),
    ])
    expect((await readClaudeTranscript(path, options)).entries).toEqual([
      { type: 'user', id: 'k1', text: '/compact keep the plan', cut: false },
      { type: 'user', id: 'k4', text: '/clear', cut: false },
      { type: 'error', id: 'k5', text: 'Error: no such command', cut: false },
      { type: 'user', id: 'k6', text: 'Why does <command-name> show up here?', cut: false },
      { type: 'user', id: 'k7', text: '<local-command-stdout> is showing in my transcript. Why?', cut: false },
      { type: 'user', id: 'k8', text: '<local-command-stderr> shows too', cut: false },
    ])
  })

  it('shows a tool call with no result as running only while the chat is working', async () => {
    const path = file([assistant('a1', [toolUse('t1', 'pnpm test')])])
    expect((await readClaudeTranscript(path, options)).entries[0]).toMatchObject({ running: true })
    expect((await readClaudeTranscript(path, { ...options, working: false })).entries[0]).toMatchObject({
      running: false,
    })
  })

  it('skips a line that is not JSON, in the middle and at the end, where Claude Code still writes', async () => {
    const path = file([
      user('u1', 'first'),
      '{"type": "assistant", "uu',
      user('u2', 'second'),
      '{"type":"user","uuid":"u3","mess',
    ])
    expect((await readClaudeTranscript(path, options)).entries.map((e) => e.id)).toEqual(['u1', 'u2'])
  })

  it(`gives the last ${String(maxTranscriptEntries)} entries of a long file, with earlier`, async () => {
    const filler = 'x'.repeat(4000)
    const lines = Array.from({ length: 700 }, (_, i) => user(`u${String(i)}`, `${String(i)} ${filler}`))
    const read = await readClaudeTranscript(file(lines), options)
    expect(read.earlier).toBe(true)
    expect(read.entries).toHaveLength(maxTranscriptEntries)
    expect(read.entries[0]?.id).toBe('u200')
    expect(read.entries.at(-1)?.id).toBe('u699')
  })

  it('cuts text over the limit and marks it cut', async () => {
    const read = await readClaudeTranscript(file([user('u1', 'y'.repeat(maxEntryText + 10))]), options)
    expect(read.entries[0]).toMatchObject({ cut: true })
    expect(read.entries[0]?.type === 'user' ? read.entries[0].text.length : 0).toBe(maxEntryText)
  })

  it('keeps one entry for an ID that the file has twice, the later one', async () => {
    const path = file([user('u1', 'old'), user('u1', 'new')])
    expect((await readClaudeTranscript(path, options)).entries).toEqual([
      { type: 'user', id: 'u1', text: 'new', cut: false },
    ])
  })

  it('keeps a character whole when a 1 MiB part starts inside it, and when a cut falls inside it', async () => {
    const emoji = String.fromCodePoint(0x1f600)
    const replacement = String.fromCodePoint(0xfffd)
    for (const pad of ['', 'a', 'ab', 'abc']) {
      const long = `${pad}${emoji.repeat(300_000)}`
      const path = file([user('u1', long), user('u2', `end ${emoji}`)])
      const read = await readClaudeTranscript(path, options)
      const texts = read.entries.map((e) => (e.type === 'tool' ? '' : e.text))
      expect(texts[1]).toBe(`end ${emoji}`)
      expect(texts[0]?.includes(replacement)).toBe(false)
      expect(texts[0]?.startsWith(`${pad}${emoji}`)).toBe(true)
      expect((texts[0] ?? '').slice(pad.length).replaceAll(emoji, '')).toBe('')
    }
  })

  it('gives no entries for a missing file', async () => {
    expect(await readClaudeTranscript(join(dir, 'missing.jsonl'), options)).toEqual({ entries: [], earlier: false })
  })
})
