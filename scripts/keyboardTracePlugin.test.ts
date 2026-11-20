import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, request, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import {
  createEnabledHandler,
  createExperimentHandler,
  createTraceHandler,
  findTraceDir,
  KEYBOARD_TRACE_ENABLED_PATH,
  KEYBOARD_TRACE_EXPERIMENT_PATH,
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
  // The switches come first, as connect matches the trace endpoint's path as a prefix.
  assert.deepEqual(used, [KEYBOARD_TRACE_ENABLED_PATH, KEYBOARD_TRACE_EXPERIMENT_PATH, KEYBOARD_TRACE_PATH])
})

void test('the switch answers enabled true while the traces folder has ENABLED, else false, never cached', async () => {
  const dir = tempDir()
  const url = await serve(createEnabledHandler({ traceDir: () => dir }))
  const ask = async () => {
    const res = await fetch(url)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/)
    const body: unknown = await res.json()
    return body
  }
  assert.deepEqual(await ask(), { enabled: false })
  writeFileSync(join(dir, 'ENABLED'), '')
  assert.deepEqual(await ask(), { enabled: true })
  rmSync(join(dir, 'ENABLED'))
  assert.deepEqual(await ask(), { enabled: false })
  // A folder named ENABLED is not the switch.
  mkdirSync(join(dir, 'ENABLED'))
  assert.deepEqual(await ask(), { enabled: false })
})

void test('the switch is off with no traces folder, and takes only GET', async () => {
  const off = await serve(createEnabledHandler({ traceDir: () => undefined }))
  const res = await fetch(off)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  const body: unknown = await res.json()
  assert.deepEqual(body, { enabled: false })
  const dir = tempDir()
  writeFileSync(join(dir, 'ENABLED'), '')
  const url = await serve(createEnabledHandler({ traceDir: () => dir }))
  const posted = await post(url, trace())
  assert.equal(posted.status, 405)
  assert.equal(posted.headers.get('allow'), 'GET, HEAD')
  assert.equal(posted.headers.get('cache-control'), 'no-store')
  assert.deepEqual(readdirSync(dir), ['ENABLED'])
})

void test('the experiment switch names proxy or prevent from the file EXPERIMENT, else null, never its text', async () => {
  const dir = tempDir()
  const url = await serve(createExperimentHandler({ traceDir: () => dir }))
  const ask = async () => {
    const res = await fetch(url)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/)
    const body: unknown = await res.json()
    return body
  }
  assert.deepEqual(await ask(), { experiment: null })
  writeFileSync(join(dir, 'EXPERIMENT'), 'proxy\n')
  assert.deepEqual(await ask(), { experiment: 'proxy' })
  writeFileSync(join(dir, 'EXPERIMENT'), '  prevent  ')
  assert.deepEqual(await ask(), { experiment: 'prevent' })
  writeFileSync(join(dir, 'EXPERIMENT'), 'secret text')
  assert.deepEqual(await ask(), { experiment: null })
  writeFileSync(join(dir, 'EXPERIMENT'), `proxy${' '.repeat(40)}x`)
  assert.deepEqual(await ask(), { experiment: 'proxy' })
  rmSync(join(dir, 'EXPERIMENT'))
  mkdirSync(join(dir, 'EXPERIMENT'))
  assert.deepEqual(await ask(), { experiment: null })
})

void test('the experiment switch is null with no traces folder, and takes only GET and HEAD', async () => {
  const off = await serve(createExperimentHandler({ traceDir: () => undefined }))
  const body: unknown = await (await fetch(off)).json()
  assert.deepEqual(body, { experiment: null })
  const dir = tempDir()
  writeFileSync(join(dir, 'EXPERIMENT'), 'proxy')
  const url = await serve(createExperimentHandler({ traceDir: () => dir }))
  assert.equal((await fetch(url, { method: 'HEAD' })).status, 200)
  const refused = await post(url, '{}')
  assert.equal(refused.status, 405)
  assert.equal(refused.headers.get('allow'), 'GET, HEAD')
})

void test('the dev server routes the switch to the switch and a POST to the trace endpoint', async () => {
  const dir = tempDir()
  writeFileSync(join(dir, 'ENABLED'), '')
  const routes: [string, TraceHandler][] = []
  keyboardTracePlugin({ traceDir: () => dir, now: () => NOW }).configureServer({
    middlewares: { use: (path, handler) => routes.push([path, handler]) },
  })
  // Connect's prefix match: the first route whose path starts the URL takes it, with the prefix cut.
  const url = await serve((req, res, next) => {
    const path = req.url ?? '/'
    const route = routes.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
    if (route === undefined) {
      next(new Error(`no route for ${path}`))
      return
    }
    req.url = path.slice(route[0].length) || '/'
    route[1](req, res, next)
  })
  const res = await fetch(`${url}${KEYBOARD_TRACE_ENABLED_PATH}`)
  const body: unknown = await res.json()
  assert.deepEqual(body, { enabled: true })
  assert.equal((await post(`${url}${KEYBOARD_TRACE_ENABLED_PATH}`, trace())).status, 405)
  writeFileSync(join(dir, 'EXPERIMENT'), 'prevent')
  const experiment: unknown = await (await fetch(`${url}${KEYBOARD_TRACE_EXPERIMENT_PATH}`)).json()
  assert.deepEqual(experiment, { experiment: 'prevent' })
  assert.equal((await post(`${url}${KEYBOARD_TRACE_EXPERIMENT_PATH}`, trace())).status, 405)
  assert.equal((await post(`${url}${KEYBOARD_TRACE_PATH}`, trace())).status, 204)
  assert.deepEqual(readdirSync(dir).sort(), ['2026-11-19T09-58-12-345Z.json', 'ENABLED', 'EXPERIMENT'])
})

const HEADER = {
  displayMode: 'standalone',
  screenHeight: 852,
  screenWidth: 393,
  devicePixelRatio: 3,
  safeArea: { top: 59, right: 0, bottom: 34, left: 0 },
}

void test('a trace with the display header is taken, and so is one from an older client without it', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const full = trace({ ...HEADER, samples: [{ t: 1 }] })
  assert.equal((await post(url, full)).status, 204)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), full)
  assert.equal((await post(url, trace({ samples: [{ t: 2 }] }))).status, 204)
  assert.equal((await post(url, trace({ displayMode: 'browser', samples: [{ t: 3 }] }))).status, 204)
})

void test('a trace with reduced motion, automated and a kb-experiment key is taken, the key may be null', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const extra = { reducedMotion: true, automated: false, kbExperiment: 'dock_v2-a' }
  const full = trace({ ...HEADER, ...extra, samples: [{ t: 1 }] })
  assert.equal((await post(url, full)).status, 204)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), full)
  const none = { reducedMotion: false, automated: true, kbExperiment: null }
  assert.equal((await post(url, trace({ ...HEADER, ...none, samples: [{ t: 2 }] }))).status, 204)
})

void test('a chat session trace with its route and chat is taken, the state key may be null', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const chat = {
    route: { pathname: '/workspaces', state: 'phoneChatFull' },
    chat: { state: 'phoneChatFull', device: 'phone' },
  }
  const full = trace({ ...HEADER, ...chat, samples: [{ t: 1 }] })
  assert.equal((await post(url, full)).status, 204)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), full)
  const home = { route: { pathname: '/workspaces', state: null }, chat: { state: null, device: 'tablet' } }
  assert.equal((await post(url, trace({ ...HEADER, ...home, samples: [{ t: 2 }] }))).status, 204)
})

void test('two chat sessions with their own startedAt are written to two files', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const chat = { route: { pathname: '/workspaces', state: null }, chat: { state: null, device: 'phone' } }
  assert.equal((await post(url, trace({ ...chat, startedAt: '2026-11-19T09:58:12.345Z' }))).status, 204)
  assert.equal((await post(url, trace({ ...chat, startedAt: '2026-11-19T09:58:20.001Z' }))).status, 204)
  assert.deepEqual(readdirSync(dir).sort(), ['2026-11-19T09-58-12-345Z.json', '2026-11-19T09-58-20-001Z.json'])
})

void test('a trace with a malformed display header is refused', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  for (const bad of [
    { displayMode: 'fullscreen' },
    { displayMode: 1 },
    { screenHeight: '852' },
    { screenWidth: null },
    { devicePixelRatio: 'x' },
    { safeArea: { top: 1, right: 0, bottom: 0 } },
    { safeArea: { top: '1', right: 0, bottom: 0, left: 0 } },
    { safeArea: [1, 2, 3, 4] },
    { route: '/workspaces?state=phoneChatFull' },
    { route: { pathname: '/workspaces' } },
    { route: { pathname: '/workspaces?q=hello', state: null } },
    { route: { pathname: '/workspaces/../secret', state: null } },
    { route: { pathname: 'workspaces', state: null } },
    { route: { pathname: '/workspaces', state: 'my chat about money' } },
    { route: { pathname: '/workspaces', state: 'phoneChatFull', q: 'typed text' } },
    { chat: { state: 'phoneChatFull', device: 'desktop' } },
    { chat: { state: 'phoneChatFull' } },
    { chat: { state: 1, device: 'phone' } },
    { chat: { state: 'phoneChatFull', device: 'phone', title: 'bridge themes' } },
    { chat: ['phoneChatFull', 'phone'] },
    { reducedMotion: 'true' },
    { reducedMotion: 1 },
    { automated: 'yes' },
    { automated: null },
    { kbExperiment: '' },
    { kbExperiment: 'x'.repeat(33) },
    { kbExperiment: 'my chat' },
    { kbExperiment: 'a.b' },
    { kbExperiment: 7 },
    { kbExperiment: ['a'] },
  ]) {
    assert.equal((await post(url, trace({ ...HEADER, ...bad }))).status, 400, JSON.stringify(bad))
  }
  assert.deepEqual(readdirSync(dir), [])
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
