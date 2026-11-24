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
        {
          type: 'tool',
          id: 't1',
          name: 'Bash',
          target: 'pnpm',
          running: false,
          kind: 'shell',
          title: 'Ran a command',
          label: '',
        },
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

  it('shows a prompt sent while the chat worked, at its place, and a queued peer message as a note', async () => {
    // The shape of a queued_command line that Claude Code 2.1 writes (an owner's prompt: origin "human", humanTurn);
    // the text is an example.
    const queued = (uuid: string, attachment: object) => ({
      type: 'attachment',
      uuid,
      parentUuid: 'p0',
      timestamp: '2026-11-21T08:00:00.000Z',
      attachment: {
        type: 'queued_command',
        source_uuid: 's0',
        delivery_id: 'd0',
        commandMode: 'prompt',
        timestamp: '2026-11-21T08:00:00.000Z',
        ...attachment,
      },
    })
    const uploads = '/home/dev/.local/share/the-bridge/uploads'
    const path = file(
      [
        user('u1', 'Run the tests'),
        assistant('a1', [text('Running.')]),
        { type: 'queue-operation', operation: 'enqueue', content: 'Also check the lint' },
        queued('q1', { prompt: 'Also check the lint', origin: { kind: 'human' }, humanTurn: true }),
        queued('q2', {
          prompt: withAttachments('See this screen', [`${uploads}/u-1/screen.png`]),
          origin: { kind: 'human' },
          humanTurn: true,
        }),
        queued('q3', {
          prompt: 'a peer message',
          origin: { kind: 'peer', name: 'bridge-coord', from: 'uds:/tmp/x.sock' },
          isMeta: true,
        }),
        queued('q4', { prompt: 'a task report', origin: { kind: 'task' }, runId: 'r1' }),
        queued('q5', { prompt: 'a side chain prompt', origin: { kind: 'human' }, humanTurn: true }),
        queued('q6', { prompt: 'not a human turn', origin: { kind: 'human' }, humanTurn: false }),
        assistant('a2', [text('Lint is clean.')]),
      ].map((l, i) => (i === 7 ? { ...l, isSidechain: true } : l)),
    )
    const read = await readClaudeTranscript(path, { ...options, uploads })
    expect(read.entries).toEqual([
      { type: 'user', id: 'u1', text: 'Run the tests', cut: false },
      { type: 'assistant', id: 'a1:0', text: 'Running.', cut: false },
      { type: 'user', id: 'q1', text: 'Also check the lint', cut: false },
      { type: 'user', id: 'q2', text: 'See this screen', cut: false, files: ['screen.png'] },
      { type: 'note', id: 'q3', kind: 'peer', text: 'Message from bridge-coord' },
      { type: 'assistant', id: 'a2:0', text: 'Lint is clean.', cut: false },
    ])
  })

  it('shows only what the owner typed as a prompt, harness inputs as notes, by origin and isMeta (R46)', async () => {
    // Example lines in the shapes that Claude Code writes; the text is made up.
    const task = [
      '<task-notification>',
      '<task-id>b1</task-id>',
      '<status>completed</status>',
      '<summary>Agent "Check the PR text"\n finished</summary>',
      '</task-notification>',
    ].join('\n')
    const path = file([
      user('h1', 'we can resume now', { origin: { kind: 'human' } }),
      user('o1', 'an older prompt with no origin'),
      user('t1', task, { origin: { kind: 'task-notification', producer: 'session-task', runId: 'r1' } }),
      user('t2', 'no wrapper here', { origin: { kind: 'task-notification' } }),
      user(
        'p1',
        'Another Claude session sent a message: <cross-session-message from="uds:/tmp/x.sock">hi</cross-session-message>',
        { isMeta: true, origin: { kind: 'peer', name: 'bridge-\x07coord', from: 'uds:/tmp/x.sock', msg_id: 'm1' } },
      ),
      user('s1', 'Stop hook feedback:\nYour last reply does not follow the rule.', { isMeta: true }),
      user('i1', '[Cross-session idle notice] the other chat is idle', { isMeta: true }),
      user('k1', [text('the body of a skill')], { isMeta: true, sourceToolUseID: 't9' }),
      user('x1', 'from a channel', { origin: { kind: 'channel' } }),
      // The owner's own text that holds the wrapper's words stays the owner's.
      user('h2', '<task-notification> is what I saw, and Stop hook feedback: too', { origin: { kind: 'human' } }),
      user('h3', 'Stop hook feedback: typed by me'),
      assistant('m1', [text('a meta reply')], { isMeta: true }),
    ])
    const read = await readClaudeTranscript(path, options)
    expect(read.entries).toEqual([
      { type: 'user', id: 'h1', text: 'we can resume now', cut: false },
      { type: 'user', id: 'o1', text: 'an older prompt with no origin', cut: false },
      { type: 'note', id: 't1', kind: 'task', text: 'Background task finished: Agent "Check the PR text" finished' },
      { type: 'note', id: 't2', kind: 'task', text: 'Background task update' },
      {
        type: 'note',
        id: 'p1',
        kind: 'peer',
        text: 'Message from bridge- coord',
        message: { from: 'bridge- coord', via: 'message', text: 'hi', cut: false },
      },
      { type: 'note', id: 's1', kind: 'hook', text: 'Stop hook: reply rewritten' },
      {
        type: 'user',
        id: 'h2',
        text: '<task-notification> is what I saw, and Stop hook feedback: too',
        cut: false,
      },
      { type: 'user', id: 'h3', text: 'Stop hook feedback: typed by me', cut: false },
    ])
    for (const entry of read.entries) TranscriptEntry.parse(entry)
  })

  it('marks each reply that a Stop hook sent back with the reply that replaced it (R62)', async () => {
    // Example lines in the shapes that Claude Code writes when its Stop hook rejects a reply; the text is made up.
    const hook = (uuid: string) => user(uuid, 'Stop hook feedback:\nThe reply breaks a rule.', { isMeta: true })
    const read = async (lines: object[]) =>
      (await readClaudeTranscript(file(lines), options)).entries.flatMap((e) =>
        // An entry's ID is its line's uuid and the block's place in the line ("a1:0").
        e.type === 'assistant'
          ? [{ id: e.id.replace(/:\d+$/, ''), replacedBy: e.replacedBy?.replace(/:\d+$/, '') }]
          : [],
      )
    // One rewrite.
    expect(
      await read([
        user('u1', 'Fix it'),
        assistant('a1', [text('draft')]),
        hook('s1'),
        assistant('a2', [text('fixed')]),
      ]),
    ).toEqual([
      { id: 'a1', replacedBy: 'a2' },
      { id: 'a2', replacedBy: undefined },
    ])
    // Two rewrites in a row: each draft points to the next reply.
    expect(
      await read([
        user('u1', 'Fix it'),
        assistant('a1', [text('draft 1')]),
        hook('s1'),
        assistant('a2', [text('draft 2')]),
        hook('s2'),
        assistant('a3', [text('fixed')]),
      ]),
    ).toEqual([
      { id: 'a1', replacedBy: 'a2' },
      { id: 'a2', replacedBy: 'a3' },
      { id: 'a3', replacedBy: undefined },
    ])
    // A rewrite with tool calls between: the last reply of the turn replaces the draft; text before the draft stays.
    expect(
      await read([
        user('u1', 'Fix it'),
        assistant('a0', [text('looking'), toolUse('t1', 'git status')]),
        user('r1', [toolResult('t1', 'clean')]),
        assistant('a1', [text('draft')]),
        hook('s1'),
        assistant('a2', [text('checking'), toolUse('t2', 'pnpm test')]),
        user('r2', [toolResult('t2', 'ok')]),
        assistant('a3', [text('fixed')]),
        user('u2', 'Thanks'),
        assistant('a4', [text('next turn')]),
      ]),
    ).toEqual([
      { id: 'a0', replacedBy: undefined },
      { id: 'a1', replacedBy: 'a3' },
      { id: 'a2', replacedBy: undefined },
      { id: 'a3', replacedBy: undefined },
      { id: 'a4', replacedBy: undefined },
    ])
    // A peer's prompt after the rewrite starts a new turn: its reply does not take the draft's mark.
    expect(
      await read([
        user('u1', 'Fix it'),
        assistant('a1', [text('draft')]),
        hook('s1'),
        assistant('a2', [text('fixed')]),
        user('p1', '<agent-prompt from="bridge-coord">status?</agent-prompt>'),
        assistant('a3', [text('status reply')]),
      ]),
    ).toEqual([
      { id: 'a1', replacedBy: 'a2' },
      { id: 'a2', replacedBy: undefined },
      { id: 'a3', replacedBy: undefined },
    ])
    // A stop after the hook's note: no reply replaced the draft, so it stays a reply.
    expect(
      await read([user('u1', 'Fix it'), assistant('a1', [text('draft')]), hook('s1'), user('u2', 'Stop there')]),
    ).toEqual([{ id: 'a1', replacedBy: undefined }])
  })

  it('shows the text of a queued prompt with a pasted image, which Claude Code stores as blocks', async () => {
    const path = file([
      {
        type: 'attachment',
        uuid: 'q1',
        attachment: {
          type: 'queued_command',
          prompt: [
            { type: 'text', text: 'Why is this red?' },
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } },
          ],
          commandMode: 'prompt',
          humanTurn: true,
          origin: { kind: 'human' },
        },
      },
    ])
    const read = await readClaudeTranscript(path, options)
    expect(read.entries).toEqual([{ type: 'user', id: 'q1', text: 'Why is this red?', cut: false }])
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

  it('says a task failed or goes on as it is, and never cuts a surrogate pair (R46 review)', async () => {
    const wrap = (status: string, summary: string) =>
      `<task-notification>\n<status>${status}</status>\n<summary>${summary}</summary>\n</task-notification>`
    const origin = { origin: { kind: 'task-notification' } }
    // 158 characters, then a two-unit emoji across the cut.
    const long = `${'a'.repeat(158)}${String.fromCodePoint(0x1f600)}tail`
    const path = file([
      user('t1', wrap('failed', 'Agent "lint" failed'), origin),
      user('t2', wrap('blocked', 'Agent "deploy" waits'), origin),
      user('t3', wrap('completed', long), origin),
    ])
    const entries = (await readClaudeTranscript(path, options)).entries
    expect(entries.slice(0, 2)).toEqual([
      { type: 'note', id: 't1', kind: 'task', text: 'Background task failed: Agent "lint" failed' },
      { type: 'note', id: 't2', kind: 'task', text: 'Background task update: Agent "deploy" waits' },
    ])
    const cut = entries[2]
    if (cut?.type !== 'note') throw new Error('no note')
    expect(cut.text).toBe(`Background task finished: ${'a'.repeat(158)}…`)
    // encodeURIComponent throws on a lone surrogate.
    expect(() => encodeURIComponent(cut.text)).not.toThrow()
  })

  it("keeps a prompt that the app sent through herdr, with its files, and a peer's text only in the note's message (R55)", async () => {
    // A prompt the app types into the pane has the owner's shape: no origin on an older line, "human" on a newer one.
    const uploads = '/home/dev/.local/share/the-bridge/uploads'
    const longName = `peer-${'n'.repeat(200)}`
    const path = file([
      user('a1', withAttachments('Look at this', [`${uploads}/u-1/screen.png`]), { origin: { kind: 'human' } }),
      user('a2', withAttachments('', [`${uploads}/u-2/notes.md`])),
      user(
        'p1',
        'Another Claude session sent a message: <cross-session-message>marker-5150 secret plan</cross-session-message>',
        {
          isMeta: true,
          origin: { kind: 'peer', name: longName },
        },
      ),
    ])
    const entries = (await readClaudeTranscript(path, { ...options, uploads })).entries
    expect(entries.slice(0, 2)).toEqual([
      { type: 'user', id: 'a1', text: 'Look at this', cut: false, files: ['screen.png'] },
      { type: 'user', id: 'a2', text: '', cut: false, files: ['notes.md'] },
    ])
    const note = entries[2]
    if (note?.type !== 'note') throw new Error('no note')
    expect(note.text.length).toBeLessThanOrEqual('Message from '.length + 64)
    expect(note.text).toMatch(/^Message from peer-n+…$/)
    expect(note.text).not.toMatch(/marker-5150|secret plan/)
    expect(note.message).toEqual({
      from: note.text.slice('Message from '.length),
      via: 'message',
      text: 'marker-5150 secret plan',
      cut: false,
    })
  })

  it("shows a whole <agent-prompt> wrapper as a message from that chat, and any other text as the owner's (R55)", async () => {
    // Example lines: another chat typed the wrapper into this pane with herdr, so the line has the owner's marks.
    const wrapped = (name: string, body: string) => `<agent-prompt from="${name}">\n${body}\n</agent-prompt>`
    const paste = (id: string, t: string) => `<pasted_content id="${id}">\n${t}\n</pasted_content id="${id}">`
    const mark = '<artifact-content-authored-by-others/>'
    const path = file([
      user('w1', wrapped('sample-coord', 'Run the tests, marker-5150.'), { origin: { kind: 'human' } }),
      user('w2', paste('77', wrapped('sample-lab', 'A long brief.\n\nTwo parts.'))),
      user('w3', `Look: ${wrapped('sample-coord', 'quoted by the owner')}`, { origin: { kind: 'human' } }),
      user('w4', `${wrapped('a', 'one')}\n${wrapped('b', 'two')}`, { origin: { kind: 'human' } }),
      user('w5', wrapped('sample-coord', 'a note'), { isMeta: true }),
      user('w6', wrapped('sample-coord', ''), { origin: { kind: 'human' } }),
      user('w7', wrapped('bad name', 'spaces are not a chat name'), { origin: { kind: 'human' } }),
      user('w8', wrapped('sample-coord', '    indented code\nnext'), { origin: { kind: 'human' } }),
      user(
        'q1',
        '<cross-session-message from="uds:/tmp/x.sock">\nIt ends with </cross-session-message> in text.\n</cross-session-message>',
        {
          isMeta: true,
          origin: { kind: 'peer', name: 'sample-lab' },
        },
      ),
      user('b1', 'Another Claude session sent a message: <cross-session-message>old</cross-session-message>', {
        isMeta: true,
        origin: { kind: 'peer', name: 'sample-lab', body: 'The body from the origin.' },
      }),
      user(
        'p1',
        `<cross-session-message from="uds:/tmp/x.sock" from-name="sample-coord">\nCheck #12.\n\n${mark}\n</cross-session-message>`,
        {
          isMeta: true,
          origin: { kind: 'peer', name: 'sample-coord' },
        },
      ),
    ])
    const read = await readClaudeTranscript(path, options)
    expect(read.entries).toEqual([
      {
        type: 'note',
        id: 'w1',
        kind: 'peer',
        text: 'Message from sample-coord',
        message: { from: 'sample-coord', via: 'prompt', text: 'Run the tests, marker-5150.', cut: false },
      },
      {
        type: 'note',
        id: 'w2',
        kind: 'peer',
        text: 'Message from sample-lab',
        message: { from: 'sample-lab', via: 'prompt', text: 'A long brief.\n\nTwo parts.', cut: false },
      },
      { type: 'user', id: 'w3', text: `Look: ${wrapped('sample-coord', 'quoted by the owner')}`, cut: false },
      { type: 'user', id: 'w4', text: `${wrapped('a', 'one')}\n${wrapped('b', 'two')}`, cut: false },
      { type: 'note', id: 'w6', kind: 'peer', text: 'Message from sample-coord' },
      { type: 'user', id: 'w7', text: wrapped('bad name', 'spaces are not a chat name'), cut: false },
      {
        type: 'note',
        id: 'w8',
        kind: 'peer',
        text: 'Message from sample-coord',
        message: { from: 'sample-coord', via: 'prompt', text: '    indented code\nnext', cut: false },
      },
      {
        type: 'note',
        id: 'q1',
        kind: 'peer',
        text: 'Message from sample-lab',
        message: {
          from: 'sample-lab',
          via: 'message',
          text: 'It ends with </cross-session-message> in text.',
          cut: false,
        },
      },
      {
        type: 'note',
        id: 'b1',
        kind: 'peer',
        text: 'Message from sample-lab',
        message: { from: 'sample-lab', via: 'message', text: 'The body from the origin.', cut: false },
      },
      {
        type: 'note',
        id: 'p1',
        kind: 'peer',
        text: 'Message from sample-coord',
        message: { from: 'sample-coord', via: 'message', text: 'Check #12.', cut: false },
      },
    ])
    for (const entry of read.entries) TranscriptEntry.parse(entry)
  })
})
