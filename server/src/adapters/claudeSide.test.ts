// The side runner with a fake `claude`: a Node script that writes the arguments and the question it got to a file,
// then prints stream-json lines that the question picks.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SideChunk } from '../services/agentPort.ts'
import { claudeSideRunner, sideArgs } from './claudeSide.ts'

const fake = `
const { writeFileSync } = require('node:fs')
const [seen] = process.argv.slice(2)
let question = ''
process.stdin.on('data', (d) => { question += d })
process.stdin.on('end', () => {
  const herdr = Object.keys(process.env).filter((k) => k.startsWith('HERDR_'))
  writeFileSync(seen, JSON.stringify({ args: process.argv.slice(3), question, herdr, marker: process.env.SIDE_MARKER }))
  const out = (line) => process.stdout.write(JSON.stringify(line) + '\\n')
  const say = (text, parent = null) =>
    out({ type: 'assistant', parent_tool_use_id: parent, message: { content: [{ type: 'text', text }] } })
  if (question === 'hang') return setInterval(() => undefined, 1000)
  out({ type: 'system', subtype: 'init' })
  process.stdout.write('not json\\n')
  if (question === 'crash') process.exit(3)
  say('First part.')
  out({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', name: 'Read' }] } })
  say('From a subagent.', 'toolu_1')
  say('Second part.')
  out({ type: 'result', subtype: question === 'fail' ? 'error_during_execution' : 'success', is_error: question === 'fail' })
})
`

let dir = ''
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'side-'))
  await writeFile(join(dir, 'fake.cjs'), fake)
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function ask(question: string, signal = new AbortController().signal) {
  const run = claudeSideRunner({
    model: 'sonnet',
    env: {
      PATH: '/usr/bin',
      SIDE_MARKER: 'marker-5150',
      HERDR_ENV: '1',
      HERDR_PANE_ID: 'w1:p1',
      HERDR_SOCKET_PATH: '/home/dev/h.sock',
    },
    command: [process.execPath, join(dir, 'fake.cjs'), join(dir, 'seen.json')],
  })
  const chunks: SideChunk[] = []
  for await (const chunk of run({ session: 'session-5150', folder: dir, question, signal })) chunks.push(chunk)
  return chunks
}

describe('claude side runner', () => {
  it('sends the question on stdin with the fixed arguments, in the chat folder, and gives the top-level text', async () => {
    expect(await ask('What does marker-5150 do?')).toEqual([
      { text: 'First part.' },
      { text: '\n\nSecond part.' },
      { end: 'done' },
    ])
    const seen: unknown = JSON.parse(await readFile(join(dir, 'seen.json'), 'utf8'))
    expect(seen).toMatchObject({
      args: sideArgs('session-5150', 'sonnet'),
      question: 'What does marker-5150 do?',
      // No herdr pane identity: Claude Code's herdr hook would give the side session to the server's pane.
      herdr: [],
      marker: 'marker-5150',
    })
    expect(sideArgs('s', 'm')).toEqual(
      expect.arrayContaining(['--fork-session', '--no-session-persistence', '--strict-mcp-config']),
    )
    expect(sideArgs('s', 'm')).not.toContain('--dangerously-skip-permissions')
  })

  it('ends as failed on an error result, an exit with no result, or a command that does not start', async () => {
    expect((await ask('fail')).at(-1)).toEqual({ end: 'failed' })
    expect(await ask('crash')).toEqual([{ end: 'failed' }])
    const run = claudeSideRunner({ model: 'sonnet', env: {}, command: [join(dir, 'no-such-claude')] })
    const chunks: SideChunk[] = []
    for await (const chunk of run({ session: 's', folder: dir, question: 'q', signal: new AbortController().signal }))
      chunks.push(chunk)
    expect(chunks).toEqual([{ end: 'failed' }])
  })

  it('stops the process when the signal aborts, with no end of its own', async () => {
    const stop = new AbortController()
    const chunks = ask('hang', stop.signal)
    setTimeout(() => {
      stop.abort()
    }, 300)
    expect(await chunks).toEqual([])
  })
})
