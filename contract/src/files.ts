// The files a chat message can link to: git's tracked files in a root, as
// root-relative paths. A URL names a file by its `FileId`; its text goes
// only in the text read's 200 body.
import { z } from 'zod'
import { ChatId, FileId } from './ids.ts'

/** The most UTF-8 bytes of one file that a text read takes; the Toolkit's `maxToolkitFileText` is the same number. */
export const maxFileText = 262_144

/** The most files of one root's index; a root with more lists the first ones in git's order and sets `cut`. */
export const maxIndexFiles = 20_000

/** The folder a path is relative to: the brain, or the git repository of a live chat's folder, named by its chat ID. */
export const FileRoot = z.union([z.literal('brain'), ChatId])
export type FileRoot = z.infer<typeof FileRoot>

/** A path relative to its root, such as "toolkit/rules/writing.md": no "/" first and no "." or ".." part. */
export const RootFilePath = z
  .string()
  .min(1)
  .max(1024)
  .refine((p) => !p.startsWith('/') && !p.split('/').some((part) => part === '' || part === '.' || part === '..'), {
    message: 'a path relative to its root',
  })

/** The most bytes of an image that `GET /api/files/raw` sends. */
export const maxImageBytes = 20 * 1024 ** 2

/** A local absolute path: request input only, never in a response, error, header or log (contract/AGENTS.md). */
export const AbsoluteFilePath = z
  .string()
  .min(2)
  .max(4096)
  .refine((p) => p.startsWith('/') && !p.includes('\0'), { message: 'an absolute path' })

/** The query of `GET /api/files/raw`: a root and a path in it, or an absolute path. */
export const FileRawQuery = z.union([
  z.strictObject({ root: FileRoot, path: RootFilePath }),
  z.strictObject({ path: AbsoluteFilePath }),
])
export type FileRawQuery = z.infer<typeof FileRawQuery>

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
