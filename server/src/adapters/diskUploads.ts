// The upload store on disk (slice W1b). Each upload is a folder under
// `root`: `state.json` (the chat, the safe name, the size and the chunks
// that came), `data` (the bytes, each chunk at its offset) and, once
// complete, `file/<safe name>`. The folders are 0700 and the files 0600,
// so only the owner's account reads them. The store never opens a file to
// read or run it. A fault gives only its errno code, as its message can
// hold a path with the file name.
import { randomBytes } from 'node:crypto'
import { chmod, mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
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
  const dataPath = (upload: UploadId) => join(folder(upload), 'data')
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
  const writeState = (upload: UploadId, state: State) =>
    writeFile(statePath(upload), JSON.stringify(state), { mode: 0o600 })

  return {
    chunkSize,
    start: (chat, name, size) =>
      guarded(async () => {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        const upload = UploadIdSchema.parse(randomBytes(16).toString('base64url'))
        await mkdir(folder(upload), { mode: 0o700 })
        await (await open(dataPath(upload), 'wx', 0o600)).close()
        await writeState(upload, { chat, name: safeFileName(name), size, received: [], complete: false })
        return upload
      }),
    writeChunk: (upload, n, bytes) =>
      guarded(async () => {
        const state = await readState(upload)
        if (state === null) return 'notFound' as const
        const length = chunkLength(state.size, chunkSize, n)
        if (state.complete || length === null) return 'conflict' as const
        const file = await open(dataPath(upload), 'r+')
        let read = 0
        try {
          for await (const piece of bytes) {
            if (read + piece.length > length) return 'conflict' as const
            await file.write(piece, 0, piece.length, n * chunkSize + read)
            read += piece.length
          }
        } finally {
          await file.close()
        }
        if (read !== length) return 'conflict' as const
        return inTurn(upload, async () => {
          const now = await readState(upload)
          if (now === null) return 'notFound' as const
          if (now.complete) return 'conflict' as const
          if (!now.received.includes(n)) await writeState(upload, { ...now, received: [...now.received, n] })
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
          await mkdir(join(folder(upload), 'file'), { mode: 0o700 })
          await rename(dataPath(upload), join(folder(upload), 'file', state.name))
          await writeState(upload, { ...state, complete: true })
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
