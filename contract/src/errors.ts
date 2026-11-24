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
   * (`inputNotEmpty`, for a prompt, or text that stayed after an input clear), the server cannot find its input box
   * on its screen, so it sent nothing (`inputUnreadable`: a dialog, or a box it does not know), it takes no file (`noAttachments`, a
   * Codex chat, for an upload), its input box cannot be cleared (`noCommands`, a Codex chat), or it did not take a
   * prompt that the server typed, so the server removed the text again (`notSubmitted`), it works or a state herdr
   * cannot tell (`working`, for a command or a close), its tab has one pane, for a zoom (`singlePane`), the
   * other chat of a swap is in another tab (`otherTab`), a move goes to the chat's own tab (`sameTab`), or a move
   * goes to a tab that shows only one pane (`zoomedTab`), or a prompt's `sendId` was used for this chat before
   * (`duplicateSend`; read its result instead), a new chat's folder is not under the server's chat root
   * (`folderNotAllowed`), another chat has the new chat's name (`nameTaken`), or a start with the same `createId`
   * is in progress or failed part way (`duplicateCreate`; read the chat list instead), or the chat's screen did not
   * show the asked effort after the effort keys (`effortNotConfirmed`; look at the chat), or, for a model restart,
   * the chat's command line has a token the server does not know (`launchArgsUnknown`) or skips a permission
   * (`skipsPermissions`), the chat runs in another folder than its pane (`folderChanged`), the chat already has
   * that model (`sameModel`), or a restart of the chat is in progress (`restarting`, for any input to it), or a
   * move goes to the chat's own workspace (`sameWorkspace`) or leaves a workspace that holds the server or the
   * coordinator's chat (`holdsServer`), or a fork or a side question has no session to copy (`noSession`), or a side question waits for one of the chat's
   * own, or for one of the three that the server runs at a time (`sideBusy`), or a transcript page asks for the
   * entries before an entry the server does not find in the chat (`entryNotFound`; read the newest page again).
   */
  z.object({
    kind: z.literal('chat-not-ready'),
    state: z.enum([
      'shell',
      'needsYou',
      'notWorking',
      'inputNotEmpty',
      'inputUnreadable',
      'noAttachments',
      'noCommands',
      'notSubmitted',
      'working',
      'singlePane',
      'otherTab',
      'sameTab',
      'zoomedTab',
      'duplicateSend',
      'folderNotAllowed',
      'nameTaken',
      'duplicateCreate',
      'effortNotConfirmed',
      'launchArgsUnknown',
      'skipsPermissions',
      'folderChanged',
      'sameModel',
      'restarting',
      'sameWorkspace',
      'noSession',
      'holdsServer',
      'sideBusy',
      'entryNotFound',
    ]),
    ...common,
  }),
  /**
   * The workspace cannot take the request now (409): a chat in it works (`working`) or waits for the owner
   * (`needsYou`), the close's pane count is not the server's (`panesChanged`; read the list again), it holds the
   * server's own processes or the coordinator's chat (`holdsServer`), herdr groups it with worktree workspaces
   * (`group`), or an order does not name the current list (`orderStale`; read the list again).
   */
  z.object({
    kind: z.literal('workspace-not-ready'),
    state: z.enum(['working', 'needsYou', 'panesChanged', 'holdsServer', 'group', 'orderStale']),
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
  /** The Inbox item cannot take this action here (409): a brain item changes in the brain, not in the app. */
  z.object({ kind: z.literal('inbox-read-only'), ...common }),
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
  'workspace-not-ready': 409,
  'too-large': 413,
  'unsupported-media': 415,
  'upload-conflict': 409,
  'storage-full': 507,
  'inbox-read-only': 409,
  'too-many-requests': 429,
  internal: 500,
} as const satisfies Record<ErrorKind['kind'], number>
