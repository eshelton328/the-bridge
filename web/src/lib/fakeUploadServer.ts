// A fake of the server's upload routes (slice W1b), for tests, in memory and
// checked against the contract as the server's routes are (backend W1b-2):
//   POST /api/chats/:chat/uploads   StartUploadRequest → 201 StartUploadResponse
//   PUT  /api/uploads/:upload/chunks/:n   raw bytes → 204
//   POST /api/uploads/:upload/complete   {} → 200 CompleteUploadResponse
//   DELETE /api/uploads/:upload → 204
// A chunk's number and length must match the upload (409 upload-conflict),
// and complete needs every chunk. Fetch reaches `handle`; a chunk PUT goes
// through `FakeXhr`, which a test puts in place of XMLHttpRequest
// (`vi.stubGlobal`) and which sends progress as the bytes go. It records
// each call with its method and path only, and each start's size and type,
// so a test can check what the page sent; it keeps no file name in a call
// record. Switches answer a step with an error, hold a chunk, or end the
// next chunks with no answer.
import {
  CompleteUploadRequest,
  CompleteUploadResponse,
  ErrorBody,
  maxUploadBytes,
  StartUploadRequest,
  StartUploadResponse,
  UploadId,
} from '@bridge/contract'

type Upload = {
  readonly chat: string
  readonly size: number
  readonly chunks: Map<number, number>
  complete: boolean
}

/** An answer the test picks for a step: an error, `network` for no answer, or one that waits until the test ends it. */
export type UploadAnswer = () => Response | 'network' | Promise<Response | 'network'>

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** An error answer, its body checked against the contract. */
export function uploadError(error: ErrorBody['error'], status: number): Response {
  return json(ErrorBody.parse({ error }), status)
}

const conflict = () => uploadError({ kind: 'upload-conflict', message: 'Conflict', requestId: 'r-409' }, 409)
const missing = (path: string) =>
  uploadError({ kind: 'not-found', path, message: 'Not found', requestId: 'r-404' }, 404)
const invalid = () =>
  uploadError({ kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' }, 400)

const readBody = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

export type FakeUploadOptions = {
  /** The chunk size the start gives; the server's 8 MiB when not set. A test gives a few bytes. */
  readonly chunkSize?: number
}

export function fakeUploadServer({ chunkSize = 8_388_608 }: FakeUploadOptions = {}) {
  const uploads = new Map<UploadId, Upload>()
  let next = 0
  /** Each call the page made, taken or not: its method and path as the page wrote it. */
  const calls: { method: string; path: string }[] = []
  /** Each start the server took: the chat, the size and the type; never the name. */
  const starts: { chat: string; size: number; type: string }[] = []
  /** Each chunk the server took. */
  const chunks: { upload: string; n: number; bytes: number }[] = []
  /** Each chunk request the page aborted. */
  const aborts: { upload: string; n: number }[] = []
  /** The chats whose start answers 409 chat-not-ready, with the state. */
  const notReady = new Map<string, 'shell' | 'noAttachments'>()
  let startAnswer: UploadAnswer | undefined
  let completeAnswer: UploadAnswer | undefined
  /** The answers of the next chunk requests, in order; each is used once. */
  const chunkAnswers: UploadAnswer[] = []
  /** Held chunks: they wait until the test ends them, or the page aborts them. */
  let holdChunks = false
  const held: (() => void)[] = []

  const start = (chat: string, init: RequestInit | undefined): Response => {
    const body = StartUploadRequest.safeParse(readBody(init))
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !body.success) return invalid()
    if (body.data.size > maxUploadBytes)
      return uploadError({ kind: 'too-large', message: 'Too large', requestId: 'r-413' }, 413)
    const state = notReady.get(chat)
    if (state !== undefined)
      return uploadError({ kind: 'chat-not-ready', state, message: 'Not ready', requestId: 'r-409' }, 409)
    const upload = UploadId.parse(`up${String(++next).padStart(20, '0')}`)
    uploads.set(upload, { chat, size: body.data.size, chunks: new Map(), complete: false })
    starts.push({ chat, size: body.data.size, type: body.data.type })
    return json(StartUploadResponse.parse({ upload, chunkSize }), 201)
  }

  /** Takes chunk `n` of `id`: its number and length checked against the upload. */
  const chunk = (path: string, id: string, n: number, bytes: number): Response => {
    const upload = UploadId.safeParse(id)
    const found = upload.success ? uploads.get(upload.data) : undefined
    if (!upload.success || found === undefined) return missing(path)
    const count = Math.ceil(found.size / chunkSize)
    const expected = n === count - 1 ? found.size - n * chunkSize : chunkSize
    if (found.complete || n >= count || bytes !== expected) return conflict()
    found.chunks.set(n, bytes)
    chunks.push({ upload: id, n, bytes })
    return new Response(null, { status: 204 })
  }

  const complete = (path: string, id: string, init: RequestInit | undefined): Response => {
    if (!CompleteUploadRequest.safeParse(readBody(init)).success) return invalid()
    const upload = UploadId.safeParse(id)
    const found = upload.success ? uploads.get(upload.data) : undefined
    if (!upload.success || found === undefined) return missing(path)
    const count = Math.ceil(found.size / chunkSize)
    if (found.chunks.size !== count) return conflict()
    found.complete = true
    return json(CompleteUploadResponse.parse({ attachment: upload.data }), 200)
  }

  const answerOf = async (answer: UploadAnswer | undefined, take: () => Response): Promise<Response | 'network'> =>
    answer === undefined ? take() : answer()

  /** A fetch of an upload route: the answer, or undefined when `path` is not one. */
  const handle = (path: string, init?: RequestInit): Promise<Response> | undefined => {
    const method = init?.method ?? 'GET'
    const started = /^\/api\/chats\/([^/]+)\/uploads$/.exec(path)
    const completed = /^\/api\/uploads\/([^/]+)\/complete$/.exec(path)
    const removed = /^\/api\/uploads\/([^/]+)$/.exec(path)
    const respond = (answer: Promise<Response | 'network'>) =>
      answer.then((res) => (res === 'network' ? Promise.reject(new TypeError('Failed to fetch')) : res))
    if (started !== null && method === 'POST') {
      calls.push({ method, path })
      return respond(answerOf(startAnswer, () => start(decodeURIComponent(started[1] ?? ''), init)))
    }
    if (completed !== null && method === 'POST') {
      calls.push({ method, path })
      return respond(answerOf(completeAnswer, () => complete(path, decodeURIComponent(completed[1] ?? ''), init)))
    }
    if (removed !== null && method === 'DELETE') {
      calls.push({ method, path })
      const upload = UploadId.safeParse(decodeURIComponent(removed[1] ?? ''))
      if (!upload.success || !uploads.delete(upload.data)) return Promise.resolve(missing(path))
      return Promise.resolve(new Response(null, { status: 204 }))
    }
    return undefined
  }

  /** XMLHttpRequest for the chunk PUTs: it takes them as the server does, and sends progress in two steps. */
  class FakeXhr {
    readonly upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null }
    ontimeout: (() => void) | null = null
    onloadend: (() => void) | null = null
    timeout = 0
    status = 0
    responseText = ''
    private method = ''
    private path = ''
    private type = ''
    private done = false

    open(method: string, url: string) {
      this.method = method
      this.path = new URL(url, window.location.origin).pathname
    }

    setRequestHeader(name: string, value: string) {
      if (name.toLowerCase() === 'content-type') this.type = value
    }

    abort() {
      if (this.done) return
      this.done = true
      const route = /^\/api\/uploads\/([^/]+)\/chunks\/(\d+)$/.exec(this.path)
      aborts.push({ upload: decodeURIComponent(route?.[1] ?? ''), n: Number(route?.[2] ?? -1) })
      this.onloadend?.()
    }

    /** Ended, by an abort or an answer: read through a call, as an abort can come during any await. */
    private ended() {
      return this.done
    }

    send(body: Blob) {
      calls.push({ method: this.method, path: this.path })
      void this.run(body)
    }

    private async run(body: Blob) {
      const route = /^\/api\/uploads\/([^/]+)\/chunks\/(\d+)$/.exec(this.path)
      const progress = (loaded: number) => {
        this.upload.onprogress?.(new ProgressEvent('progress', { loaded, total: body.size, lengthComputable: true }))
      }
      await Promise.resolve()
      progress(Math.floor(body.size / 2))
      if (holdChunks)
        await new Promise<void>((resolve) => {
          held.push(resolve)
        })
      await new Promise((resolve) => setTimeout(resolve, 10))
      if (this.ended()) return
      const answer = chunkAnswers.shift()
      const res: Response | 'network' =
        this.method !== 'PUT' || route === null
          ? missing(this.path)
          : this.type !== 'application/octet-stream'
            ? invalid()
            : answer !== undefined
              ? await answer()
              : chunk(this.path, decodeURIComponent(route[1] ?? ''), Number(route[2]), body.size)
      if (this.ended()) return
      this.done = true
      if (res === 'network') {
        this.onloadend?.()
        return
      }
      progress(body.size)
      this.status = res.status
      this.responseText = await res.text()
      this.onloadend?.()
    }
  }

  return {
    calls,
    starts,
    chunks,
    aborts,
    XMLHttpRequest: FakeXhr,
    handle,
    /** Answers each start with `answer` until it is set to undefined. */
    answerStarts: (answer: UploadAnswer | undefined) => {
      startAnswer = answer
    },
    /** Answers each complete with `answer` until it is set to undefined. */
    answerCompletes: (answer: UploadAnswer | undefined) => {
      completeAnswer = answer
    },
    /** Answers the next chunk requests with `answers`, one each, in order; the ones after go through. */
    answerChunks: (...answers: UploadAnswer[]) => {
      chunkAnswers.push(...answers)
    },
    /** Holds each chunk until `releaseChunks`, or until the page aborts it. */
    holdChunks: () => {
      holdChunks = true
    },
    releaseChunks: () => {
      holdChunks = false
      for (const resolve of held.splice(0)) resolve()
    },
    /** Makes `chat` refuse uploads with 409 chat-not-ready `state`, as a shell or a Codex chat does. */
    refuseUploads: (chat: string, state: 'shell' | 'noAttachments') => {
      notReady.set(chat, state)
    },
    /** Drops every upload, as a server that restarted with an empty store: the next chunk or complete is 404. */
    forgetAll: () => {
      uploads.clear()
    },
    /** The uploads the server holds now. */
    held: () => [...uploads.keys()],
    /** The complete uploads the server holds now: the files a prompt may name. */
    complete: () => [...uploads].filter(([, u]) => u.complete).map(([id]) => id),
    /**
     * Whether a prompt of `chat` may name `attachments`: each a complete upload of that chat. A taken prompt consumes
     * them, as the server moves the files to the chat.
     */
    takeAttachments: (chat: string, attachments: readonly string[]): boolean => {
      const all = attachments.map((id) => {
        const upload = UploadId.safeParse(id)
        return upload.success ? uploads.get(upload.data) : undefined
      })
      if (!all.every((u) => u?.complete === true && u.chat === chat)) return false
      for (const id of attachments) {
        const upload = UploadId.safeParse(id)
        if (upload.success) uploads.delete(upload.data)
      }
      return true
    },
  }
}
