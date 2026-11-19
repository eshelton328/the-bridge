// The E2E suite's global setup: a separate herdr session (never the owner's),
// a workspace in it and the fake agent in that workspace's pane, in a
// temporary folder. It gives the tests the socket, the Claude projects
// folder and the fake chat, and stops and deletes the session after them.
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestProject } from 'vitest/node'
import { z } from 'zod'

declare module 'vitest' {
  export interface ProvidedContext {
    herdrSocket: string
    claudeProjects: string
    fakeChat: { workspace: string; title: string }
  }
}

const session = `bridge-e2e-${String(process.pid)}`
const herdr = (...args: string[]) =>
  execFileSync('herdr', ['--session', session, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const Created = z.object({ result: z.object({ root_pane: z.object({ pane_id: z.string() }) }) })
const Sessions = z.string()

/** Waits up to `ms` for `check` to pass. A setup step, so it may wait in steps. */
async function until(what: string, check: () => boolean, ms = 15_000): Promise<void> {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(200)) {
    try {
      if (check()) return
    } catch {
      // herdr is not up yet.
    }
  }
  throw new Error(`E2E setup: ${what} did not happen in ${String(ms)} ms`)
}

let server: ChildProcess | undefined

export default async function setup(project: TestProject) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'bridge-e2e-')))
  const claudeProjects = join(dir, 'claude-projects')
  server = spawn('herdr', ['--session', session, 'server'], { stdio: 'ignore' })
  await until('the herdr session start', () => herdr('workspace', 'list').includes('workspace_list'))
  const socketLine = Sessions.parse(execFileSync('herdr', ['session', 'list'], { encoding: 'utf8' }))
    .split('\n')
    .find((line) => line.startsWith(`${session} `))
  const herdrSocket = socketLine?.trim().split(/\s+/).at(-1)
  if (!herdrSocket?.endsWith('.sock')) throw new Error(`E2E setup: no socket for herdr session ${session}`)
  const workspace = 'bridge e2e'
  const title = 'fake e2e chat'
  const created = Created.parse(
    JSON.parse(herdr('workspace', 'create', '--label', workspace, '--no-focus', '--cwd', dir)),
  )
  const pane = created.result.root_pane.pane_id
  const fakeAgent = join(import.meta.dirname, 'fakeAgent.ts')
  herdr('pane', 'run', pane, `node ${fakeAgent} ${claudeProjects} fake-e2e-session '${title}'`)
  await until('the fake agent show in herdr', () => herdr('agent', 'list').includes('fake-e2e-session'))
  project.provide('herdrSocket', herdrSocket)
  project.provide('claudeProjects', claudeProjects)
  project.provide('fakeChat', { workspace, title })
  return () => {
    try {
      herdr('server', 'stop')
    } finally {
      server?.kill()
      try {
        execFileSync('herdr', ['session', 'delete', session])
      } catch {
        // The session is gone already.
      }
    }
  }
}
