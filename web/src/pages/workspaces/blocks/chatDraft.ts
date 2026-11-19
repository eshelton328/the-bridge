// A chat's composer with the owner's draft (`ui.drafts`): a pane that unmounts,
// on a visit to another page or when it closes, takes the composer's text
// with it, so the draft lives in the ui and the composer starts from it when
// the pane shows again.
import type { ComposerState } from '../types.ts'

/** The composer with `draft` as its text; the data's text when the owner has typed nothing in it. */
export const withDraft = (composer: ComposerState, draft: string | undefined): ComposerState =>
  draft === undefined ? composer : { ...composer, text: draft }
