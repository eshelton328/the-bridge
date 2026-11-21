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

/**
 * A pane on a machine: "<machine>/<local>". The local part is opaque, not herdr's own ID, and it stays the same for
 * the pane's life, also when its chat ID changes (after /clear a Claude chat has a new session, so a new chat ID).
 */
export const PaneId = z.string().regex(scoped).brand<'PaneId'>()
export type PaneId = z.infer<typeof PaneId>

/** A tab of a workspace on a machine: "<machine>/<local>", such as "mac-mini/w17:t1". */
export const TabId = z.string().regex(scoped).brand<'TabId'>()
export type TabId = z.infer<typeof TabId>

/** A file that the owner uploads to attach to a prompt: 22 characters of base64url, made by the server at random. */
export const UploadId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{22}$/)
  .brand<'UploadId'>()
export type UploadId = z.infer<typeof UploadId>

/**
 * The page's own ID of one prompt send (`crypto.randomUUID()` fits), so it can read the send's result after a reload.
 */
export const SendId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,64}$/)
  .brand<'SendId'>()
export type SendId = z.infer<typeof SendId>

/** An artifact in the library: the first 16 hex characters of the sha256 of its link, so the link stays out of URLs. */
export const ArtifactId = z
  .string()
  .regex(/^[0-9a-f]{16}$/)
  .brand<'ArtifactId'>()
export type ArtifactId = z.infer<typeof ArtifactId>

/** The machine ID and the local part of a workspace, chat, pane or tab ID. */
export function splitId(id: WorkspaceId | ChatId | PaneId | TabId): { machine: MachineId; local: string } {
  const at = id.indexOf('/')
  return { machine: MachineId.parse(id.slice(0, at)), local: id.slice(at + 1) }
}
