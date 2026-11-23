// The side runner with a fake `claude`: a Node script that writes the arguments and the question it got to a file,
// then prints stream-json lines that the question picks.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { memoryLogger } from '../logger.ts'
import type { SideChunk } from '../services/agentPort.ts'
import { claudeSideRunner, sideArgs } from './claudeSide.ts'

const fake = `
const { writeFileSync } = require('node:fs')
const [seen] = process.argv.slice(2)
let question = ''
process.stdin.on('data', (d) => { question += d })
process.stdin.on('end', () => {
  const herdr = Object.keys(process.env).filter((k) => k.startsWith('HERDR_'))
  writeFileSync(seen, JSON.stringify({ args: process.argv.slice(3), question, herdr, path: process.env.PATH, marker: process.env.SIDE_MARKER, codeMode: process.env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE }))
  const out = (line) => process.stdout.write(JSON.stringify(line) + '\\n')
  const say = (text, parent = null) =>
    out({ type: 'assistant', parent_tool_use_id: parent, message: { content: [{ type: 'text', text }] } })
  if (question === 'hang') return setInterval(() => undefined, 1000)
  out({ type: 'system', subtype: 'init' })
  process.stdout.write('not json\\n')
  if (question === 'crash') {
    process.stderr.write('boom from the fake')
    process.exit(3)
  }
  if (question === 'stubborn') {
    process.on('SIGTERM', () => undefined)
    return setInterval(() => undefined, 1000)
  }
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

let logged = memoryLogger()
async function ask(
  question: string,
  signal = new AbortController().signal,
  limits: { timeoutMs?: number; killAfterMs?: number } = {},
) {
  logged = memoryLogger()
  const run = claudeSideRunner({
    model: 'sonnet',
    log: logged.log,
    ...limits,
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
    expect(seen).not.toHaveProperty('marker')
    expect(seen).toMatchObject({
      args: sideArgs('session-5150', 'sonnet'),
      question: 'What does marker-5150 do?',
      // Only the named variables: no herdr pane identity (Claude Code's herdr hook would give the side session to the
      // server's pane), and no other variable of the server's.
      herdr: [],
      path: '/usr/bin',
    })
    expect(sideArgs('s', 'm')).toEqual(
      expect.arrayContaining(['--fork-session', '--no-session-persistence', '--strict-mcp-config']),
    )
    // No owner settings file (hooks, allow rules), and the file tools stay in the folder.
    expect(sideArgs('s', 'm')).toContain('--restricted')
    expect(sideArgs('s', 'm')).not.toContain('--dangerously-skip-permissions')
    expect(logged.lines()).toEqual([])
  })

  it('ends as failed on an error result, an exit with no result, or a command that does not start', async () => {
    expect((await ask('fail')).at(-1)).toEqual({ end: 'failed' })
    expect(await ask('crash')).toEqual([{ end: 'failed' }])
    // A failed run logs its exit and the end of its stderr, never the question.
    expect(logged.lines()).toEqual([
      expect.objectContaining({ msg: 'side run failed', exitCode: 3, stderr: 'boom from the fake' }),
    ])
    expect(JSON.stringify(logged.lines())).not.toContain('crash')
    const run = claudeSideRunner({
      model: 'sonnet',
      env: {},
      log: memoryLogger().log,
      command: [join(dir, 'no-such-claude')],
    })
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

  it('ends a run with no end of its own as failed at its time limit, with SIGKILL for one that stays', async () => {
    expect(await ask('hang', undefined, { timeoutMs: 200 })).toEqual([{ end: 'failed' }])
    expect(logged.lines()).toEqual([expect.objectContaining({ msg: 'side run failed', timedOut: true })])
    expect(await ask('stubborn', undefined, { timeoutMs: 200, killAfterMs: 200 })).toEqual([{ end: 'failed' }])
    expect(logged.lines()).toEqual([expect.objectContaining({ signal: 'SIGKILL', timedOut: true })])
  })

  it("copies Code Mode from the owner's settings file, as --restricted loads none, and no other env key", async () => {
    await writeFile(
      join(dir, 'settings.json'),
      JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_CODE_MODE: '1', SIDE_MARKER: 'from-settings' } }),
    )
    const run = claudeSideRunner({
      model: 'sonnet',
      env: { PATH: '/usr/bin' },
      log: memoryLogger().log,
      settingsFile: join(dir, 'settings.json'),
      command: [process.execPath, join(dir, 'fake.cjs'), join(dir, 'seen.json')],
    })
    for await (const chunk of run({ session: 's', folder: dir, question: 'q', signal: new AbortController().signal }))
      expect(chunk).toBeDefined()
    const seen: unknown = JSON.parse(await readFile(join(dir, 'seen.json'), 'utf8'))
    expect(seen).toMatchObject({ codeMode: '1' })
    expect(seen).not.toHaveProperty('marker')
  })

  it('sets no Code Mode when the settings file is missing or names none', async () => {
    expect((await ask('q')).at(-1)).toEqual({ end: 'done' })
    const seen: unknown = JSON.parse(await readFile(join(dir, 'seen.json'), 'utf8'))
    expect(seen).not.toHaveProperty('codeMode')
  })

  it('starts no process when the signal aborts while it reads the settings file', async () => {
    await writeFile(join(dir, 'settings.json'), JSON.stringify({ env: { CLAUDE_CODE_EXPERIMENTAL_CODE_MODE: '1' } }))
    const run = claudeSideRunner({
      model: 'sonnet',
      env: { PATH: '/usr/bin' },
      log: memoryLogger().log,
      settingsFile: join(dir, 'settings.json'),
      command: [process.execPath, join(dir, 'fake.cjs'), join(dir, 'seen.json')],
    })
    const stop = new AbortController()
    const answer = run({ session: 's', folder: dir, question: 'q', signal: stop.signal })[Symbol.asyncIterator]()
    const first = answer.next()
    stop.abort()
    expect(await first).toEqual({ done: true, value: undefined })
    await expect(readFile(join(dir, 'seen.json'), 'utf8')).rejects.toThrow()
  })
})
