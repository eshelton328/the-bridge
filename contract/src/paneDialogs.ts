// A dialog on a chat's screen that the transcript does not hold, such as a skill's numbered menu (R69). When a chat
// waits for the owner (`needsYou`) and its transcript has no open question, `GET /api/chats/:chat/dialog` reads the
// dialog that the chat's screen shows. `POST /api/chats/:chat/dialog` sends one option of it, only on the owner's tap:
// the server never picks an option. Logs keep only the dialog ID and the option number, never the dialog's text.
// `raw` is a screen's text, an exception to d-110 that d-125 records.
import { z } from 'zod'

/** The most characters of a dialog's text that the server sends. */
export const maxDialogChars = 8000

/**
 * One numbered option of a dialog, as its screen shows it: its label, and the description under it as `detail` only
 * when it says more than the label.
 */
export const DialogOption = z.strictObject({
  n: z.number().int().min(1).max(9),
  label: z.string().min(1).max(500),
  detail: z.string().min(1).max(500).optional(),
})
export type DialogOption = z.infer<typeof DialogOption>

/**
 * A dialog on a chat's screen. `id` is a hash of the text the server read, so it changes when the dialog changes.
 * `options` is there only when the server read the numbered list for sure; else the page shows `raw` read only and
 * asks the owner to answer in the terminal.
 */
export const PaneDialog = z
  .strictObject({
    id: z.string().regex(/^[0-9a-f]{16,64}$/),
    title: z.string().max(500).optional(),
    body: z.string().max(maxDialogChars).optional(),
    options: z.array(DialogOption).min(1).max(9).optional(),
    raw: z.string().min(1).max(maxDialogChars),
  })
  .refine((d) => new Set(d.options?.map((o) => o.n)).size === (d.options?.length ?? 0), {
    message: 'two options have the same number',
    path: ['options'],
  })
export type PaneDialog = z.infer<typeof PaneDialog>

/** The response of `GET /api/chats/:chat/dialog`: the dialog, or null when the chat's screen shows none. */
export const PaneDialogResponse = z.strictObject({ dialog: PaneDialog.nullable() })
export type PaneDialogResponse = z.infer<typeof PaneDialogResponse>

/**
 * The body of `POST /api/chats/:chat/dialog` (204): the dialog the owner saw and the option they tapped. When the
 * chat's screen no longer shows that dialog, or the option is not in it, the server sends nothing: 409
 * `chat-not-ready` `dialogChanged` (read the dialog again).
 */
export const AnswerDialogRequest = z.strictObject({ id: PaneDialog.shape.id, n: DialogOption.shape.n })
export type AnswerDialogRequest = z.infer<typeof AnswerDialogRequest>
