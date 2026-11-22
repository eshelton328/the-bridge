// The server's own process and each process above it (R41), so a workspace
// close can refuse a workspace whose pane runs the server or the chat that
// started it. It runs `ps` with an argument list, never a shell, and stops
// at pid 1. A `ps` that fails, a loop or more than 64 steps give undefined,
// so the caller refuses the close: a part of the tree proves nothing.
import { execFile } from 'node:child_process'

const maxSteps = 64

/** The parent of `pid`, or undefined when `ps` cannot tell. */
function parentOf(pid: number): Promise<number | undefined> {
  return new Promise((resolve) => {
    execFile('ps', ['-o', 'ppid=', '-p', String(pid)], { timeout: 5000 }, (error, stdout) => {
      const parent = Number.parseInt(stdout.trim(), 10)
      resolve(error === null && Number.isInteger(parent) && parent > 0 ? parent : undefined)
    })
  })
}

/** `pid` and each process above it, up to and without pid 1; undefined when the walk cannot finish. */
export async function processAncestors(
  pid: number,
  parent: (pid: number) => Promise<number | undefined> = parentOf,
): Promise<ReadonlySet<number> | undefined> {
  const found = new Set([pid])
  let at = pid
  for (let step = 0; step < maxSteps; step += 1) {
    const above = await parent(at)
    if (above === 1) return found
    if (above === undefined || found.has(above)) return undefined
    found.add(above)
    at = above
  }
  return undefined
}
