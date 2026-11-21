// A tap on a push notification (public/sw.js) with the app open: the worker
// focuses the app's window and posts {type: 'bridge:open-chat', chat}, and
// this listener opens the chat in place through the router, so iOS's
// home-screen app keeps its page and does not load again. Only a chat ID of
// the contract's shape gets through.
import { ChatId } from '@bridge/contract'

/** The worker's message type (public/sw.js `openChatType`). */
export const openChatType = 'bridge:open-chat'

/** The chat a worker message asks to open, or undefined when the message is anything else. */
export function chatToOpen(data: unknown): ChatId | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  if (Reflect.get(data, 'type') !== openChatType) return undefined
  const chat = ChatId.safeParse(Reflect.get(data, 'chat'))
  return chat.success ? chat.data : undefined
}

/** Listens for the worker's open-chat messages on `container`; returns the removal. */
export function listenForOpenChat(
  container: Pick<ServiceWorkerContainer, 'addEventListener' | 'removeEventListener'>,
  open: (chat: ChatId) => void,
): () => void {
  const onMessage = (event: MessageEvent) => {
    const chat = chatToOpen(event.data)
    if (chat !== undefined) open(chat)
  }
  container.addEventListener('message', onMessage)
  return () => {
    container.removeEventListener('message', onMessage)
  }
}
