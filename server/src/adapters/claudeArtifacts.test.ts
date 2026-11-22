import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createArtifactScanner, createClaudeArtifactFinder, projectOf } from './claudeArtifacts.ts'

const session = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'
const cwd = '/home/dev/projects/example-project'
const link = (n: number) => `https://claude.ai/artifact/Example_Artifact-${String(n).padStart(4, '0')}`

/** One Artifact publish and its result, as two session lines, with made-up values. */
function publish(n: number, result: { error?: boolean; url?: string; title?: string } = {}): string {
  const id = `toolu_example${String(n)}`
  const call = {
    type: 'assistant',
    timestamp: '2026-11-20T10:00:00.000Z',
    sessionId: session,
    cwd,
    message: {
      content: [
        { type: 'text', text: 'marker-5150' },
        {
          type: 'tool_use',
          id,
          name: 'Artifact',
          input: { action: 'publish', title: `Report ${String(n)}`, description: 'An example' },
        },
      ],
    },
  }
  const reply = {
    type: 'user',
    timestamp: `2026-11-20T10:00:0${String(n % 10)}.000Z`,
    sessionId: session,
    cwd,
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: id,
          content: 'Published.',
          ...(result.error === true ? { is_error: true } : {}),
        },
      ],
    },
    ...(result.error === true
      ? {}
      : { toolUseResult: { url: result.url ?? link(n), title: result.title ?? `Report ${String(n)}` } }),
  }
  return `${JSON.stringify(call)}\n${JSON.stringify(reply)}\n`
}

function projects() {
  const root = mkdtempSync(join(tmpdir(), 'bridge-artifacts-'))
  mkdirSync(join(root, '-home-dev-projects-example-project'))
  return { root, file: join(root, '-home-dev-projects-example-project', `${session}.jsonl`) }
}

describe('the Claude artifact scanner', () => {
  it('finds each published artifact with its link, title, description, time, session and folder', async () => {
    const { root, file } = projects()
    writeFileSync(file, `{"type":"user","message":{"content":"hello"}}\nnot json\n${publish(1)}`)
    const scan = await createArtifactScanner(root).scan()
    expect(scan).toEqual({
      partial: false,
      found: [
        {
          link: link(1),
          title: 'Report 1',
          description: 'An example',
          publishedAt: '2026-11-20T10:00:01.000Z',
          session,
          cwd,
        },
      ],
    })
  })

  it('skips an error result and a result with no claude.ai artifact link', async () => {
    const { root, file } = projects()
    writeFileSync(
      file,
      publish(1, { error: true }) +
        publish(2, { url: 'https://example.com/site' }) +
        publish(3, { url: 'http://claude.ai/artifact/x' }),
    )
    expect((await createArtifactScanner(root).scan()).found).toEqual([])
  })

  it('reads only what was written since the last scan, and a line that was not complete then', async () => {
    const { root, file } = projects()
    const two = publish(2)
    const cut = two.indexOf('\n') + 20
    writeFileSync(file, publish(1) + two.slice(0, cut))
    const scanner = createArtifactScanner(root)
    expect((await scanner.scan()).found.map((a) => a.link)).toEqual([link(1)])
    appendFileSync(file, two.slice(cut))
    expect((await scanner.scan()).found.map((a) => a.link)).toEqual([link(2)])
    expect((await scanner.scan()).found).toEqual([])
  })

  it('keeps a title with characters of more than one byte across a chunk edge', async () => {
    const { root, file } = projects()
    const title = 'Rapport é'.repeat(80_000)
    writeFileSync(file, publish(1, { title }) + publish(2))
    const found = (await createArtifactScanner(root).scan()).found
    expect(found.map((a) => [a.link, a.title.length])).toEqual([
      [link(1), title.length],
      [link(2), 'Report 2'.length],
    ])
  })

  it('stops at its byte cap and goes on from there on the next scan', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1) + publish(2) + publish(3))
    const scanner = createArtifactScanner(root, { maxBytes: publish(1).length + 10 })
    const first = await scanner.scan()
    expect([first.partial, first.found.map((a) => a.link)]).toEqual([true, [link(1)]])
    const second = await scanner.scan()
    expect([second.partial, second.found.map((a) => a.link)]).toEqual([true, [link(2)]])
    const third = await scanner.scan()
    expect([third.partial, third.found.map((a) => a.link)]).toEqual([false, [link(3)]])
  })

  it('stops at its time cap after its first read, and reads the rest on the next scan', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1))
    writeFileSync(
      join(root, '-home-dev-projects-example-project', 'a1b2c3d4-0000-4000-8000-000000000002.jsonl'),
      publish(2),
    )
    let time = 0
    const scanner = createArtifactScanner(root, { maxMs: 100, now: () => (time += 60) })
    const first = await scanner.scan()
    expect([first.partial, first.found.length]).toEqual([true, 1])
    const second = await scanner.scan()
    expect([second.partial, second.found.length]).toEqual([false, 1])
    expect([...first.found, ...second.found].map((f) => f.link).sort()).toEqual([link(1), link(2)])
  })

  it('reads a file again from the start when it became shorter, and finds nothing in a missing folder', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1) + publish(2))
    const scanner = createArtifactScanner(root)
    expect((await scanner.scan()).found).toHaveLength(2)
    writeFileSync(file, publish(3))
    expect((await scanner.scan()).found.map((a) => a.link)).toEqual([link(3)])
    expect(await createArtifactScanner(join(root, 'none')).scan()).toEqual({ found: [], partial: false })
  })

  it('finds an artifact whose line is longer than one scan reads, over several scans', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1, { title: 'Long report '.repeat(40) }))
    const scanner = createArtifactScanner(root, { maxBytes: 200 })
    const found = []
    for (let i = 0; i < 40 && found.length === 0; i += 1) found.push(...(await scanner.scan()).found)
    expect(found.map((a) => a.link)).toEqual([link(1)])
  })

  it('reads on when each scan is past its time cap at once, as after a long folder listing', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1))
    let time = 0
    const scanner = createArtifactScanner(root, { maxMs: 100, now: () => (time += 1000) })
    const found = []
    for (let i = 0; i < 5 && found.length === 0; i += 1) found.push(...(await scanner.scan()).found)
    expect(found.map((a) => a.link)).toEqual([link(1)])
  })

  it('reads a file of more than 32 MiB in one scan with the default caps, as the time cap is the limit', async () => {
    const { root, file } = projects()
    const filler = `${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'marker-5150 '.repeat(80) }] } })}\n`
    writeFileSync(file, filler.repeat(Math.ceil((40 * 1024 * 1024) / filler.length)) + publish(1))
    const scan = await createArtifactScanner(root).scan()
    expect([scan.partial, scan.found.map((a) => a.link)]).toEqual([false, [link(1)]])
  })

  it('gives each artifact once when two scans run at the same time', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1) + publish(2))
    const scanner = createArtifactScanner(root)
    const [a, b] = await Promise.all([scanner.scan(), scanner.scan()])
    expect([...a.found, ...b.found].map((f) => f.link)).toEqual([link(1), link(2)])
  })
})

describe('the Claude artifact finder', () => {
  it('names the project from the chat folder under the chat root, and none outside it', () => {
    expect(projectOf('/home/dev', '/home/dev/projects/example-project')).toBe('example-project')
    expect(projectOf('/home/dev', '/home/dev/projects/example-project/repo-worktrees/branch')).toBe('example-project')
    expect(projectOf('/home/dev', '/home/dev/projects')).toBeNull()
    expect(projectOf('/home/dev', '/home/dev/engine')).toBeNull()
    expect(projectOf('/home/dev', '/srv/other/projects/x')).toBeNull()
    expect(projectOf('/home/dev', '/home/dev/projects/Not A Name')).toBeNull()
  })

  it('gives each found artifact with its project in place of its folder', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1))
    const scan = await createClaudeArtifactFinder(root, '/home/dev').scan()
    expect(scan).toEqual({
      partial: false,
      found: [
        {
          link: link(1),
          title: 'Report 1',
          description: 'An example',
          publishedAt: '2026-11-20T10:00:01.000Z',
          session,
          project: 'example-project',
        },
      ],
    })
  })
})
