// The Artifacts library (R26, R27): the Claude artifacts that Claude Code
// chats publish, which the server finds in the session files, and the links
// the owner adds by hand, such as a Codex site. A link, a title and a
// description go only in a response body, never in a URL, a log line or an
// error body; a URL names an artifact by its `ArtifactId`. No local path.
import { z } from 'zod'
import { ArtifactId, ChatId, WorkspaceId } from './ids.ts'

/** The most characters of a link. */
export const maxArtifactLink = 2048
/** The most characters of a title. */
export const maxArtifactTitle = 200
/** The most characters of a description. */
export const maxArtifactDescription = 500

/** Where an artifact comes from: a Claude artifact or a Codex site. */
export const ArtifactSource = z.enum(['claude', 'codex'])
export type ArtifactSource = z.infer<typeof ArtifactSource>

/** Who put the artifact in the library: the server found it in a chat's session file, or the owner added it. */
export const ArtifactFoundBy = z.enum(['session', 'owner'])
export type ArtifactFoundBy = z.infer<typeof ArtifactFoundBy>

/** A project's folder name under the chat root, such as "ncc-1701". */
export const ArtifactProject = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
export type ArtifactProject = z.infer<typeof ArtifactProject>

const httpsLink = z.url({ protocol: /^https$/ }).max(maxArtifactLink)
/** The link of a Claude artifact, as the Artifact tool gives it. */
const claudeLink = /^https:\/\/claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9_-]+$/

/** One artifact of the library. A found artifact has a claude.ai link and the chat that published it. */
export const Artifact = z
  .strictObject({
    id: ArtifactId,
    link: httpsLink,
    source: ArtifactSource,
    title: z.string().min(1).max(maxArtifactTitle),
    description: z.string().max(maxArtifactDescription),
    project: ArtifactProject.nullable(),
    /** The chat that published it; null for an artifact the owner added. */
    chat: ChatId.nullable(),
    publishedAt: z.iso.datetime(),
    /** When the library first had it; it is new to the owner when this is after `lastSeenAt`. */
    foundAt: z.iso.datetime(),
    foundBy: ArtifactFoundBy,
  })
  .refine((a) => a.foundBy === 'owner' || (a.source === 'claude' && claudeLink.test(a.link)), {
    message: 'a found artifact is a Claude artifact with a claude.ai link',
    path: ['link'],
  })
  .refine((a) => a.foundBy === 'owner' || a.chat !== null, {
    message: 'a found artifact names the chat that published it',
    path: ['chat'],
  })
export type Artifact = z.infer<typeof Artifact>

/** The response of `GET /api/artifacts`: every artifact not removed, newest first. */
export const ArtifactsResponse = z.strictObject({
  /** When the server last read the session files; null before the first read. */
  checkedAt: z.iso.datetime().nullable(),
  /** When the owner last looked at the library (`POST /api/artifacts/seen`); null before the first look. */
  lastSeenAt: z.iso.datetime().nullable(),
  /** The read stopped at its time or size cap, so some artifacts may come with a later read. */
  partial: z.boolean(),
  artifacts: z.array(Artifact),
})
export type ArtifactsResponse = z.infer<typeof ArtifactsResponse>

/** The chat that published an artifact, when that chat is in the workspace list now. */
export const ArtifactMadeIn = z.strictObject({
  chat: ChatId,
  workspace: WorkspaceId,
  title: z.string(),
  model: z.string().nullable(),
})
export type ArtifactMadeIn = z.infer<typeof ArtifactMadeIn>

/** The response of `GET /api/artifacts/:artifact`. */
export const ArtifactDetailResponse = z.strictObject({ artifact: Artifact, madeIn: ArtifactMadeIn.nullable() })
export type ArtifactDetailResponse = z.infer<typeof ArtifactDetailResponse>

/** The body of `POST /api/artifacts`: a link the server did not find. A Claude artifact's link is on claude.ai. */
export const AddArtifactRequest = z
  .strictObject({
    link: httpsLink,
    source: ArtifactSource,
    title: z.string().trim().min(1).max(maxArtifactTitle),
    project: ArtifactProject.nullable().optional(),
  })
  .refine((r) => r.source === 'codex' || claudeLink.test(r.link), {
    message: 'a Claude artifact link is https://claude.ai/artifact/…',
    path: ['link'],
  })
export type AddArtifactRequest = z.infer<typeof AddArtifactRequest>

/**
 * The response of `POST /api/artifacts`: the artifact, 201 when the library did not have the link, 200 with the
 * library's own entry when it did (a removed entry comes back).
 */
export const AddArtifactResponse = z.strictObject({ artifact: Artifact })
export type AddArtifactResponse = z.infer<typeof AddArtifactResponse>

/** The body of `PATCH /api/artifacts/:artifact`: the project to file it in, or null for none. */
export const FileArtifactRequest = z.strictObject({ project: ArtifactProject.nullable() })
export type FileArtifactRequest = z.infer<typeof FileArtifactRequest>

/** The body of `POST /api/artifacts/seen`: the owner looked at the library now. */
export const ArtifactsSeenRequest = z.strictObject({})
export type ArtifactsSeenRequest = z.infer<typeof ArtifactsSeenRequest>
