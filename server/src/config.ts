// The server's settings, every one from an environment variable (d-111), so
// a test or a later ephemeral environment points it anywhere. The server
// does not start when one is missing or wrong.
import { MachineId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'

const path = z.string().startsWith('/', 'must be an absolute path')

const Env = z.object({
  BRIDGE_PORT: z.coerce.number().int().min(1).max(65535),
  BRIDGE_MACHINE_ID: MachineId,
  BRIDGE_OWNER_LOGIN: z.string().min(1),
  BRIDGE_HERDR_SOCKET: path,
  BRIDGE_BRAIN_DIR: path,
  BRIDGE_DB_FILE: path,
  BRIDGE_CLAUDE_PROJECTS: path,
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
  })
}
