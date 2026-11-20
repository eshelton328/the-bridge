// The upload store on disk (slice W1b). Each upload is a folder under
// `root`: `state.json` (the chat, the safe name, the size and the chunks
// that came), `chunks/<n>` (one file for each chunk) and, once complete,
// `file/<safe name>`. A chunk goes to a temporary file first, and takes
// its place only when its length is right, so a short retry never changes
// a chunk that came. The state file is replaced in one rename, so a read
// never sees half of it. Complete joins the chunks in order, in turn with
// the chunks' renames. The folders are 0700 and the files 0600, so only
// the owner's account reads them. The store never runs a file and reads
// its bytes only to join the chunks. A fault gives only its errno code,
// as its message can hold a path with the file name.
import { randomBytes } from 'node:crypto'
import { chmod, type FileHandle, mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ChatId, type UploadId, UploadId as UploadIdSchema } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import {
  chunkCount,
  chunkLength,
  defaultChunkBytes,
  safeFileName,
  type UploadStore,
  type UploadStoreError,
} from '../services/uploadStore.ts'

const State = z.object({
  chat: ChatId,
  name: z.string(),
  size: z.number().int().min(1),
  received: z.array(z.number().int()),
  complete: z.boolean(),
})
type State = z.infer<typeof State>

export type DiskUploadsOptions = {
  /** The folder of all uploads, such as ~/.local/share/the-bridge/uploads; made 0700 when missing. */
  readonly root: string
  readonly chunkSize?: number
}

const errnoCode = (error: unknown): string | undefined => {
  const code: unknown = error instanceof Error ? Object.getOwnPropertyDescriptor(error, 'code')?.value : undefined
  return typeof code === 'string' ? code : undefined
}

/** A fault as the port gives it: `full` when the disk has no space. */
const faultOf = (error: unknown): UploadStoreError => ({
  reason: errnoCode(error) === 'ENOSPC' ? 'full' : 'failed',
  code: errnoCode(error),
})

/** Writes all of `bytes` at the file's end; a write can take fewer bytes than it gets. */
async function writeAll(file: FileHandle, bytes: Uint8Array): Promise<void> {
  for (let done = 0; done < bytes.length; ) {
    const { bytesWritten } = await file.write(bytes, done, bytes.length - done)
    done += bytesWritten
  }
}

/** A name for a temporary file that no other request uses. */
const tempName = (base: string) => `${base}.${randomBytes(6).toString('hex')}.part`

/** Runs `work`, and gives a fault for anything it throws. */
async function guarded<T>(work: () => Promise<T>): Promise<Result<T, UploadStoreError>> {
  try {
    return ok(await work())
  } catch (error) {
    return err(faultOf(error))
  }
}

export function createDiskUploads({ root, chunkSize = defaultChunkBytes }: DiskUploadsOptions): UploadStore & {
  /** The path of a complete upload's file; null for one that is not complete. */
  readonly pathOf: (upload: UploadId) => Promise<string | null>
} {
  const folder = (upload: UploadId) => join(root, upload)
  const statePath = (upload: UploadId) => join(folder(upload), 'state.json')
  const chunksPath = (upload: UploadId) => join(folder(upload), 'chunks')
  const chunkPath = (upload: UploadId, n: number) => join(chunksPath(upload), String(n))
  /** Each upload's state change waits for the one before it, so two chunks never lose each other's mark. */
  const queues = new Map<UploadId, Promise<unknown>>()
  const inTurn = <T>(upload: UploadId, work: () => Promise<T>): Promise<T> => {
    const run = (queues.get(upload) ?? Promise.resolve()).then(work, work)
    queues.set(
      upload,
      run.then(
        () => undefined,
        () => undefined,
      ),
    )
    return run
  }
  /** The upload's state; null when it has none. */
  const readState = async (upload: UploadId): Promise<State | null> => {
    const text = await readFile(statePath(upload), 'utf8').catch((error: unknown) => {
      if (errnoCode(error) === 'ENOENT') return null
      throw error
    })
    if (text === null) return null
    const state = State.safeParse(JSON.parse(text))
    return state.success ? state.data : null
  }
  /** Replaces the state file in one rename, so a read sees the old state or the new one, never part of one. */
  const writeState = async (upload: UploadId, state: State) => {
    const temp = tempName(statePath(upload))
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 })
    await rename(temp, statePath(upload))
  }
  /** Writes chunk `n` to a temporary file: its path, or null when its length is not `length` (the file is gone then). */
  const receive = async (
    upload: UploadId,
    n: number,
    length: number,
    bytes: AsyncIterable<Uint8Array>,
  ): Promise<string | null> => {
    const temp = tempName(chunkPath(upload, n))
    const file = await open(temp, 'wx', 0o600)
    let read = 0
    let fits = true
    try {
      for await (const piece of bytes) {
        if (read + piece.length > length) {
          fits = false
          break
        }
        await writeAll(file, piece)
        read += piece.length
      }
    } catch (error) {
      await file.close()
      await rm(temp, { force: true })
      throw error
    }
    await file.close()
    if (fits && read === length) return temp
    await rm(temp, { force: true })
    return null
  }

  return {
    chunkSize,
    start: (chat, name, size) =>
      guarded(async () => {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        const upload = UploadIdSchema.parse(randomBytes(16).toString('base64url'))
        await mkdir(folder(upload), { mode: 0o700 })
        await mkdir(chunksPath(upload), { mode: 0o700 })
        await writeState(upload, { chat, name: safeFileName(name), size, received: [], complete: false })
        return upload
      }),
    writeChunk: (upload, n, bytes) =>
      guarded(async () => {
        const state = await readState(upload)
        if (state === null) return 'notFound' as const
        const length = chunkLength(state.size, chunkSize, n)
        if (state.complete || length === null) return 'conflict' as const
        const temp = await receive(upload, n, length, bytes)
        if (temp === null) return 'conflict' as const
        return inTurn(upload, async () => {
          const current = await readState(upload)
          if (current === null || current.complete) {
            await rm(temp, { force: true })
            return current === null ? ('notFound' as const) : ('conflict' as const)
          }
          await rename(temp, chunkPath(upload, n))
          if (!current.received.includes(n))
            await writeState(upload, { ...current, received: [...current.received, n] })
          return 'written' as const
        })
      }),
    complete: (upload) =>
      guarded(() =>
        inTurn(upload, async () => {
          const state = await readState(upload)
          if (state === null) return 'notFound' as const
          if (state.complete) return 'complete' as const
          if (state.received.length !== chunkCount(state.size, chunkSize)) return 'conflict' as const
          const files = join(folder(upload), 'file')
          // Recursive, so a complete that failed after it made the folder can run again.
          await mkdir(files, { recursive: true, mode: 0o700 })
          const temp = tempName(join(files, state.name))
          const out = await open(temp, 'w', 0o600)
          try {
            for (let n = 0; n < chunkCount(state.size, chunkSize); n++)
              await writeAll(out, await readFile(chunkPath(upload, n)))
          } catch (error) {
            await out.close()
            await rm(temp, { force: true })
            throw error
          }
          await out.close()
          await rename(temp, join(files, state.name))
          await writeState(upload, { ...state, complete: true })
          await rm(chunksPath(upload), { recursive: true, force: true })
          return 'complete' as const
        }),
      ),
    remove: (upload) =>
      guarded(() =>
        inTurn(upload, async () => {
          if ((await readState(upload)) === null) return 'notFound' as const
          await rm(folder(upload), { recursive: true, force: true })
          return 'removed' as const
        }),
      ),
    pathOf: async (upload) => {
      const state = await readState(upload)
      return state?.complete === true ? join(folder(upload), 'file', state.name) : null
    },
  }
}
