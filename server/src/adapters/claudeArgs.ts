// The command line of a running Claude chat, read for a model restart
// (slice W10): which of its flags the restart keeps. Only flags on the
// list below pass; any other token, a flag that skips a permission, or a
// permission mode that skips one refuses the restart. A value with a space
// in it reads as two tokens (the process table joins its arguments with
// spaces), so it refuses too, unless each part is a valid token: a value
// such as "/tmp/work --chrome" reads as `/tmp/work` and `--chrome`. macOS
// gives no argument boundaries of another process without a native
// helper. A skip flag or the bypass mode is refused wherever it shows,
// so such a split can only move text between flags on the list. Nothing
// here logs a token.
import { ChatName } from '@bridge/contract'

/** Flags the restart keeps, each with one value. */
const keptWithValue = new Set([
  '-n',
  '--name',
  '--permission-mode',
  '--add-dir',
  '--agent',
  '--settings',
  '--plugin-dir',
  '--effort',
])
/** Flags the restart keeps, with no value. */
const keptAlone = new Set(['--chrome', '--no-chrome'])
/** Flags the restart drops, as it gives its own session and model: with one value, with none, or with one or none. */
const droppedWithValue = new Set(['--model', '--session-id'])
const droppedAlone = new Set(['--continue', '-c', '--fork-session'])
const droppedMaybeValue = new Set(['--resume', '-r'])
/** Flags that skip permission checks: a chat started with one is never restarted, so none is passed on. */
const skipFlags = new Set(['--dangerously-skip-permissions', '--allow-dangerously-skip-permissions'])
/** Permission modes that do not skip a check; `bypassPermissions` skips them all. */
const safeModes = new Set(['default', 'acceptEdits', 'plan', 'auto', 'dontAsk'])
const efforts = new Set(['low', 'medium', 'high', 'xhigh', 'max'])

/** The flags to keep, in their order, and the chat's name when its command line gave one. */
export type LaunchArgs = { readonly kept: readonly string[]; readonly name: string | undefined }
export type LaunchRefusal = 'launchArgsUnknown' | 'skipsPermissions'

/** A value that a kept flag may take; a mode that skips a permission is `skipsPermissions`. */
const valueCheck = (flag: string, value: string): LaunchRefusal | undefined => {
  if (flag === '--permission-mode') {
    if (value === 'bypassPermissions') return 'skipsPermissions'
    return safeModes.has(value) ? undefined : 'launchArgsUnknown'
  }
  if (flag === '--effort') return efforts.has(value) ? undefined : 'launchArgsUnknown'
  if (flag === '-n' || flag === '--name') return ChatName.safeParse(value).success ? undefined : 'launchArgsUnknown'
  return value.startsWith('-') ? 'launchArgsUnknown' : undefined
}

/** Reads a process's argument line (`ps -o args=`): its program must be `claude`, and each token a known flag. */
export function launchArgsOf(line: string): LaunchArgs | LaunchRefusal {
  const [program, ...tokens] = line.trim().split(/\s+/)
  if (program === undefined || (program !== 'claude' && !program.endsWith('/claude'))) return 'launchArgsUnknown'
  const kept: string[] = []
  let name: string | undefined
  for (let at = 0; at < tokens.length; at += 1) {
    const token = tokens[at] ?? ''
    const eq = token.startsWith('--') ? token.indexOf('=') : -1
    const flag = eq === -1 ? token : token.slice(0, eq)
    const inline = eq === -1 ? undefined : token.slice(eq + 1)
    if (skipFlags.has(flag)) return 'skipsPermissions'
    if (keptAlone.has(flag) || droppedAlone.has(flag)) {
      if (inline !== undefined) return 'launchArgsUnknown'
      if (keptAlone.has(flag)) kept.push(flag)
      continue
    }
    if (droppedMaybeValue.has(flag)) {
      const next = tokens[at + 1]
      if (inline === undefined && next !== undefined && !next.startsWith('-')) at += 1
      continue
    }
    if (!keptWithValue.has(flag) && !droppedWithValue.has(flag)) return 'launchArgsUnknown'
    const value = inline ?? tokens[at + 1]
    if (inline === undefined) at += 1
    if (value === undefined || value === '') return 'launchArgsUnknown'
    const refused = valueCheck(flag, value)
    if (refused !== undefined) return refused
    if (droppedWithValue.has(flag)) continue
    kept.push(flag, value)
    if (flag === '-n' || flag === '--name') name = value
  }
  return { kept, name }
}

/**
 * The restart's argument list: the kept flags, the herdr name when the command line gave none, then the session
 * to resume and the new model.
 */
export function restartArgs(
  launch: LaunchArgs,
  herdrName: string | undefined,
  session: string,
  model: string,
): string[] {
  const named = launch.name === undefined && herdrName !== undefined ? ['-n', herdrName] : []
  return [...launch.kept, ...named, '--resume', session, '--model', model]
}
