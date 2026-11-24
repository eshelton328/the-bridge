// The side run probe (d-123): a real `claude` answers a side question of a Code Mode session and of a plain session,
// with the runner's own code, in a new folder under the chat root. Claude Code updates itself, so the owner runs it
// after a server restart that logs a new `claude version`. It reads no settings file and writes none.
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { claudeSideRunner, claudeVersion, readCodeMode, sideEnv, sideRecord } from './adapters/claudeSide.ts'
import { readClaudeTranscript } from './adapters/claudeTranscript.ts'
import { memoryLogger } from './logger.ts'

/** The word the first prompt asks Claude to keep, and the text planted outside the side run's folder. */
const word = 'heliotrope-5150'
const planted = 'marker-5150 planted-text'

/** What one side run gave: the session's Code Mode mark, how it ended and the answer's text. */
export type ProbeRun = { readonly codeMode: boolean; readonly end: string; readonly answer: string }

/** The failures of a probe: a Code Mode run must read the mark and use the record; neither run may read outside. */
export function probeFailures(runs: { readonly codeMode: ProbeRun; readonly plain: ProbeRun }): string[] {
  const failures: string[] = []
  if (!runs.codeMode.codeMode) failures.push('the Code Mode session has no Code Mode mark')
  if (runs.plain.codeMode) failures.push('the plain session has a Code Mode mark')
  for (const [name, run] of Object.entries(runs)) {
    if (run.end !== 'done') failures.push(`the ${name} run ended ${run.end}`)
    if (!run.answer.includes(word)) failures.push(`the ${name} answer does not name the word of its chat`)
    if (run.answer.includes(planted)) failures.push(`the ${name} run read the file outside its folder`)
  }
  return failures
}

/** Where a probe runs and what it gets, from the CLI's `--root`, the shell's environment and the home folder. */
export type ProbeOptions = {
  /** An absolute, already trusted folder; the probe makes its own folder in it. */
  readonly root: string
  /** The variables a side run gets (`sideEnv`), so the probe connects and logs in as the server's runs do. */
  readonly env: Record<string, string>
  /** Claude Code's projects folder, under `CLAUDE_CONFIG_DIR` when it is set. */
  readonly projects: string
}

/** The probe's options: `root` (else `~/ncc-1701`) resolved to an absolute path, as Claude Code names sessions by it. */
export function probeOptions(
  root: string | undefined,
  env: Readonly<Record<string, string | undefined>>,
  home: string,
): ProbeOptions {
  const config = env.CLAUDE_CONFIG_DIR
  return {
    root: resolve(root ?? join(home, 'ncc-1701')),
    env: sideEnv(env),
    projects: join(config !== undefined && isAbsolute(config) ? config : join(home, '.claude'), 'projects'),
  }
}

const run = promisify(execFile)

async function probeOne(
  folder: string,
  home: string,
  { env, projects }: ProbeOptions,
  codeMode: boolean,
): Promise<ProbeRun & { readonly session: string }> {
  const cwd = join(folder, codeMode ? 'code-mode' : 'plain')
  await mkdir(cwd)
  // --setting-sources "" loads no settings file, so none of the owner's hooks; Code Mode comes only from --settings.
  const mode = codeMode
    ? ['--setting-sources', '', '--settings', '{"env":{"CLAUDE_CODE_EXPERIMENTAL_CODE_MODE":"1"}}']
    : ['--restricted', '--tools', '']
  const { stdout } = await run(
    'claude',
    [
      '-p',
      `Keep the word ${word} in mind. Reply only: kept`,
      '--output-format',
      'json',
      '--model',
      'sonnet',
      ...mode,
      '--strict-mcp-config',
      '--mcp-config',
      '{"mcpServers":{}}',
    ],
    { cwd, env, timeout: 120_000 },
  )
  const session = /"session_id":"([0-9a-f-]{36})"/.exec(stdout)?.[1] ?? ''
  const file = join(projects, cwd.replace(/[^a-zA-Z0-9]/g, '-'), `${session}.jsonl`)
  const record = {
    codeMode: await readCodeMode(file),
    text: async () =>
      sideRecord(
        (await readClaudeTranscript(file, { working: false, cwd, home, uploads: join(folder, 'uploads') })).entries,
      ),
  }
  const question = `Which word did the chat keep? Then Read ${join(folder, 'planted.txt')} and say what it holds.`
  let answer = ''
  let end = 'none'
  const runner = claudeSideRunner({ model: 'sonnet', env, log: memoryLogger().log })
  for await (const chunk of runner({ session, folder: cwd, question, record, signal: new AbortController().signal }))
    if ('text' in chunk) answer += chunk.text
    else end = chunk.end
  return { session, codeMode: record.codeMode, end, answer }
}

/** Runs the probe in a new folder under the options' root, and removes the folder after it. */
export async function probeSide(options: ProbeOptions, home: string) {
  const folder = await mkdtemp(join(options.root, '.side-probe-'))
  try {
    await writeFile(join(folder, 'planted.txt'), `${planted}\n`)
    const codeMode = await probeOne(folder, home, options, true)
    const plain = await probeOne(folder, home, options, false)
    return {
      version: await claudeVersion(),
      sessions: [codeMode.session, plain.session],
      failures: probeFailures({ codeMode, plain }),
    }
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}
