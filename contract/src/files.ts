// The files a chat message can link to (bridge-coord's rich-text task): the
// files that git tracks in a root, as paths relative to that root, never a
// local path. The brain's `_local/` is not in its index. A URL names a file
// by its `FileId`, and its text goes only in the text read's 200 body.
import { z } from 'zod'
import { FileId } from './ids.ts'

/** The most characters of one file's text in a response, as the Toolkit's (`maxToolkitFileText`). */
export const maxFileText = 262_144

/** The most files of one root's index; a root with more lists the first ones in git's order and sets `cut`. */
export const maxIndexFiles = 20_000

/** The folder a path is relative to: the brain. */
export const FileRoot = z.literal('brain')
export type FileRoot = z.infer<typeof FileRoot>

/** A path relative to its root, such as "toolkit/rules/writing.md": no "/" first and no "." or ".." part. */
export const RootFilePath = z
  .string()
  .min(1)
  .max(1024)
  .refine((p) => !p.startsWith('/') && !p.split('/').some((part) => part === '' || part === '.' || part === '..'), {
    message: 'a path relative to its root',
  })

/** The query of `GET /api/files` and `GET /api/files/:file/text`. */
export const FilesQuery = z.strictObject({ root: FileRoot })
export type FilesQuery = z.infer<typeof FilesQuery>

/** One file of an index. */
export const FileEntry = z.strictObject({ id: FileId, path: RootFilePath })
export type FileEntry = z.infer<typeof FileEntry>

/** The response of `GET /api/files`: the root's tracked files, and whether the list stops at `maxIndexFiles`. */
export const FilesResponse = z.strictObject({
  root: FileRoot,
  files: z.array(FileEntry).max(maxIndexFiles),
  cut: z.boolean(),
})
export type FilesResponse = z.infer<typeof FilesResponse>

/** The response of `GET /api/files/:file/text`: a text file's path and its text. */
export const FileTextResponse = z.strictObject({
  id: FileId,
  path: RootFilePath,
  text: z.string().max(maxFileText),
})
export type FileTextResponse = z.infer<typeof FileTextResponse>
