// Runs one side question (R-side chat) with `claude -p`: a fork of the chat's saved session that is not saved, in the
// chat's folder, with only the read tools and no MCP server. The question goes on stdin, never in an argument, and the
// answer comes back as the text of each top-level assistant message of the stream-json output. It never throws: a
// process that fails, ends with no result or cannot start ends the answer as `failed`.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { z } from 'zod'
import type { SideChunk, SideRunner } from '../services/agentPort.ts'

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
 * The environment of a side run: the server's own, less each `HERDR_` variable. In a herdr pane those name the
 * server's pane, and Claude Code's herdr hook would report the side session as that pane's session.
 */
function sideEnv(env: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const kept: Record<string, string> = {}
  for (const [key, value] of Object.entries(env))
    if (!key.startsWith('HERDR_') && value !== undefined) kept[key] = value
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
  command = ['claude'],
}: {
  readonly model: string
  readonly env: Readonly<Record<string, string | undefined>>
  readonly command?: readonly [string, ...string[]]
}): SideRunner {
  const childEnv = sideEnv(env)
  const [bin, ...pre] = command
  return async function* run({ session, folder, question, signal }): AsyncGenerator<SideChunk> {
    if (signal.aborted) return
    const child = spawn(bin, [...pre, ...sideArgs(session, model)], {
      cwd: folder,
      env: childEnv,
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const exited = new Promise<void>((resolve) => {
      child.once('close', () => {
        resolve()
      })
      child.once('error', () => {
        resolve()
      })
    })
    // An object, so the check after the loop reads what the abort wrote.
    const state = { stopped: false }
    const stop = () => {
      state.stopped = true
      child.kill('SIGTERM')
    }
    signal.addEventListener('abort', stop, { once: true })
    // A process that does not start closes stdin at once; the write error ends the run as failed below.
    child.stdin.once('error', () => undefined)
    child.stdin.end(question)
    let wrote = false
    let end: 'done' | 'failed' = 'failed'
    try {
      for await (const raw of createInterface({ input: child.stdout })) {
        const line = lineOf(raw)
        if (line === undefined) continue
        if (line.type === 'result') {
          end = line.is_error === true || (line.subtype !== undefined && line.subtype !== 'success') ? 'failed' : 'done'
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
      end = 'failed'
    } finally {
      signal.removeEventListener('abort', stop)
      if (child.exitCode === null) child.kill('SIGTERM')
    }
    if (state.stopped) return
    yield { end: child.exitCode === 0 ? end : 'failed' }
  }
}
