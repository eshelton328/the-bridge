// The live New chat form (W3): what the owner chose in it and what the page
// tells it about the start. A sample form (the Figma states) has none of
// this, and draws its fields as Figma does. Props only.
import { useState } from 'react'
import type { NewChatForm, WorkspacesData, WorkspacesUi } from '../types.ts'

/** What the owner typed and picked in New chat: the name (blank for the server's), the model, the workspace (by id), the first message. */
export type NewChatValues = {
  readonly name: string
  readonly model: string
  readonly workspace: string
  readonly message: string
}

/** The page's side of a live New chat form. */
export type NewChatStart = {
  /** The start runs: Start chat is off and says so. */
  readonly busy?: boolean | undefined
  /** The name field's error, such as a name another chat has. */
  readonly nameError?: string | undefined
  /** The line of a start that missed. */
  readonly line?: string | undefined
  /** Retry sends the same start again; set with `line`. */
  readonly retry?: boolean | undefined
  /** Where the chat starts, the workspace field's hint: a new tab. */
  readonly place: string
  readonly onStart: (values: NewChatValues) => void
  readonly onRetry: () => void
}

/** The form's values, from what it opens with; a live form starts with an empty first message. */
export function useNewChatValues(form: NewChatForm) {
  const [values, setValues] = useState<NewChatValues>(() => ({
    name: form.name.value ?? '',
    model: form.model.value,
    workspace: form.workspace,
    message: '',
  }))
  const change = (next: Partial<NewChatValues>) => {
    setValues((now) => ({ ...now, ...next }))
  }
  return [values, change] as const
}

/** The page's start of a live chat (W3): `start` with the form's values, `retry` the same start again after a miss. */
export type NewChatStarter = {
  readonly start: (values: NewChatValues) => void
  readonly retry: () => void
}

/** The live form's side of `starter`, with the start's state in `ui`; none for a sample form. */
export function startOf(
  starter: NewChatStarter | undefined,
  data: Pick<WorkspacesData, 'newChat'>,
  ui: WorkspacesUi,
): NewChatStart | undefined {
  const words = data.newChat?.live
  if (starter === undefined || words === undefined) return undefined
  return { ...ui.newChatStart, place: words.newTab, onStart: starter.start, onRetry: starter.retry }
}
