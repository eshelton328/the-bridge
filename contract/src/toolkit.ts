// The Toolkit page (R21): the skills, agents, rules, workflows and hooks of
// the brain's shared toolkit and of each project's toolkit, read-only. An
// item's path is relative to its toolkit root, never a local path, and a
// URL names an item or a file by its hashed ID. File text goes only in a
// file's 200 body.
import { z } from 'zod'
import { ToolkitFileId, ToolkitItemId } from './ids.ts'

/** The most characters of one file's text in a response; a longer file shows in the tree with no text. */
export const maxToolkitFileText = 262_144

/** The kind of an item. */
export const ToolkitKind = z.enum(['skill', 'agent', 'rule', 'workflow', 'hook'])
export type ToolkitKind = z.infer<typeof ToolkitKind>

/** Whose toolkit holds the item: the brain's shared one, or one project's. */
export const ToolkitScope = z.enum(['shared', 'project'])
export type ToolkitScope = z.infer<typeof ToolkitScope>

/** A path relative to a toolkit root or an item's folder, such as "skills/writer/": no "/" first and no "..". */
const RootPath = z
  .string()
  .min(1)
  .max(300)
  .refine((p) => !p.startsWith('/') && !p.split('/').includes('..'), 'a path relative to its toolkit root')

/** One item of a toolkit. */
export const ToolkitItem = z
  .strictObject({
    id: ToolkitItemId,
    kind: ToolkitKind,
    scope: ToolkitScope,
    /** The project's folder name for a project's item; null for a shared one. */
    project: z
      .string()
      .regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
      .nullable(),
    name: z.string().min(1).max(200),
    /** Its path in its toolkit, such as "skills/writer/" or "rules/writing.md". */
    path: RootPath,
    description: z.string().max(2000),
    /** How many files the item has. */
    files: z.number().int().positive(),
    /** How many items its files link to, and how many items link to it; links may cross scopes. */
    linksTo: z.number().int().nonnegative(),
    linkedFrom: z.number().int().nonnegative(),
  })
  .refine((i) => (i.scope === 'project') === (i.project !== null), {
    message: "a project's item names its project, and a shared item none",
    path: ['project'],
  })
export type ToolkitItem = z.infer<typeof ToolkitItem>

/** A link: a file of the item `from` names the item `to`. */
export const ToolkitLink = z.strictObject({ from: ToolkitItemId, to: ToolkitItemId })
export type ToolkitLink = z.infer<typeof ToolkitLink>

/** The response of `GET /api/toolkit`: every item and every link between them. */
export const ToolkitResponse = z.strictObject({ items: z.array(ToolkitItem), links: z.array(ToolkitLink) })
export type ToolkitResponse = z.infer<typeof ToolkitResponse>

/** A file or folder in an item's tree. A file the server serves no text for (too large, or a .toml) is not `readable`. */
export type ToolkitFileNode = {
  id: ToolkitFileId
  name: string
  type: 'file' | 'folder'
  /** A file's size in bytes. */
  bytes?: number | undefined
  readable?: boolean | undefined
  children?: ToolkitFileNode[] | undefined
}
export const ToolkitFileNode: z.ZodType<ToolkitFileNode> = z.strictObject({
  id: ToolkitFileId,
  name: z.string().min(1).max(255),
  type: z.enum(['file', 'folder']),
  bytes: z.number().int().nonnegative().optional(),
  readable: z.boolean().optional(),
  get children() {
    return z.array(ToolkitFileNode).optional()
  },
})

/** One file's text, with its path in the item's folder: an item's `main`, and the body of `GET /api/toolkit/:item/files/:file`. */
export const ToolkitFileText = z.strictObject({
  file: ToolkitFileId,
  path: RootPath,
  text: z.string().max(maxToolkitFileText),
})
export type ToolkitFileText = z.infer<typeof ToolkitFileText>

/** The response of `GET /api/toolkit/:item`: the item, its tree and its main file's text (null when not readable). */
export const ToolkitItemResponse = z.strictObject({
  item: ToolkitItem,
  tree: z.array(ToolkitFileNode),
  main: ToolkitFileText.nullable(),
})
export type ToolkitItemResponse = z.infer<typeof ToolkitItemResponse>
