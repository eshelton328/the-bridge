// The first E2E flow (d-113): the server and the web dev server on free
// ports, the page at /workspaces?source=live in Chromium, and the fake
// chat in its list with its model and status.
import { type ChildProcess, spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const children: ChildProcess[] = []
let browser: Browser | undefined
let web = ''

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.on('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => {
        if (typeof address === 'object' && address !== null) resolve(address.port)
        else reject(new Error('no free port'))
      })
    })
  })

/** Starts a process and resolves when its output matches `ready`; its output is kept for the error. */
function start(command: string, args: string[], env: Record<string, string>, ready: RegExp): Promise<void> {
  const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env } })
  children.push(child)
  let output = ''
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${command} ${args.join(' ')} did not start:\n${output}`))
    }, 60_000)
    const read = (chunk: Buffer) => {
      output += chunk.toString()
      if (ready.test(output)) {
        clearTimeout(timer)
        resolve()
      }
    }
    child.stdout.on('data', read)
    child.stderr.on('data', read)
    child.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`${command} ended with ${String(code)}:\n${output}`))
    })
  })
}

beforeAll(async () => {
  const [serverPort, webPort] = [await freePort(), await freePort()]
  const dir = mkdtempSync(join(tmpdir(), 'bridge-e2e-server-'))
  await start(
    'node',
    ['server/src/main.ts'],
    {
      BRIDGE_PORT: String(serverPort),
      BRIDGE_MACHINE_ID: 'e2e-mac',
      BRIDGE_OWNER_LOGIN: 'e2e@example.com',
      BRIDGE_HERDR_SOCKET: inject('herdrSocket'),
      BRIDGE_BRAIN_DIR: dir,
      BRIDGE_DB_FILE: join(dir, 'bridge.db'),
      BRIDGE_CLAUDE_PROJECTS: inject('claudeProjects'),
    },
    /the-bridge server on/,
  )
  await start(
    'pnpm',
    ['--filter', '@bridge/web', 'exec', 'vite', '--port', String(webPort), '--strictPort', '--host', '127.0.0.1'],
    { BRIDGE_SERVER_URL: `http://127.0.0.1:${String(serverPort)}` },
    /ready in/,
  )
  web = `http://localhost:${String(webPort)}`
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
  for (const child of children) child.kill()
})

describe('/workspaces?source=live', () => {
  it('lists the fake chat of the herdr session with its model and status', async () => {
    if (!browser) throw new Error('no browser')
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${web}/workspaces?source=live`)
    const { workspace, title } = inject('fakeChat')
    await page.getByText(workspace, { exact: true }).first().waitFor({ timeout: 30_000 })
    const row = page.getByText(title, { exact: true }).first()
    await row.waitFor()
    const text = await page.locator('body').innerText()
    expect(text).toContain(title)
    expect(text).toContain('Opus 5.5')
    expect(text).toContain('Idle')
    expect(text).not.toContain('Live data is not available')
    // The mock workspaces are gone: the list is the herdr session's.
    expect(text).not.toContain('skill-evals')
    await page.close()
  })
})
