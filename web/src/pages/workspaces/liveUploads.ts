// The files the owner attaches to a live Claude chat's prompt (slice W1b).
// Each file starts uploading as soon as it is added: `POST
// /api/chats/:chat/uploads` gives the upload's ID and chunk size, the chunks
// go up in order with `PUT /api/uploads/:upload/chunks/:n` through
// XMLHttpRequest (fetch has no upload progress), one at a time for each
// file and at most `maxActive` files at once, and `POST .../complete` makes
// it an attachment that a send names. The chips belong to the chat whose
// composer added them: a chat switch neither moves nor clears them.
//
// A chunk waits `chunkTimeoutMs` for its answer, and a chunk that fails on
// the network, a 5xx (not 507), a 408 or a 429 goes again twice on its own;
// then the chip is failed, with Retry. Retry goes on from the failed chunk
// with the same upload while the server still has it (a 404 starts the file
// again), and starts the file again after a 409 upload-conflict. A file over
// `maxUploadBytes` or an empty one is a failed chip with no request and no
// Retry (as after a 413 or a 415), and the
// files past `maxAttachments` are not added. Remove aborts the chunk in
// flight and deletes the upload (a 404 is fine).
//
// Each failed chip says why in the composer's line, "Not attached — <why>".
// report() gets a ChatUploadMissError only for a 5xx and an answer the page
// does not expect, with the step, the kind and the status: never the file's
// name, type or bytes, the chat ID or the message text. A 413, 415 and 409
// are not reported.
import {
  CompleteUploadResponse,
  ErrorBody,
  maxAttachments,
  maxUploadBytes,
  StartUploadResponse,
  type UploadId,
} from '@bridge/contract'
import type { ComposerAttachment } from '@eshelton328/component-library-1701'
import { report } from '../../errors/reporter.ts'
import { registerReset } from '../../state/resetStores.ts'
import { api } from '../../lib/api.ts'
import { liveReadTimeoutMs, readJson } from './liveWorkspaces.ts'

/** The most files that upload at once, over every chat. */
export const maxActive = 2
/** How long a chunk or a complete waits for its answer, in ms: a chunk of 8 MiB over a slow tailnet takes a while. */
export const chunkTimeoutMs = 60_000
/** How often a failed chunk goes again on its own before its chip shows Retry. */
const autoRetries = 2
/** The wait before an automatic retry, times the attempt, in ms. */
const retryDelayMs = 250

type Step = 'start' | 'chunk' | 'complete'

/** An upload that missed, for report(): the step, the kind and the status only. */
class ChatUploadMissError extends Error {
  readonly miss: string

  constructor(step: Step, kind: string, status: number | undefined) {
    super(`A chat upload missed: ${step} ${kind}${status === undefined ? '' : ` ${String(status)}`}`)
    this.name = 'ChatUploadMissError'
    this.miss = kind
  }
}

/** Why a step failed: what the chip's line says, whether it goes again on its own, and how Retry goes on. */
type Miss = {
  readonly why: string
  /** The same request may work in a moment: a chunk goes again on its own. */
  readonly transient: boolean
  /** Retry starts the file again, with a new upload. */
  readonly restart: boolean
  /** The server will never take the file (413, 415): its chip has no Retry. */
  readonly final?: boolean
  /** The upload is gone from the server (404): the file starts again once on its own. */
  readonly gone?: boolean
  /** report() gets it, with this kind and status, once the chip fails. */
  readonly report?: { readonly kind: string; readonly status: number | undefined }
}

/** The miss of an answer that is not the step's success. */
function missOf(step: Step, status: number, text: string): Miss {
  const parsed = ErrorBody.safeParse(readJson(text))
  if (!parsed.success) {
    // A 5xx with no error body is the Vite proxy or `tailscale serve` answering for a server that is down.
    if (status >= 500)
      return { why: 'unreachable', transient: true, restart: false, report: { kind: 'unreachable', status } }
    if (status === 408) return { why: 'timeout', transient: true, restart: false }
    const kind = status >= 200 && status < 300 ? 'bad-reply' : 'status'
    return { why: kind, transient: false, restart: true, report: { kind, status } }
  }
  const error = parsed.data.error
  switch (error.kind) {
    case 'too-large':
      return { why: 'too large', transient: false, restart: true, final: true }
    case 'unsupported-media':
      return { why: 'this file type cannot be read', transient: false, restart: true, final: true }
    case 'storage-full':
      // A definite answer: the disk stays full for the next try too.
      return { why: "the Mac's disk is full", transient: false, restart: false, report: { kind: error.kind, status } }
    case 'upload-conflict':
      return { why: 'upload-conflict', transient: false, restart: true }
    case 'chat-not-ready':
      return { why: 'this chat takes no files', transient: false, restart: true }
    case 'not-found':
      return step === 'start'
        ? { why: 'chat gone', transient: false, restart: true }
        : { why: 'upload gone', transient: false, restart: true, gone: true }
    case 'too-many-requests':
      return { why: error.kind, transient: true, restart: false }
    case 'herdr-unavailable':
    case 'herdr-bad-reply':
    case 'internal':
      return { why: error.kind, transient: true, restart: false, report: { kind: error.kind, status } }
    case 'forbidden':
      return { why: error.kind, transient: false, restart: false }
    case 'invalid-input':
      // The page sends only what the contract takes, so the server's refusal is a bug.
      return { why: error.kind, transient: false, restart: true, report: { kind: error.kind, status } }
  }
}

const noAnswer = (timedOut: boolean): Miss => ({
  why: timedOut ? 'timeout' : 'unreachable',
  transient: true,
  restart: false,
})

/** One file of a chat's composer. */
type Upload = {
  /** The chip's key, made here: never the file's name. */
  readonly key: string
  /** The composer's chat (its pane ID) and the chat's server ID. */
  readonly chat: string
  readonly liveChat: string
  readonly file: File
  status: 'queued' | 'running' | 'ready' | 'failed'
  /** The bytes of the chunks the server took, and of the chunk on its way. */
  sent: number
  sending: number
  upload: UploadId | undefined
  chunkSize: number
  /** The next chunk to send. */
  next: number
  attachment: UploadId | undefined
  /** Why it failed, for the composer's line. */
  why: string | undefined
  /** Retry starts the file again. */
  restart: boolean
  /** The server will never take the file: over 1 GiB, empty, or a type it cannot read. Its chip has no Retry. */
  final: boolean
  /** Ends the request in flight. */
  abort: (() => void) | undefined
  removed: boolean
}

/** What a chat's composer gets: its chips and what Send may do. */
export type ChatUploads = {
  readonly chips: readonly ComposerAttachment[]
  /** A file is on its way or failed: Send is off. */
  readonly blocked: boolean
  /** The attachments a send names, in the chips' order; empty while `blocked`. */
  readonly ready: readonly UploadId[]
  /** The composer's line: the files past the limit, else why the last failed chip failed. */
  readonly line: string | undefined
}

const noUploads: ChatUploads = { chips: [], blocked: false, ready: [], line: undefined }

let uploads: Upload[] = []
/** The line of files past the limit, by chat, until the chat's next add or remove. */
const limitLines = new Map<string, string>()
// The attachments a pending send names. A chip removed meanwhile keeps its upload (by attachment) until the send
// ends: the server may have given the chat its path already, so only a send that missed deletes it.
const inSend = new Set<UploadId>()
const removedInSend = new Map<UploadId, UploadId>()
let seq = 0
let views = new Map<string, ChatUploads>()
const listeners = new Set<() => void>()

function viewOf(chat: string): ChatUploads {
  const mine = uploads.filter((u) => u.chat === chat)
  const failed = mine.filter((u) => u.status === 'failed')
  const limit = limitLines.get(chat)
  if (mine.length === 0 && limit === undefined) return noUploads
  const blocked = mine.some((u) => u.status !== 'ready')
  return {
    chips: mine.map((u) => ({
      id: u.key,
      name: u.file.name,
      status: u.status === 'ready' ? 'ready' : u.status === 'failed' ? 'failed' : 'uploading',
      progress: u.file.size === 0 ? 0 : Math.min(1, (u.sent + u.sending) / u.file.size),
      ...(u.final ? { retry: false } : {}),
    })),
    blocked,
    ready: blocked ? [] : mine.flatMap((u) => (u.attachment === undefined ? [] : [u.attachment])),
    line: limit ?? (failed.at(-1)?.why === undefined ? undefined : `Not attached — ${failed.at(-1)?.why ?? ''}`),
  }
}

function changed() {
  const chats = new Set([...uploads.map((u) => u.chat), ...limitLines.keys()])
  views = new Map([...chats].map((chat) => [chat, viewOf(chat)]))
  for (const listener of listeners) listener()
}

/** Calls `listener` on each change of any chat's uploads; the result stops it. */
export function subscribeUploads(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Each chat's uploads now, by its pane ID; one object until the next change. */
export function uploadViews(): ReadonlyMap<string, ChatUploads> {
  return views
}

/** A plain answer: its status and body text. */
type Answer = { readonly status: number; readonly text: string }

/** The answer of a fetch made with `call`, or the miss of one that got none in `timeoutMs`. */
async function fetched(
  u: Upload,
  timeoutMs: number,
  call: (signal: AbortSignal) => Promise<Response>,
): Promise<Answer | Miss> {
  const control = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    control.abort()
  }, timeoutMs)
  u.abort = () => {
    control.abort()
  }
  try {
    const res = await call(control.signal)
    return { status: res.status, text: await res.text() }
  } catch {
    return noAnswer(timedOut)
  } finally {
    clearTimeout(timer)
    u.abort = undefined
  }
}

/** Sends chunk `n` with XMLHttpRequest, so its progress shows on the chip. */
function putChunk(u: Upload, upload: UploadId, n: number, bytes: Blob): Promise<Answer | Miss> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', `/api/uploads/${encodeURIComponent(upload)}/chunks/${String(n)}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.timeout = chunkTimeoutMs
    xhr.upload.onprogress = (event) => {
      u.sending = Math.min(event.loaded, bytes.size)
      changed()
    }
    let timedOut = false
    xhr.ontimeout = () => {
      timedOut = true
    }
    // The end of every request, answered or not: status 0 is no answer (the network, the timeout or an abort).
    xhr.onloadend = () => {
      u.abort = undefined
      u.sending = 0
      resolve(xhr.status === 0 ? noAnswer(timedOut) : { status: xhr.status, text: xhr.responseText })
    }
    u.abort = () => {
      xhr.abort()
    }
    xhr.send(bytes)
  })
}

const isMiss = (answer: Answer | Miss): answer is Miss => 'why' in answer

/** The chip was removed: read through a call, as a remove can come during any await. */
const gone = (u: Upload) => u.removed

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/** Fails the chip with `miss`, and reports it when the miss is reported. */
function fail(u: Upload, step: Step, miss: Miss) {
  u.status = 'failed'
  u.why = miss.why
  u.restart = miss.restart
  u.final = miss.final === true
  if (miss.report !== undefined) report(new ChatUploadMissError(step, miss.report.kind, miss.report.status), 'live')
}

/** Starts the upload on the server; false when it failed or the chip was removed meanwhile. */
async function start(u: Upload): Promise<boolean> {
  // A file that starts again leaves its earlier upload, which the server may still hold.
  if (u.upload !== undefined) forget(u.upload)
  u.upload = undefined
  const name = u.file.name.length > 255 ? u.file.name.slice(-255) : u.file.name || 'file'
  const answer = await fetched(u, liveReadTimeoutMs, (signal) =>
    api.api.chats[':chat'].uploads.$post(
      {
        param: { chat: encodeURIComponent(u.liveChat) },
        json: { name, size: u.file.size, type: u.file.type.slice(0, 255) },
      },
      { init: { signal } },
    ),
  )
  if (gone(u)) {
    if (!isMiss(answer) && answer.status === 201) {
      const started = StartUploadResponse.safeParse(readJson(answer.text))
      if (started.success) forget(started.data.upload)
    }
    return false
  }
  if (isMiss(answer)) {
    fail(u, 'start', answer)
    return false
  }
  const started = StartUploadResponse.safeParse(readJson(answer.text))
  if (answer.status !== 201 || !started.success) {
    fail(u, 'start', answer.status === 201 ? missOf('start', 200, '') : missOf('start', answer.status, answer.text))
    return false
  }
  u.upload = started.data.upload
  u.chunkSize = started.data.chunkSize
  u.next = 0
  u.sent = 0
  u.restart = false
  return true
}

/** Sends the chunks from `u.next` on; the miss that stopped them, or undefined when all went. */
async function chunks(u: Upload, upload: UploadId): Promise<Miss | undefined> {
  const count = Math.ceil(u.file.size / u.chunkSize)
  while (u.next < count) {
    const n = u.next
    const bytes = u.file.slice(n * u.chunkSize, Math.min(u.file.size, (n + 1) * u.chunkSize))
    let miss: Miss | undefined
    for (let attempt = 0; ; attempt++) {
      const answer = await putChunk(u, upload, n, bytes)
      if (gone(u)) return undefined
      miss = isMiss(answer) ? answer : answer.status === 204 ? undefined : missOf('chunk', answer.status, answer.text)
      if (miss === undefined || !miss.transient || attempt >= autoRetries) break
      await wait(retryDelayMs * (attempt + 1))
      if (gone(u)) return undefined
    }
    if (miss !== undefined) return miss
    u.next = n + 1
    u.sent += bytes.size
    changed()
  }
  return undefined
}

/** Makes the sent chunks a file; the miss, or undefined when it is an attachment now. */
async function complete(u: Upload, upload: UploadId): Promise<Miss | undefined> {
  u.attachment = undefined
  const answer = await fetched(u, chunkTimeoutMs, (signal) =>
    api.api.uploads[':upload'].complete.$post(
      { param: { upload: encodeURIComponent(upload) }, json: {} },
      { init: { signal } },
    ),
  )
  if (gone(u)) return undefined
  if (isMiss(answer)) return answer
  const done = CompleteUploadResponse.safeParse(readJson(answer.text))
  if (answer.status !== 200) return missOf('complete', answer.status, answer.text)
  if (!done.success) return missOf('complete', 200, '')
  u.attachment = done.data.attachment
  return undefined
}

/** Takes `u` from where it is to an attachment, or to a failed chip. */
async function run(u: Upload) {
  u.status = 'running'
  u.why = undefined
  changed()
  // A 404 on a chunk or the complete (the upload expired) starts the file again once.
  for (let fresh = u.upload === undefined || u.restart; ; fresh = true) {
    if (fresh && !(await start(u))) return
    const upload = u.upload
    if (upload === undefined) return
    const sendMiss = await chunks(u, upload)
    if (gone(u)) return
    const miss = sendMiss ?? (await complete(u, upload))
    if (gone(u)) return
    if (miss === undefined) {
      u.status = 'ready'
      u.sent = u.file.size
      return
    }
    if (miss.gone === true && !fresh) continue
    fail(u, sendMiss === undefined ? 'complete' : 'chunk', miss)
    return
  }
}

/** Starts the queued files while fewer than `maxActive` run. */
function pump() {
  for (;;) {
    if (uploads.filter((u) => u.status === 'running').length >= maxActive) return
    const next = uploads.find((u) => u.status === 'queued')
    if (next === undefined) return
    void run(next).finally(() => {
      changed()
      pump()
    })
  }
}

/** Deletes an upload on the server: a 404 or no answer is fine, as an upload nobody sends expires. */
function forget(upload: UploadId) {
  void api.api.uploads[':upload'].$delete({ param: { upload: encodeURIComponent(upload) } }).catch(() => undefined)
}

/** Adds `files` to the composer of `chat` (its pane ID), whose server ID is `liveChat`, and starts them uploading. */
export function addFiles(chat: string, liveChat: string, files: readonly File[]) {
  const room = maxAttachments - uploads.filter((u) => u.chat === chat).length
  const taken = files.slice(0, Math.max(0, room))
  if (taken.length < files.length) limitLines.set(chat, `Not attached — ${String(maxAttachments)} files at most`)
  else limitLines.delete(chat)
  for (const file of taken) {
    const tooLarge = file.size > maxUploadBytes
    const empty = file.size === 0
    uploads.push({
      key: `file-${String(++seq)}`,
      chat,
      liveChat,
      file,
      status: tooLarge || empty ? 'failed' : 'queued',
      sent: 0,
      sending: 0,
      upload: undefined,
      chunkSize: 1,
      next: 0,
      attachment: undefined,
      why: tooLarge ? 'too large' : empty ? 'the file is empty' : undefined,
      restart: true,
      final: tooLarge || empty,
      abort: undefined,
      removed: false,
    })
  }
  changed()
  pump()
}

/** Removes the chip `key` of `chat`: aborts its request in flight and deletes its upload on the server. */
export function removeFile(chat: string, key: string) {
  const u = uploads.find((f) => f.chat === chat && f.key === key)
  if (u === undefined) return
  u.removed = true
  u.abort?.()
  if (u.attachment !== undefined && u.upload !== undefined && inSend.has(u.attachment))
    removedInSend.set(u.attachment, u.upload)
  else if (u.upload !== undefined) forget(u.upload)
  uploads = uploads.filter((f) => f !== u)
  limitLines.delete(chat)
  changed()
  pump()
}

/** Retry of the failed chip `key`: on from the failed chunk, or from the start after a conflict. */
export function retryFile(chat: string, key: string) {
  const u = uploads.find((f) => f.chat === chat && f.key === key)
  // A file the server will never take has no Retry.
  if (u?.status !== 'failed' || u.final) return
  u.status = 'queued'
  u.why = undefined
  changed()
  pump()
}

/** A send that went through with `sent`: those chips leave the composer of `chat`; the server keeps their files. */
export function sentFiles(chat: string, sent: readonly UploadId[]) {
  uploads = uploads.filter((u) => u.chat !== chat || u.attachment === undefined || !sent.includes(u.attachment))
  limitLines.delete(chat)
  changed()
}

/** A send that the server refused with 409 upload-conflict: those chips fail, and Retry starts each file again. */
export function conflictFiles(chat: string, sent: readonly UploadId[]) {
  for (const u of uploads)
    if (u.chat === chat && u.attachment !== undefined && sent.includes(u.attachment)) {
      u.status = 'failed'
      u.why = 'upload-conflict'
      u.restart = true
    }
  changed()
}

/** A send names `ids`: a chip of them removed before the send ends keeps its upload until then. */
export function sendingFiles(ids: readonly UploadId[]) {
  for (const id of ids) inSend.add(id)
}

/** The send that named `ids` ended: a file removed meanwhile is deleted only when the send did not go through. */
export function settledFiles(ids: readonly UploadId[], wentThrough: boolean) {
  for (const id of ids) {
    inSend.delete(id)
    const upload = removedInSend.get(id)
    removedInSend.delete(id)
    if (upload !== undefined && !wentThrough) forget(upload)
  }
}

/** Ends every upload, for a test's cleanup (`resetAllStores`): aborts each request in flight. */
function resetUploads() {
  for (const u of uploads) {
    u.removed = true
    u.abort?.()
  }
  uploads = []
  limitLines.clear()
  inSend.clear()
  removedInSend.clear()
  changed()
}

registerReset(resetUploads)
