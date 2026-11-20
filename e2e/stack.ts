// The server and the web dev server of an E2E file, each on a free port,
// with the herdr session of the global setup (herdrSession.ts). Vite sends
// /api to the server, as in the served app. stopStack() ends both.
import { type ChildProcess, spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inject } from 'vitest'

const root = join(import.meta.dirname, '..')
const children: ChildProcess[] = []

/** The owner's login that the E2E server lets in. */
export const owner = 'e2e@example.com'

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

/**
 * Starts the server and Vite. `allowedHost` is a host Vite answers besides localhost, as the served app
 * allows its tailnet host (`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`).
 */
export async function startStack(allowedHost?: string): Promise<{ readonly webPort: number }> {
  const [serverPort, webPort] = [await freePort(), await freePort()]
  const dir = mkdtempSync(join(tmpdir(), 'bridge-e2e-server-'))
  await start(
    'node',
    ['server/src/main.ts'],
    {
      BRIDGE_PORT: String(serverPort),
      BRIDGE_MACHINE_ID: 'e2e-mac',
      BRIDGE_OWNER_LOGIN: owner,
      BRIDGE_HERDR_SOCKET: inject('herdrSocket'),
      BRIDGE_BRAIN_DIR: dir,
      BRIDGE_DB_FILE: join(dir, 'bridge.db'),
      BRIDGE_CLAUDE_PROJECTS: inject('claudeProjects'),
      BRIDGE_LOG_DIR: join(dir, 'logs'),
      // The start waits for the info line "server started", so a level from the caller's shell must not hide it.
      BRIDGE_LOG_LEVEL: 'info',
    },
    /"msg":"server started"/,
  )
  await start(
    'pnpm',
    ['--filter', '@bridge/web', 'exec', 'vite', '--port', String(webPort), '--strictPort', '--host', '127.0.0.1'],
    {
      BRIDGE_SERVER_URL: `http://127.0.0.1:${String(serverPort)}`,
      ...(allowedHost ? { __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: allowedHost } : {}),
    },
    /ready in/,
  )
  return { webPort }
}

export function stopStack(): void {
  for (const child of children.splice(0)) child.kill()
}
