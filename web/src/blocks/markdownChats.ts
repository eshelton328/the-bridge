// The live chats that a Markdown text can mention (remarkChatMentions.ts):
// each chat's server ID (`<liveMachine>/<pane id>`) with its title, and
// what a press on a mention does. The Workspaces page entry gives it from
// its live data and its router; with no page to give it, as in the Inbox or
// a fixture state, the map is empty and no name links.
import { createContext } from 'react'

export type MarkdownMentions = {
  /** Each chat's server ID with its title. */
  readonly chats: ReadonlyMap<string, string>
  /** Opens the chat, as `/workspaces?chat=<ChatId>` does (useChatLink.ts). */
  readonly open: (chat: string) => void
}

export const MarkdownChats = createContext<MarkdownMentions>({ chats: new Map(), open: () => undefined })
