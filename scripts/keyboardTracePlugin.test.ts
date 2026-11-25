import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createServer, request, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import {
  createEnabledHandler,
  createShiftHandler,
  createTraceHandler,
  findTraceDir,
  KEYBOARD_TRACE_BUILD_DEFINE,
  KEYBOARD_TRACE_ENABLED_PATH,
  KEYBOARD_TRACE_PATH,
  KEYBOARD_TRACE_SHIFT_PATH,
  keyboardTracePlugin,
  readTraceBuild,
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
  // The switch and the shift come first, as connect matches the trace endpoint's path as a prefix.
  assert.deepEqual(used, [KEYBOARD_TRACE_ENABLED_PATH, KEYBOARD_TRACE_SHIFT_PATH, KEYBOARD_TRACE_PATH])
})

/** A repository root with the library's package.json at `version`, or none. */
function fakeRoot(version?: unknown): string {
  const root = tempDir()
  if (version === undefined) return root
  const dir = join(root, 'web', 'node_modules', '@eshelton328', 'component-library-1701')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@eshelton328/component-library-1701', version }))
  return root
}

void test('the build is the short HEAD commit and the library version, each null when it cannot be read', () => {
  const calls: string[][] = []
  const root = fakeRoot('1.0.0-beta.102')
  const git = (args: string[], cwd: string) => {
    calls.push([cwd, ...args])
    return 'ce9bbfa\n'
  }
  assert.deepEqual(readTraceBuild({ root, git }), { commit: 'ce9bbfa', libraryVersion: '1.0.0-beta.102' })
  assert.deepEqual(calls, [[root, 'rev-parse', '--short', 'HEAD']])
  const noGit = () => {
    throw new Error('spawn git ENOENT')
  }
  assert.deepEqual(readTraceBuild({ root: fakeRoot(), git: noGit }), { commit: null, libraryVersion: null })
  const odd = () => 'not a sha'
  assert.deepEqual(readTraceBuild({ root: fakeRoot(7), git: odd }), { commit: null, libraryVersion: null })
  // In this repository both are read.
  const own = readTraceBuild()
  assert.match(own.libraryVersion ?? '', /^\d+\.\d+\.\d+/)
  assert.ok(own.commit === null || /^[0-9a-f]{7,40}$/.test(own.commit))
})

void test('the plugin defines the build for the app once the dev server reads its config', () => {
  const build = { commit: 'abc1234', libraryVersion: '1.0.0-beta.1' }
  const plugin = keyboardTracePlugin({ build: () => build })
  assert.deepEqual(plugin.config(), { define: { [KEYBOARD_TRACE_BUILD_DEFINE]: JSON.stringify(build) } })
  assert.equal(KEYBOARD_TRACE_BUILD_DEFINE, '__KEYBOARD_TRACE_BUILD__')
  const none = keyboardTracePlugin({ build: () => ({ commit: null, libraryVersion: null }) })
  assert.deepEqual(none.config(), {
    define: { __KEYBOARD_TRACE_BUILD__: '{"commit":null,"libraryVersion":null}' },
  })
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

void test('the shift answers SHIFT_TOP while ENABLED is there, else 0, never cached, and takes only GET', async () => {
  const dir = tempDir()
  const url = await serve(createShiftHandler({ traceDir: () => dir }))
  const ask = async () => {
    const res = await fetch(url)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    const body: unknown = await res.json()
    return body
  }
  assert.deepEqual(await ask(), { shiftTop: 0 })
  writeFileSync(join(dir, 'SHIFT_TOP'), '40\n')
  // No ENABLED: no shift.
  assert.deepEqual(await ask(), { shiftTop: 0 })
  writeFileSync(join(dir, 'ENABLED'), '')
  assert.deepEqual(await ask(), { shiftTop: 40 })
  for (const odd of ['', '-4', '40px', '201', '1e2', '04', 'x']) {
    writeFileSync(join(dir, 'SHIFT_TOP'), odd)
    assert.deepEqual(await ask(), { shiftTop: 0 }, odd)
  }
  writeFileSync(join(dir, 'SHIFT_TOP'), '200')
  assert.deepEqual(await ask(), { shiftTop: 200 })
  rmSync(join(dir, 'SHIFT_TOP'))
  assert.deepEqual(await ask(), { shiftTop: 0 })
  assert.equal((await post(url, trace())).status, 405)
  const none = await serve(createShiftHandler({ traceDir: () => undefined }))
  const body: unknown = await (await fetch(none)).json()
  assert.deepEqual(body, { shiftTop: 0 })
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
  writeFileSync(join(dir, 'SHIFT_TOP'), '40')
  const shift: unknown = await (await fetch(`${url}${KEYBOARD_TRACE_SHIFT_PATH}`)).json()
  assert.deepEqual(shift, { shiftTop: 40 })
  rmSync(join(dir, 'SHIFT_TOP'))
  // The keyboard experiment switch is gone (the proxy focus is the app's own path): its old path is the trace
  // endpoint's, which takes only POST, and a file EXPERIMENT is not read.
  writeFileSync(join(dir, 'EXPERIMENT'), 'proxy')
  assert.equal((await fetch(`${url}${KEYBOARD_TRACE_PATH}/experiment`)).status, 405)
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

void test('a trace with its build is taken, and either field may be null', async () => {
  const dir = tempDir()
  const url = await serve(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const full = trace({ ...HEADER, build: { commit: 'ce9bbfa', libraryVersion: '1.0.0-beta.102' }, samples: [{ t: 1 }] })
  assert.equal((await post(url, full)).status, 204)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), full)
  const none = { build: { commit: null, libraryVersion: null } }
  assert.equal((await post(url, trace({ ...HEADER, ...none, samples: [{ t: 2 }] }))).status, 204)
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
    { build: 'ce9bbfa' },
    { build: { commit: 'ce9bbfa' } },
    { build: { commit: 'not a sha', libraryVersion: null } },
    { build: { commit: null, libraryVersion: 'my secret text' } },
    { build: { commit: null, libraryVersion: 1 } },
    { build: { commit: null, libraryVersion: null, branch: 'main' } },
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

/** An ncc-1701 root with `engine/`, the served clone's `web/` and a worktree's `web/`, as real paths. */
function fakeNcc() {
  const root = realpathSync(tempDir())
  const served = join(root, 'projects', 'ncc-1701', 'the-bridge', 'web')
  const worktree = join(root, 'projects', 'ncc-1701', 'the-bridge-worktrees', 'probe', 'web')
  mkdirSync(join(root, 'engine'))
  mkdirSync(served, { recursive: true })
  mkdirSync(worktree, { recursive: true })
  return { root, served, worktree, brain: join(root, 'engine', '_local', 'phone-review', 'traces') }
}

void test('the traces folder is KEYBOARD_TRACE_DIR, else the brain folder only for the served clone', () => {
  const ncc = fakeNcc()
  assert.equal(findTraceDir({ KEYBOARD_TRACE_DIR: '/x/traces' }, ncc.worktree), '/x/traces')
  assert.equal(findTraceDir({}, ncc.served), ncc.brain)
  // Compared as real paths: a link to the served root is the served root.
  const link = join(tempDir(), 'served-link')
  symlinkSync(ncc.served, link)
  assert.equal(findTraceDir({}, link), ncc.brain)
  // A worktree, the repository root of the served clone, and a folder with no engine/ above it get none.
  assert.equal(findTraceDir({}, ncc.worktree), undefined)
  assert.equal(findTraceDir({}, dirname(ncc.served)), undefined)
  assert.equal(findTraceDir({}, tempDir()), undefined)
})

/** The plugin on a dev server whose root is `root`, with `env` set while it runs; serves its two routes. */
async function servePlugin(root: string, env: Record<string, string | undefined> = {}) {
  const routes: [string, TraceHandler][] = []
  const plugin = keyboardTracePlugin({ now: () => NOW, build: () => ({ commit: null, libraryVersion: null }) })
  plugin.configResolved({ root })
  plugin.configureServer({ middlewares: { use: (path, handler) => routes.push([path, handler]) } })
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
  const withEnv = async <T>(run: () => Promise<T>): Promise<T> => {
    const saved = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
    const set = (values: Record<string, string | undefined>) => {
      for (const [key, value] of Object.entries(values)) {
        if (value === undefined) Reflect.deleteProperty(process.env, key)
        else process.env[key] = value
      }
    }
    set(env)
    try {
      return await run()
    } finally {
      set(saved)
    }
  }
  return {
    post: (body: string) => withEnv(() => post(`${url}${KEYBOARD_TRACE_PATH}`, body)),
    enabled: () =>
      withEnv(async () => {
        const body: unknown = await (await fetch(`${url}${KEYBOARD_TRACE_ENABLED_PATH}`)).json()
        return body
      }),
  }
}

const TRACE_FILE = '2026-11-19T09-58-12-345Z.json'

void test('a dev server on the served clone writes to the brain traces folder', async () => {
  const ncc = fakeNcc()
  mkdirSync(ncc.brain, { recursive: true })
  writeFileSync(join(ncc.brain, 'ENABLED'), '')
  const plugin = await servePlugin(ncc.served, { KEYBOARD_TRACE_DIR: undefined })
  assert.deepEqual(await plugin.enabled(), { enabled: true })
  assert.equal((await plugin.post(trace())).status, 204)
  assert.deepEqual(readdirSync(ncc.brain).sort(), [TRACE_FILE, 'ENABLED'])
})

void test('a dev server in a worktree with no KEYBOARD_TRACE_DIR records nothing, and its switch is off', async () => {
  const ncc = fakeNcc()
  mkdirSync(ncc.brain, { recursive: true })
  writeFileSync(join(ncc.brain, 'ENABLED'), '')
  const plugin = await servePlugin(ncc.worktree, { KEYBOARD_TRACE_DIR: undefined })
  assert.deepEqual(await plugin.enabled(), { enabled: false })
  assert.equal((await plugin.post(trace())).status, 500)
  assert.deepEqual(readdirSync(ncc.brain), ['ENABLED'])
})

void test('a dev server in a worktree with KEYBOARD_TRACE_DIR writes there, never to the brain', async () => {
  const ncc = fakeNcc()
  mkdirSync(ncc.brain, { recursive: true })
  const own = tempDir()
  const plugin = await servePlugin(ncc.worktree, { KEYBOARD_TRACE_DIR: own })
  assert.deepEqual(await plugin.enabled(), { enabled: false })
  writeFileSync(join(own, 'ENABLED'), '')
  assert.deepEqual(await plugin.enabled(), { enabled: true })
  assert.equal((await plugin.post(trace())).status, 204)
  assert.deepEqual(readdirSync(own).sort(), [TRACE_FILE, 'ENABLED'])
  assert.deepEqual(readdirSync(ncc.brain), [])
})

/**
 * Serves `handler` and records each error it passes to `next`. `replyFails` makes the reply throw it, as a reply to a
 * gone socket can; `settled()` waits for the last request to close and the handler to settle.
 */
async function serveRecording(handler: TraceHandler, replyFails?: Error) {
  const errors: unknown[] = []
  const closes: Promise<void>[] = []
  const server = createServer((req, res) => {
    closes.push(new Promise((done) => req.on('close', done)))
    if (replyFails !== undefined) {
      res.end = () => {
        throw replyFails
      }
      setTimeout(() => res.destroy(), 20)
    }
    handler(req, res, (error) => {
      errors.push(error)
      if (replyFails !== undefined) return
      res.statusCode = 500
      res.end(String(error))
    })
  })
  servers.push(server)
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('the test server has no port')
  return {
    port: address.port,
    errors,
    async settled() {
      await closes.at(-1)
      await new Promise((done) => setTimeout(done, 50))
    },
  }
}

/** POSTs the first half of `body` with the whole length in its header, then drops the socket, as a suspended app does. */
async function abortedPost(port: number, body: string): Promise<void> {
  await new Promise<void>((done) => {
    const req = request({
      host: '127.0.0.1',
      port,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) },
    })
    req.on('error', () => {
      done()
    })
    req.on('close', () => {
      done()
    })
    req.write(body.slice(0, body.length / 2), () => setTimeout(() => req.destroy(), 20))
  })
}

void test('a POST the client drops mid-body ends quietly: no error to the dev server, no trace written', async () => {
  const dir = tempDir()
  const server = await serveRecording(createTraceHandler({ traceDir: () => dir, now: () => NOW }))
  const url = `http://127.0.0.1:${String(server.port)}`
  const first = trace()
  assert.equal((await post(url, first)).status, 204)
  await server.settled()
  await abortedPost(server.port, trace({ samples: [{ t: 1 }, { t: 9, pad: 'x'.repeat(64 * 1024) }] }))
  await server.settled()
  assert.deepEqual(server.errors, [])
  assert.deepEqual(readdirSync(dir), ['2026-11-19T09-58-12-345Z.json'])
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), first)
  // The endpoint still takes the next whole trace.
  const later = trace({ samples: [{ t: 1 }, { t: 10 }] })
  assert.equal((await post(url, later)).status, 204)
  assert.equal(readFileSync(join(dir, '2026-11-19T09-58-12-345Z.json'), 'utf8'), later)
})

/** A switch GET whose reply throws `error`, as when the socket is gone; returns what reached `next`. */
async function switchReplyFails(error: Error): Promise<unknown[]> {
  const dir = tempDir()
  const server = await serveRecording(createEnabledHandler({ traceDir: () => dir }), error)
  await fetch(`http://127.0.0.1:${String(server.port)}`).catch(() => undefined)
  await server.settled()
  return server.errors
}

void test('a switch GET the client drops ends quietly, with no error to the dev server', async () => {
  assert.deepEqual(await switchReplyFails(Object.assign(new Error('aborted'), { code: 'ECONNRESET' })), [])
  assert.deepEqual(await switchReplyFails(new Error('aborted')), [])
  assert.deepEqual(await switchReplyFails(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })), [])
})

void test('an error that is not a client abort still goes to the dev server, from either handler', async () => {
  const broken = new Error('disk gone')
  assert.deepEqual(await switchReplyFails(broken), [broken])
  const server = await serveRecording(
    createTraceHandler({
      traceDir: () => {
        throw broken
      },
      now: () => NOW,
    }),
  )
  const res = await post(`http://127.0.0.1:${String(server.port)}`, trace())
  assert.equal(res.status, 500)
  assert.deepEqual(server.errors, [broken])
})
