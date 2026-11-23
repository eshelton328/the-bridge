// The side run probe (d-123): a real `claude` answers a side question of a Code Mode session and of a plain session,
// with the runner's own code, in a new folder under the chat root. Claude Code updates itself, so the owner runs it
// after a server restart that logs a new `claude version`. It reads no settings file and writes none.
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { claudeSideRunner, claudeVersion, readCodeMode, sideRecord } from './adapters/claudeSide.ts'
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

const run = promisify(execFile)

async function probeOne(
  folder: string,
  home: string,
  env: Record<string, string>,
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
  const file = join(home, '.claude', 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'), `${session}.jsonl`)
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

/** Runs the probe in a new folder under `root` (an already trusted folder), and removes the folder after it. */
export async function probeSide(root: string, home: string, env: Record<string, string>) {
  const folder = await mkdtemp(join(root, '.side-probe-'))
  try {
    await writeFile(join(folder, 'planted.txt'), `${planted}\n`)
    const codeMode = await probeOne(folder, home, env, true)
    const plain = await probeOne(folder, home, env, false)
    return {
      version: await claudeVersion(),
      sessions: [codeMode.session, plain.session],
      failures: probeFailures({ codeMode, plain }),
    }
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}
