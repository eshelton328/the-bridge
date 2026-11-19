import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { createServer, request, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import {
  createTraceHandler,
  findTraceDir,
  KEYBOARD_TRACE_PATH,
  keyboardTracePlugin,
  type TraceHandler,
  traceFileName,
} from './keyboardTracePlugin.ts'

const NOW = Date.parse('2026-11-19T10:00:00.000Z')
const STARTED = '2026-11-19T09:58:12.345Z'
const servers: Server[] = []
after(() => {
  for (const server of servers) server.close()
})

/** Serves `handler` on a free port, as Vite's connect stack would, and returns its URL. */
async function serve(handler: TraceHandler): Promise<string> {
  const server = createServer((req, res) => {
    handler(req, res, (error) => {
      res.statusCode = 500
      res.end(String(error))
    })
  })
  servers.push(server)
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('the test server has no port')
  return `http://127.0.0.1:${String(address.port)}`
}

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'keyboard-trace-'))
}

const trace = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ startedAt: STARTED, userAgent: 'iPhone', samples: [{ t: 1, type: 'raf' }], ...over })

const post = (url: string, body: string, type = 'application/json') =>
  fetch(url, { method: 'POST', headers: { 'content-type': type }, body })

void test('the plugin runs only on the dev server, never in a build', () => {
  const plugin = keyboardTracePlugin()
  assert.equal(plugin.apply, 'serve')
  const used: string[] = []
  plugin.configureServer({ middlewares: { use: (path) => used.push(path) } })
  assert.deepEqual(used, [KEYBOARD_TRACE_PATH])
})

void test('a POSTed trace is written to one file named from its start time, and each POST replaces it', async () => {
  const dir = join(tempDir(), 'nested', 'traces')
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  assert.equal((await post(url, trace())).status, 204)
  const second = trace({
    samples: [
      { t: 1, type: 'raf' },
      { t: 2, type: 'focusin' },
    ],
  })
  assert.equal((await post(url, second)).status, 204)
  assert.deepEqual(readdirSync(dir), ['2026-11-19T09-58-12-345Z.json'])
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), second)
})

void test('a trace whose last sample is older than the written one does not replace it', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const newer = trace({ samples: [{ t: 1 }, { t: 5 }] })
  assert.equal((await post(url, newer)).status, 204)
  assert.equal((await post(url, trace({ samples: [{ t: 1 }, { t: 3 }] }))).status, 409)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), newer)
  assert.deepEqual(readdirSync(dir), ['2026-11-19T09-58-12-345Z.json'])
})

void test('a request that is not a POST is refused', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const res = await fetch(url)
  assert.equal(res.status, 405)
  assert.equal(res.headers.get('allow'), 'POST')
  assert.deepEqual(readdirSync(dir), [])
})

void test('a body that is not JSON, or not a trace, is refused', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  assert.equal((await post(url, trace(), 'text/plain')).status, 415)
  assert.equal((await post(url, '{not json')).status, 400)
  assert.equal((await post(url, JSON.stringify({ startedAt: STARTED }))).status, 400)
  assert.deepEqual(readdirSync(dir), [])
})

void test('a body over the size cap is refused, by its length header or by what arrives', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW, maxBytes: 64 }))
  assert.equal((await post(url, trace({ pad: 'x'.repeat(200) }))).status, 413)
  // Chunked, with no content-length: the stream is counted as it arrives.
  const status = await new Promise<number | undefined>((done, fail) => {
    const req = request(url, { method: 'POST', headers: { 'content-type': 'application/json' } }, (res) => {
      res.resume()
      done(res.statusCode)
    })
    req.on('error', fail)
    for (let i = 0; i < 4; i++) req.write('x'.repeat(50))
    req.end()
  })
  assert.equal(status, 413)
  assert.deepEqual(readdirSync(dir), [])
})

void test('the file name comes from the parsed start time, never from client text', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  // A path in the URL or the body does not reach the file name.
  const res = await post(`${url}/../../evil.json?name=../../evil`, trace({ name: '../../evil', path: '/etc/x' }))
  assert.equal(res.status, 204)
  assert.deepEqual(readdirSync(dir), ['2026-11-19T09-58-12-345Z.json'])
  // A start time that is a path, or no time, or a week old, is refused.
  for (const startedAt of ['../../etc/passwd', '2026-11-19T09:58:12.345Z/../../x', 42, '2026-11-12T10:00:00.000Z']) {
    assert.equal((await post(url, trace({ startedAt }))).status, 400, String(startedAt))
  }
  assert.deepEqual(readdirSync(dir), ['2026-11-19T09-58-12-345Z.json'])
  assert.equal(traceFileName(STARTED, NOW), '2026-11-19T09-58-12-345Z.json')
  assert.match(traceFileName('2026-11-19T11:00:00+01:00', NOW) ?? '', /^[0-9TZ-]+\.json$/)
})

void test('with no traces folder the endpoint answers 500 and says how to set one', async () => {
  const url = await serve(createTraceHandler({ traceDir: () => undefined, now: () => NOW }))
  const res = await post(url, trace())
  assert.equal(res.status, 500)
  assert.match(await res.text(), /KEYBOARD_TRACE_DIR/)
})

void test('the traces folder is KEYBOARD_TRACE_DIR, else under the first folder above with engine/', () => {
  assert.equal(findTraceDir({ KEYBOARD_TRACE_DIR: '/x/traces' }, '/'), '/x/traces')
  const root = tempDir()
  mkdirSync(join(root, 'engine'))
  const repo = join(root, 'projects', 'p', 'repo')
  mkdirSync(repo, { recursive: true })
  assert.equal(findTraceDir({}, repo), join(root, 'engine', '_local', 'phone-review', 'traces'))
  assert.equal(findTraceDir({}, tempDir()), undefined)
})
