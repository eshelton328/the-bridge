// Runs one side question (R-side chat) with `claude -p`: a fork of the chat's saved session that is not saved, in the
// chat's folder, with only the read tools and no MCP server. The question goes on stdin, never in an argument, and the
// answer comes back as the text of each top-level assistant message of the stream-json output. It never throws: a
// process that fails, ends with no result or cannot start ends the answer as `failed`.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { z } from 'zod'
import type { Logger } from '../logger.ts'
import { codeModeKey, readCodeMode } from './claudeSettings.ts'
import type { SideChunk, SideRunner } from '../services/agentPort.ts'

/** The most stderr a failed run logs: its last part. */
const maxStderr = 4096

/** The arguments of a side run: each one fixed but the session and the model. */
export function sideArgs(session: string, model: string): string[] {
  return [
    '-p',
    '--resume',
    session,
    '--fork-session',
    '--no-session-persistence',
    '--model',
    model,
    '--tools',
    'Read,Grep,Glob',
    '--output-format',
    'stream-json',
    // Print mode writes stream-json only with --verbose.
    '--verbose',
    '--mcp-config',
    '{"mcpServers":{}}',
    '--strict-mcp-config',
    // No user, project or local settings file: none of the owner's hooks, allow rules or plugins, and the file tools
    // stay in the chat's folder. It also drops the code-running tools that --tools leaves out.
    '--restricted',
  ]
}

const TextBlock = z.object({ type: z.literal('text'), text: z.string() })
const Line = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('assistant'),
    // A subagent's message names the tool call that started it; the answer is the top-level text only.
    parent_tool_use_id: z.string().nullish(),
    message: z.object({ content: z.array(z.unknown()) }),
  }),
  z.object({ type: z.literal('result'), is_error: z.boolean().optional(), subtype: z.string().optional() }),
])

function lineOf(raw: string): z.infer<typeof Line> | undefined {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    // Not a JSON line, such as a warning on stdout: it is not part of the answer.
    return undefined
  }
  const line = Line.safeParse(json)
  return line.success ? line.data : undefined
}

/**
 * The only variables of the server's environment that a side run gets: what `claude` needs to find its tools, its
 * login and the network. Each other one stays out, such as a `HERDR_` variable (in a herdr pane, Claude Code's herdr
 * hook would report the side session as the server pane's) or a token the server holds.
 */
const keptEnv = [
  'PATH',
  'HOME',
  'USER',
  'LOGNAME',
  'SHELL',
  'TMPDIR',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TZ',
  'CLAUDE_CONFIG_DIR',
  codeModeKey,
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NO_PROXY',
  'https_proxy',
  'http_proxy',
  'no_proxy',
  'NODE_EXTRA_CA_CERTS',
  'SSL_CERT_FILE',
] as const

function sideEnv(env: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const kept: Record<string, string> = {}
  for (const key of keptEnv) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  return kept
}

/**
 * A side runner that starts `command` (`claude` by default) with {@link sideArgs}. `model` is the model of every
 * side answer, and `env`
 * the server's environment, which the run gets through {@link sideEnv}.
 */
export function claudeSideRunner({
  model,
  env,
  log,
  settingsFile,
  command = ['claude'],
  timeoutMs = 120_000,
  killAfterMs = 5_000,
}: {
  readonly model: string
  readonly env: Readonly<Record<string, string | undefined>>
  readonly log: Logger
  /**
   * The owner's Claude Code settings file. `--restricted` loads no settings file, so a run copies its Code Mode value
   * (`env`) into the process's environment: a session started in Code Mode resumes only in Code Mode.
   */
  readonly settingsFile?: string
  readonly command?: readonly [string, ...string[]]
  /** A run that has not ended by then gets SIGTERM and ends `failed`, also when the caller sets no limit. */
  readonly timeoutMs?: number
  /** A process still there this long after SIGTERM gets SIGKILL. */
  readonly killAfterMs?: number
}): SideRunner {
  const childEnv = sideEnv(env)
  const [bin, ...pre] = command
  return async function* run({ session, folder, question, signal }): AsyncGenerator<SideChunk> {
    if (signal.aborted) return
    // Read at each run, as the owner can turn Code Mode on or off between questions.
    const codeMode = settingsFile === undefined ? undefined : await readCodeMode(settingsFile)
    const child = spawn(bin, [...pre, ...sideArgs(session, model)], {
      cwd: folder,
      env: codeMode === undefined ? childEnv : { ...childEnv, [codeModeKey]: codeMode },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    // The last part of stderr, logged only when the run fails; it never holds the question, which goes on stdin.
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (piece: string) => {
      stderr = (stderr + piece).slice(-maxStderr)
    })
    const exited = new Promise<void>((resolve) => {
      child.once('close', () => {
        resolve()
      })
      child.once('error', () => {
        resolve()
      })
    })
    // An object, so the checks after the loop read what the abort and the timer wrote.
    const state = { stopped: false, timedOut: false }
    let killer: NodeJS.Timeout | undefined
    const end = () => {
      if (child.exitCode !== null || child.signalCode !== null) return
      child.kill('SIGTERM')
      killer ??= setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      }, killAfterMs)
    }
    const stop = () => {
      state.stopped = true
      end()
    }
    const timer = setTimeout(() => {
      state.timedOut = true
      end()
    }, timeoutMs)
    signal.addEventListener('abort', stop, { once: true })
    // A process that does not start closes stdin at once; the write error ends the run as failed below.
    child.stdin.once('error', () => undefined)
    child.stdin.end(question)
    let wrote = false
    let result: 'done' | 'failed' = 'failed'
    try {
      for await (const raw of createInterface({ input: child.stdout })) {
        const line = lineOf(raw)
        if (line === undefined) continue
        if (line.type === 'result') {
          result =
            line.is_error === true || (line.subtype !== undefined && line.subtype !== 'success') ? 'failed' : 'done'
          continue
        }
        if (typeof line.parent_tool_use_id === 'string') continue
        const text = line.message.content.flatMap((block) => {
          const found = TextBlock.safeParse(block)
          return found.success ? [found.data.text] : []
        })
        if (text.length === 0) continue
        yield { text: (wrote ? '\n\n' : '') + text.join('\n\n') }
        wrote = true
      }
      await exited
    } catch {
      // A read that fails ends the answer as failed.
      result = 'failed'
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', stop)
      end()
      await exited
      if (killer !== undefined) clearTimeout(killer)
    }
    if (state.stopped) return
    const outcome = child.exitCode === 0 && !state.timedOut ? result : 'failed'
    if (outcome === 'failed')
      log.warn('side run failed', {
        exitCode: child.exitCode,
        signal: child.signalCode,
        timedOut: state.timedOut,
        stderr,
      })
    yield { end: outcome }
  }
}
