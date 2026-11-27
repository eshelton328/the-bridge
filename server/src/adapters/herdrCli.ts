// Runs the herdr CLI for a write that the socket API has no method for: a
// pane's tags (`pane report-metadata`, d-120, NCC-129). An argument list,
// never a shell, a 5 s limit and only PATH and HOME of the server's
// environment, with HERDR_SOCKET_PATH set to the server's herdr socket. A
// fault is its errno code (or `exit-<n>`, `timeout`) only.
import { execFile } from 'node:child_process'
import { err, ok, type Result } from '@bridge/shared'

export type HerdrCli = (args: readonly string[]) => Promise<Result<void, string>>

export type HerdrCliOptions = {
  /** The `herdr` program: a name on PATH or an absolute path. */
  readonly command: string
  /** The herdr socket that the server reads. */
  readonly socket: string
  /** The server's environment; the CLI gets only PATH and HOME of it. */
  readonly env: Readonly<Record<string, string | undefined>>
}

export function createHerdrCli({ command, socket, env }: HerdrCliOptions): HerdrCli {
  const kept: Record<string, string> = { HERDR_SOCKET_PATH: socket }
  for (const key of ['PATH', 'HOME']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  return (args) =>
    new Promise((resolve) => {
      try {
        execFile(command, [...args], { env: kept, timeout: 5000 }, (error) => {
          if (error === null) resolve(ok(undefined))
          else if (error.killed === true) resolve(err('timeout'))
          else resolve(err(typeof error.code === 'number' ? `exit-${String(error.code)}` : (error.code ?? 'unknown')))
        })
      } catch {
        resolve(err('spawn'))
      }
    })
}
