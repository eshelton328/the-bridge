// The server's settings, every one from an environment variable (d-111), so
// a test or a later ephemeral environment points it anywhere. The server
// does not start when one is missing or wrong.
import { dirname, join } from 'node:path'
import { MachineId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import { type LogLevel, logLevels } from './logger.ts'

const path = z.string().startsWith('/', 'must be an absolute path')

const Env = z.object({
  BRIDGE_PORT: z.coerce.number().int().min(1).max(65535),
  BRIDGE_MACHINE_ID: MachineId,
  BRIDGE_OWNER_LOGIN: z.string().min(1),
  BRIDGE_HERDR_SOCKET: path,
  BRIDGE_BRAIN_DIR: path,
  BRIDGE_DB_FILE: path,
  BRIDGE_CLAUDE_PROJECTS: path,
  BRIDGE_CLAUDE_SETTINGS: path.optional(),
  BRIDGE_CHAT_ROOT: path.optional(),
  BRIDGE_LOG_DIR: path,
  BRIDGE_LOG_LEVEL: z.enum(logLevels).default('info'),
  BRIDGE_PUSH_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:\/\/)\S+$/, 'must be a mailto: or https:// URL')
    .optional(),
})

export type Config = {
  readonly port: number
  readonly machine: MachineId
  readonly owner: string
  /** herdr's socket API, such as ~/.config/herdr/herdr.sock. */
  readonly herdrSocket: string
  /** The brain folder; read from slice 3 on. */
  readonly brainDir: string
  /** The SQLite file of machine state; slice 6 adds its first table. */
  readonly dbFile: string
  /** Where Claude Code keeps its session files, such as ~/.claude/projects. */
  readonly claudeProjects: string
  /** Claude Code's settings file, read only; the settings.json beside the projects folder when not set. */
  readonly claudeSettings: string
  /** The folder under which the app may start a chat (slice W3); the brain folder's parent when not set. */
  readonly chatRoot: string
  /** The folder of the log files, one for each day (d-115). */
  readonly logDir: string
  readonly logLevel: LogLevel
  /** The contact that the VAPID key names to the push services (d-118); the public repository when not set, never a personal address. */
  readonly pushSubject: string
}

/** The config from the environment, or one line for each variable that is missing or wrong. */
export function readConfig(env: Readonly<Record<string, string | undefined>>): Result<Config, string[]> {
  const parsed = Env.safeParse(env)
  if (!parsed.success) return err(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`))
  const e = parsed.data
  return ok({
    port: e.BRIDGE_PORT,
    machine: e.BRIDGE_MACHINE_ID,
    owner: e.BRIDGE_OWNER_LOGIN,
    herdrSocket: e.BRIDGE_HERDR_SOCKET,
    brainDir: e.BRIDGE_BRAIN_DIR,
    dbFile: e.BRIDGE_DB_FILE,
    claudeProjects: e.BRIDGE_CLAUDE_PROJECTS,
    claudeSettings: e.BRIDGE_CLAUDE_SETTINGS ?? join(dirname(e.BRIDGE_CLAUDE_PROJECTS), 'settings.json'),
    chatRoot: e.BRIDGE_CHAT_ROOT ?? dirname(e.BRIDGE_BRAIN_DIR),
    logDir: e.BRIDGE_LOG_DIR,
    logLevel: e.BRIDGE_LOG_LEVEL,
    pushSubject: e.BRIDGE_PUSH_SUBJECT ?? 'https://github.com/eshelton328/the-bridge',
  })
}
