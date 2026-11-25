// A chat mention as MarkdownText draws it (remarkChatMentions.ts): the
// library's MentionChip, a link to `/workspaces?chat=<ChatId>`. A plain
// press opens the chat in the same tab through MarkdownChats' `open`, as a
// tap on its row would; a press with a modifier key keeps the browser's
// own action on the link. The R56 rules are for the links a text writes,
// not for this one. Props only.
import { MentionChip } from '@eshelton328/component-library-1701'
import { use, type MouseEvent, type ReactNode } from 'react'
import { MarkdownChats } from './markdownChats.ts'

export type ChatMentionProps = {
  /** The chat's server ID, from the plugin's node. */
  chat?: unknown
  /** The chat's title, from the plugin's node. */
  name?: unknown
  /** The text the plugin matched, drawn when the node has no chat or name. */
  children?: ReactNode
}

export function ChatMention({ chat, name, children }: ChatMentionProps) {
  const { open } = use(MarkdownChats)
  if (typeof chat !== 'string' || typeof name !== 'string') return children
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    open(chat)
  }
  return <MentionChip name={name} href={`/workspaces?chat=${encodeURIComponent(chat)}`} onClick={onClick} />
}
