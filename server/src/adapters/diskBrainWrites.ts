// The brain's writes on disk (f-008, increment four). A new project runs the project-setup helper's `init` as
// `python -I` with an argument list, never a shell, a time limit and only PATH, HOME, LANG and TMPDIR (the helper's
// lock file is in TMPDIR). Then it makes `<chat root>/projects/<slug>/` with its `CLAUDE.md` and commits the brain's
// paths with `git add --` and `git commit --`, a fixed message and the brain's hooks. Each folder is checked by real
// path, so a symlink cannot move a write out of it. A failed write after `init` removes both new folders and puts
// back the two index files, so a retry can make the project. A fault is a code only, and no helper output is logged.
import { execFile } from 'node:child_process'
import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { BrainWriteFault, BrainWrites } from '../services/brainWrites.ts'
import { projectShim } from '../services/brainWrites.ts'

/** How long the helper or one git command may run. */
const runTimeoutMs = 30_000
/** The commit message of a new project: fixed, so no name the owner typed goes into it. */
export const createMessage = 'docs(projects): add a project from the Projects app'
/** The files in the git folder that show another git command in progress. */
const busyMarks = ['index.lock', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']
const InitReply = z.object({ ok: z.literal(true), created: z.boolean() })

export type DiskBrainWritesOptions = {
  readonly brainDir: string
  readonly chatRoot: string
  /** The Python of the helper's venv. */
  readonly python: string
  /** The helper, `toolkit/skills/project-setup/scripts/project_setup.py`. */
  readonly helper: string
  readonly env: Readonly<Record<string, string | undefined>>
}

type Ran =
  | { readonly ok: true; readonly stdout: string }
  | { readonly ok: false; readonly code: string; readonly stderr: string }

const run = (command: string, args: readonly string[], cwd: string, env: Record<string, string>) =>
  new Promise<Ran>((resolve) => {
    try {
      execFile(
        command,
        [...args],
        { cwd, env, timeout: runTimeoutMs, maxBuffer: 1024 ** 2, encoding: 'utf8' },
        (error, stdout, stderr) => {
          if (error === null) resolve({ ok: true, stdout })
          else {
            const code = typeof error.code === 'number' ? `exit-${String(error.code)}` : (error.code ?? 'unknown')
            resolve({ ok: false, code: error.killed === true ? 'timeout' : code, stderr })
          }
        },
      )
    } catch {
      resolve({ ok: false, code: 'spawn', stderr: '' })
    }
  })

const failed = (code: string): Result<never, BrainWriteFault> => err({ reason: 'failed', code })
const codeOf = (error: unknown) =>
  error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'unknown'
/** The value of `work`, or its errno code as the fault. */
const attempt = async <T>(work: () => Promise<T>): Promise<Result<T, BrainWriteFault>> => {
  try {
    return ok(await work())
  } catch (error) {
    return failed(codeOf(error))
  }
}
/** True when one of `paths` names an entry, a symlink too; a fault other than ENOENT throws. */
const anyExists = async (paths: readonly string[]) => {
  const entry = (path: string) =>
    lstat(path).then(
      () => true,
      (error: unknown) => {
        if (codeOf(error) === 'ENOENT') return false
        throw error
      },
    )
  return (await Promise.all(paths.map(entry))).includes(true)
}

export function createDiskBrainWrites({
  brainDir,
  chatRoot,
  python,
  helper,
  env,
}: DiskBrainWritesOptions): BrainWrites {
  const kept: Record<string, string> = {}
  for (const key of ['PATH', 'HOME', 'LANG', 'TMPDIR']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  const gitEnv = { ...kept, GIT_TERMINAL_PROMPT: '0' }

  /** The real brain and the two real `projects` folders, each a plain folder in its root. */
  const roots = async (): Promise<
    Result<{ brain: string; brainProjects: string; chatProjects: string }, BrainWriteFault>
  > => {
    try {
      const [brain, chat] = await Promise.all([realpath(brainDir), realpath(chatRoot)])
      const [brainProjects, chatProjects] = await Promise.all([
        realpath(join(brain, 'projects')),
        realpath(join(chat, 'projects')),
      ])
      if (brainProjects !== join(brain, 'projects') || chatProjects !== join(chat, 'projects')) return failed('symlink')
      return ok({ brain, brainProjects, chatProjects })
    } catch (error) {
      return failed(codeOf(error))
    }
  }
  const takenIn = (folders: readonly string[], slug: string) =>
    attempt(() => anyExists(folders.map((folder) => join(folder, slug))))
  const busy = async (brain: string): Promise<Result<boolean, BrainWriteFault>> => {
    const dir = await run('git', ['rev-parse', '--absolute-git-dir'], brain, gitEnv)
    if (!dir.ok) return failed(`git-${dir.code}`)
    return attempt(() => anyExists(busyMarks.map((mark) => join(dir.stdout.trim(), mark))))
  }
  const git = async (brain: string, args: readonly string[]): Promise<Result<void, BrainWriteFault>> => {
    const ran = await run('git', args, brain, gitEnv)
    if (ran.ok) return ok(undefined)
    return ran.stderr.includes('index.lock') ? err({ reason: 'busy' }) : failed(`git-${ran.code}`)
  }

  // One write at a time, so two creates that cross never commit each other's files.
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }

  return {
    async taken(slug) {
      const found = await roots()
      return found.ok ? takenIn([found.value.brainProjects, found.value.chatProjects], slug) : found
    },
    createProject: ({ slug, name, purpose, icon }) =>
      serial(async () => {
        const found = await roots()
        if (!found.ok) return found
        const { brain, brainProjects, chatProjects } = found.value
        const locked = await busy(brain)
        if (!locked.ok) return locked
        if (locked.value) return err({ reason: 'busy' })
        const taken = await takenIn([brainProjects, chatProjects], slug)
        if (!taken.ok) return taken
        if (taken.value) return ok('taken')
        const indexes = ['projects/AGENTS.md', 'projects/README.md']
        const before = await attempt(() => Promise.all(indexes.map((path) => readFile(join(brain, path), 'utf8'))))
        if (!before.ok) return before
        const paths = [
          ...['README.md', 'AGENTS.md', 'CLAUDE.md', 'project.yaml'].map((file) => `projects/${slug}/${file}`),
          ...indexes,
        ]
        /** True once this write made the chat-root folder, so an undo never removes one that another process made. */
        let madeFolder = false
        /** Undoes this write: the brain home was not there before it, and the index files get their old text. */
        const undo = async (fault: Result<never, BrainWriteFault>) => {
          await run('git', ['reset', '-q', '--', ...paths], brain, gitEnv)
          try {
            await Promise.all([
              rm(join(brainProjects, slug), { recursive: true, force: true }),
              ...(madeFolder ? [rm(join(chatProjects, slug), { recursive: true, force: true })] : []),
              ...indexes.map((path, i) => writeFile(join(brain, path), before.value[i] ?? '')),
            ])
          } catch (error) {
            // The home may stay, so a retry is `taken`: the fault says so.
            return failed(`undo-${codeOf(error)}`)
          }
          return fault
        }
        // "--key=value", so a name that starts with "-" stays a value.
        const args = ['-I', helper, 'init', '--brain', '.', `--slug=${slug}`, `--name=${name}`]
        if (purpose !== '') args.push(`--purpose=${purpose}`)
        if (icon !== null) args.push(`--icon=${icon}`)
        const made = await run(python, args, brain, kept)
        if (!made.ok) return failed(`init-${made.code}`)
        let reply: unknown
        try {
          reply = JSON.parse(made.stdout)
        } catch {
          return failed('init-reply')
        }
        const read = InitReply.safeParse(reply)
        if (!read.success) return failed('init-reply')
        if (!read.data.created) return ok('taken')
        try {
          await mkdir(join(chatProjects, slug))
          madeFolder = true
          await writeFile(join(chatProjects, slug, 'CLAUDE.md'), projectShim(slug), { flag: 'wx' })
        } catch (error) {
          return undo(failed(codeOf(error)))
        }
        const added = await git(brain, ['add', '--', ...paths])
        if (!added.ok) return undo(added)
        const committed = await git(brain, ['commit', '-q', '-m', createMessage, '--', ...paths])
        return committed.ok ? ok('created') : undo(committed)
      }),
  }
}
