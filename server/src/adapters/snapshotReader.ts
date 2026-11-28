// The reader of a repository's diagram from its snapshot (f-008 increment
// two, A1b). The main thread lists the tracked files with git (an argument
// list, no global or system config, no fsmonitor, a time limit and a buffer
// cap), keeps only regular files (mode 100644 or 100755, never a symlink),
// and opens only the package.json files outside node_modules: each after an
// lstat, a realpath check that it stays in the snapshot and a 1 MB check, with
// a cap on the bytes of all. A worker_thread with memory limits and a time
// limit turns the bytes into the model (`architectureWorker.ts`). A fault is
// its code only: no path and no file text goes into an error or a log.
import { execFile } from 'node:child_process'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { Worker } from 'node:worker_threads'
import { ArchitectureModel } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { SnapshotReader } from '../services/architectureRunner.ts'
import type { ProjectFault } from '../services/projects.ts'

export type SnapshotReaderOptions = {
  /** The `git` program: a name on PATH or an absolute path. */
  readonly command: string
  /** The server's environment; git gets only PATH, HOME and LANG of it. */
  readonly env: Readonly<Record<string, string | undefined>>
  /** The caps, which a test makes small. */
  readonly maxFiles?: number
  readonly maxFileBytes?: number
  readonly maxTotalBytes?: number
  readonly timeoutMs?: number
  /** The worker's module; a test gives a slow one. */
  readonly workerFile?: URL
}

const fault = (code: string): Result<never, ProjectFault> => err({ reason: 'failed', code })

/** One tracked file of `git ls-files -z --stage`: "<mode> <object> <stage>\t<path>". */
const entry = /^(\d{6}) [0-9a-f]{40,64} \d\t(.+)$/s

/** A package.json that the rules read: not under node_modules. */
const isManifest = (path: string) =>
  (path === 'package.json' || path.endsWith('/package.json')) && !path.split('/').includes('node_modules')

export function createSnapshotReader({
  command,
  env,
  maxFiles = 20_000,
  maxFileBytes = 1024 ** 2,
  maxTotalBytes = 64 * 1024 ** 2,
  timeoutMs = 60_000,
  workerFile = new URL('./architectureWorker.ts', import.meta.url),
}: SnapshotReaderOptions): SnapshotReader {
  const kept: Record<string, string> = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
  for (const key of ['PATH', 'HOME', 'LANG']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  const listed = (dir: string) =>
    new Promise<Result<string, ProjectFault>>((resolve) => {
      try {
        execFile(
          command,
          ['-c', 'core.fsmonitor=false', '-c', 'core.quotePath=false', '-C', dir, 'ls-files', '-z', '--stage'],
          // Room for maxFiles paths of 1,000 bytes and the mode, the object and the stage of each.
          { env: kept, timeout: timeoutMs, maxBuffer: maxFiles * 1_100, encoding: 'utf8' },
          (error, stdout) => {
            if (error === null) resolve(ok(stdout))
            else if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') resolve(fault('too-many-files'))
            else resolve(fault(error.killed === true ? 'timeout' : 'git-ls-files'))
          },
        )
      } catch {
        resolve(fault('spawn'))
      }
    })

  const work = (files: readonly { path: string; bytes: Uint8Array }[]) =>
    new Promise<Result<ArchitectureModel, ProjectFault>>((resolve) => {
      const worker = new Worker(workerFile, {
        workerData: { files },
        resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 32 },
      })
      let done = false
      const end = (answer: Result<ArchitectureModel, ProjectFault>) => {
        if (done) return
        done = true
        clearTimeout(timer)
        void worker.terminate()
        resolve(answer)
      }
      const timer = setTimeout(() => {
        end(fault('timeout'))
      }, timeoutMs)
      worker.on('message', (message: unknown) => {
        const model: unknown =
          typeof message === 'object' && message !== null && Object.hasOwn(message, 'model')
            ? Reflect.get(message, 'model')
            : undefined
        if (model === null) {
          end(fault('no-packages'))
          return
        }
        // The worker is the server's own code, but its answer is still checked as data.
        const parsed = ArchitectureModel.safeParse(model)
        end(parsed.success ? ok(parsed.data) : fault('EBADDATA'))
      })
      worker.on('error', (error: unknown) => {
        const code: unknown = typeof error === 'object' && error !== null ? Reflect.get(error, 'code') : undefined
        end(fault(code === 'ERR_WORKER_OUT_OF_MEMORY' ? 'too-large' : 'worker'))
      })
      worker.on('exit', () => {
        end(fault('worker'))
      })
    })

  return {
    async read(dir) {
      let top: string
      try {
        top = await realpath(dir)
      } catch {
        return fault('no-snapshot')
      }
      const out = await listed(top)
      if (!out.ok) return out
      const entries = out.value.split('\0').filter((line) => line !== '')
      if (entries.length > maxFiles) return fault('too-many-files')
      const files: { path: string; bytes: Uint8Array }[] = []
      let total = 0
      for (const line of entries) {
        const parts = entry.exec(line)
        if (parts === null) return fault('EBADDATA')
        const [, mode = '', path = ''] = parts
        if ((mode !== '100644' && mode !== '100755') || !isManifest(path)) continue
        const full = join(top, path)
        try {
          const found = await lstat(full)
          if (!found.isFile() || found.size > maxFileBytes) continue
          const real = await realpath(full)
          if (!real.startsWith(top + sep)) continue
          total += found.size
          if (total > maxTotalBytes) return fault('too-large')
          const bytes = await readFile(real)
          if (bytes.length > maxFileBytes) continue
          files.push({ path, bytes })
        } catch {
          // A file that went or cannot be read is skipped: the snapshot is the server's own clone.
          continue
        }
      }
      return work(files)
    },
  }
}
