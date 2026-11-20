// The body of every error response (d-115). Each kind has a client
// message, written for the page and with no path or login in it, and the
// request ID that the server's log has for the request; some kinds add
// their own fields. A client switches on `kind`.
import { z } from 'zod'

const common = { message: z.string(), requestId: z.string() }

export const ErrorKind = z.discriminatedUnion('kind', [
  /** The request did not come from the owner (403). */
  z.object({ kind: z.literal('forbidden'), ...common }),
  /** No route has this path (404). */
  z.object({ kind: z.literal('not-found'), path: z.string(), ...common }),
  /** The request's input is wrong (400); one line for each problem. */
  z.object({ kind: z.literal('invalid-input'), issues: z.array(z.string()), ...common }),
  /** herdr answered with something the server does not read (502). */
  z.object({ kind: z.literal('herdr-bad-reply'), ...common }),
  /** herdr does not answer (503). */
  z.object({ kind: z.literal('herdr-unavailable'), ...common }),
  /**
   * The chat cannot take the request now (409): it is a shell, it waits for the owner's answer to a question
   * (`needsYou`), it has no work to stop (`notWorking`), its input box holds text that a prompt would join
   * (`inputNotEmpty`, for a prompt only), or it takes no file (`noAttachments`, a Codex chat, for an upload).
   */
  z.object({
    kind: z.literal('chat-not-ready'),
    state: z.enum(['shell', 'needsYou', 'notWorking', 'inputNotEmpty', 'noAttachments']),
    ...common,
  }),
  /** The file is larger than the server takes (413). */
  z.object({ kind: z.literal('too-large'), ...common }),
  /** The server cannot store the file in the form a chat reads, such as a HEIC photo it cannot convert (415). */
  z.object({ kind: z.literal('unsupported-media'), ...common }),
  /**
   * The upload does not match what the server has (409): a chunk number or length that is wrong, a missing chunk
   * at complete, or an attachment that is not complete or not of this chat.
   */
  z.object({ kind: z.literal('upload-conflict'), ...common }),
  /** The server's disk has no space for the file (507). */
  z.object({ kind: z.literal('storage-full'), ...common }),
  /** The client sent more requests of this kind than the server takes in a minute (429). */
  z.object({ kind: z.literal('too-many-requests'), ...common }),
  /** A bug in the server (500); the server's log has the cause under the request ID. */
  z.object({ kind: z.literal('internal'), ...common }),
])
export type ErrorKind = z.infer<typeof ErrorKind>

export const ErrorBody = z.object({ error: ErrorKind })
export type ErrorBody = z.infer<typeof ErrorBody>

/** The HTTP status of each kind. */
export const errorStatus = {
  forbidden: 403,
  'not-found': 404,
  'invalid-input': 400,
  'herdr-bad-reply': 502,
  'herdr-unavailable': 503,
  'chat-not-ready': 409,
  'too-large': 413,
  'unsupported-media': 415,
  'upload-conflict': 409,
  'storage-full': 507,
  'too-many-requests': 429,
  internal: 500,
} as const satisfies Record<ErrorKind['kind'], number>
