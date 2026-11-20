// The IDs that cross the API. Every workspace and chat ID holds the ID of
// the machine it lives on (d-111), so two machines never give the same ID.
// A brand stops one kind of ID from being passed where another is expected;
// parse a string to get one, never cast.
import { z } from 'zod'

/** Lowercase letters, digits and single hyphens, such as "mac-mini". */
const machinePart = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** What follows the machine ID: letters, digits and . _ : - with no slash or space. */
const localPart = /^[A-Za-z0-9._:-]+$/
const scoped = new RegExp(`^${machinePart.source.slice(1, -1)}/${localPart.source.slice(1, -1)}$`)

/** The local part of a workspace or chat ID, as an adapter reads it before it adds the machine. */
export const LocalIdPart = z.string().regex(localPart)

/** The ID of one machine that runs a node of the-bridge server. */
export const MachineId = z.string().regex(machinePart).brand<'MachineId'>()
export type MachineId = z.infer<typeof MachineId>

/** A workspace on a machine: "<machine>/<local>", such as "mac-mini/w17". */
export const WorkspaceId = z.string().regex(scoped).brand<'WorkspaceId'>()
export type WorkspaceId = z.infer<typeof WorkspaceId>

/** A chat on a machine: "<machine>/<local>", such as "mac-mini/5af4ed88-2e47-4bbb-aafa-f5206af29daf". */
export const ChatId = z.string().regex(scoped).brand<'ChatId'>()
export type ChatId = z.infer<typeof ChatId>

/** A tab of a workspace on a machine: "<machine>/<local>", such as "mac-mini/w17:t1". */
export const TabId = z.string().regex(scoped).brand<'TabId'>()
export type TabId = z.infer<typeof TabId>

/** The machine ID and the local part of a workspace, chat or tab ID. */
export function splitId(id: WorkspaceId | ChatId | TabId): { machine: MachineId; local: string } {
  const at = id.indexOf('/')
  return { machine: MachineId.parse(id.slice(0, at)), local: id.slice(at + 1) }
}
