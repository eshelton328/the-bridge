// The Architecture tab of a project's page (f-008 increment two, R9 to R15): a
// diagram for each scope (the system, or one repository) that a routine on the
// server makes from the code on `main`. A diagram is a typed model: parts with a
// shape, boundaries and labelled arrows, and the Stack. No local path goes in a
// response: a folder or file part names its path relative to its repository's root.
import { z } from 'zod'
import { RepositoryId } from './projects.ts'

/** The most characters of a part's name, type line, a boundary's label, an arrow's label and a title. */
export const maxArchitectureText = 200
/** The most characters of a Stack badge. */
export const maxStackBadge = 100
/** The most parts, boundaries and arrows of one diagram, and the Stack's groups and badges. */
export const maxArchitectureParts = 200
export const maxArchitectureBoundaries = 50
export const maxArchitectureArrows = 400
export const maxStackGroups = 20
export const maxStackBadges = 50

/** The system scope: the project's repositories together. A RepositoryId cannot start with "@", so no repository has it. */
export const systemScope = '@system'
/** The scope of a diagram: `@system`, or a repository's ID in `project.yaml`. */
export const ArchitectureScope = z.union([z.literal(systemScope), RepositoryId])
export type ArchitectureScope = z.infer<typeof ArchitectureScope>

/** The shapes of the design notes, from a device to a build step. */
export const PartShape = z.enum([
  'device',
  'service',
  'webApp',
  'terminalApp',
  'dataStore',
  'folder',
  'file',
  'package',
  'buildStep',
])
export type PartShape = z.infer<typeof PartShape>

const Text = z.string().min(1).max(maxArchitectureText)
const PartId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,199}$/)

/** True when `p` has a control character. */
const hasControl = (p: string) => {
  for (let i = 0; i < p.length; i += 1) {
    const code = p.charCodeAt(i)
    if (code < 32 || code === 127) return true
  }
  return false
}

/** A path relative to a repository's root: POSIX, with no "..", no leading "/" and no control character. */
export const RepositoryPath = z
  .string()
  .min(1)
  .max(maxArchitectureText)
  .refine((p) => !p.startsWith('/') && !p.includes('\\') && !hasControl(p), 'not a relative POSIX path')
  .refine((p) => p.split('/').every((part) => part !== '..' && part !== ''), 'a part of the path is empty or ".."')

/** One part of a diagram. A folder or file part's name is its path in its repository. */
export const ArchitecturePart = z
  .strictObject({
    id: PartId,
    name: Text,
    shape: PartShape,
    /** Our code (accent fill) or a third party's (neutral fill). */
    ours: z.boolean(),
    /** "Server · Hono on Node". */
    typeLine: Text,
    /** The boundary that holds the part, by its ID. */
    boundary: PartId.optional(),
  })
  .refine((p) => (p.shape === 'folder' || p.shape === 'file' ? RepositoryPath.safeParse(p.name).success : true), {
    message: 'a folder or file part is named by its path in its repository',
  })
export type ArchitecturePart = z.infer<typeof ArchitecturePart>

/** A dashed outline around parts: the Mac, or a repository. */
export const ArchitectureBoundary = z.strictObject({ id: PartId, label: Text, kind: z.enum(['machine', 'repository']) })
export type ArchitectureBoundary = z.infer<typeof ArchitectureBoundary>

/** An arrow from the part that starts the call to the part it calls, with its label. */
export const ArchitectureArrow = z.strictObject({ from: PartId, to: PartId, label: Text })
export type ArchitectureArrow = z.infer<typeof ArchitectureArrow>

/** One group of the Stack, such as Styling, with a badge for each package. */
export const StackGroup = z.strictObject({
  name: Text,
  badges: z.array(z.string().min(1).max(maxStackBadge)).min(1).max(maxStackBadges),
})
export type StackGroup = z.infer<typeof StackGroup>

/** A diagram: its C4 view, parts, boundaries and arrows, and the Stack (empty for System, which lists its parts). */
export const ArchitectureModel = z
  .strictObject({
    view: z.enum(['container', 'component', 'build']),
    parts: z.array(ArchitecturePart).min(1).max(maxArchitectureParts),
    boundaries: z.array(ArchitectureBoundary).max(maxArchitectureBoundaries),
    arrows: z.array(ArchitectureArrow).max(maxArchitectureArrows),
    stack: z.array(StackGroup).max(maxStackGroups),
  })
  .superRefine((model, ctx) => {
    const parts = new Set(model.parts.map((p) => p.id))
    const boundaries = new Set(model.boundaries.map((b) => b.id))
    if (parts.size !== model.parts.length) ctx.addIssue({ code: 'custom', message: 'two parts have one ID' })
    if (boundaries.size !== model.boundaries.length)
      ctx.addIssue({ code: 'custom', message: 'two boundaries have one ID' })
    for (const p of model.parts)
      if (p.boundary !== undefined && !boundaries.has(p.boundary))
        ctx.addIssue({ code: 'custom', message: 'a part names a boundary that the model does not have' })
    for (const a of model.arrows)
      if (!parts.has(a.from) || !parts.has(a.to))
        ctx.addIssue({ code: 'custom', message: 'an arrow names a part that the model does not have' })
  })
export type ArchitectureModel = z.infer<typeof ArchitectureModel>

/**
 * A scope's state: its title ("How the system works"), the commit and time of its diagram (null before the first
 * run), `stale` when `main` moved past that commit, and `running` while a run for it goes (in the server's memory,
 * so false after a restart). Until the server compares the snapshot's commit, `stale` is false.
 */
export const ArchitectureScopeState = z
  .strictObject({
    scope: ArchitectureScope,
    title: Text,
    commit: z
      .string()
      .regex(/^[0-9a-f]{40}$/)
      .nullable(),
    generatedAt: z.iso.datetime({ offset: true }).nullable(),
    stale: z.boolean(),
    running: z.boolean(),
  })
  .refine((s) => (s.commit === null) === (s.generatedAt === null), {
    message: 'a diagram has a commit and a time, or neither',
  })
export type ArchitectureScopeState = z.infer<typeof ArchitectureScopeState>

/** The response of `GET /api/projects/:slug/architecture`: `@system`, then each repository in `project.yaml` order. */
export const ArchitectureResponse = z.strictObject({
  scopes: z
    .array(ArchitectureScopeState)
    .min(1)
    .max(maxArchitectureBoundaries + 1),
})
export type ArchitectureResponse = z.infer<typeof ArchitectureResponse>

/** The response of `GET /api/projects/:slug/architecture/:scope`: its state and its kept diagram, or null. */
export const ArchitectureScopeResponse = z.strictObject({
  state: ArchitectureScopeState,
  model: ArchitectureModel.nullable(),
})
export type ArchitectureScopeResponse = z.infer<typeof ArchitectureScopeResponse>

/** The body of `POST /api/projects/:slug/architecture/:scope/regenerate`: empty. */
export const RegenerateRequest = z.strictObject({})
export type RegenerateRequest = z.infer<typeof RegenerateRequest>

/** The 202 answer of a regenerate: the scope's state, `running` true. */
export const RegenerateResponse = z.strictObject({ state: ArchitectureScopeState })
export type RegenerateResponse = z.infer<typeof RegenerateResponse>
