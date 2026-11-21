import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createArtifactScanner } from './claudeArtifacts.ts'

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

  it('stops at its time cap and reads the rest on the next scan', async () => {
    const { root, file } = projects()
    writeFileSync(file, publish(1))
    let time = 0
    const scanner = createArtifactScanner(root, { maxMs: 100, now: () => (time += 60) })
    const first = await scanner.scan()
    expect([first.partial, first.found]).toEqual([true, []])
    time = 0
    const scannerTwo = createArtifactScanner(root, { maxMs: 100, now: () => time })
    expect((await scannerTwo.scan()).found.map((a) => a.link)).toEqual([link(1)])
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
})
