// sw.js version 2 (d-118). Change the number with each change, so the phone
// takes the new worker on its next open.
//
// The-bridge's service worker: it shows the server's Web Push as a
// notification and opens the chat when the owner taps it. Nothing else: no
// fetch handler and no cache, so every request goes to the network as before.
//
// A push holds JSON text {chat, name, event} (the contract's PushPayload) and
// never message text. A push that is not that shape shows nothing. A tap
// builds the chat's URL only from this worker's origin, the Workspaces route
// and the chat ID, checked again and URL-encoded; never a URL or path from
// the push. Tests load this file with a fake `self` (src/app/push/sw.test.ts).

/** A chat ID as the contract's ChatId (contract/src/ids.ts): "<machine>/<local>". */
const chatIdShape = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[A-Za-z0-9._:-]+$/
/** The most characters of a chat name in a push (the contract's maxPushName). */
const maxName = 120
/** The words under the chat name for each event. */
const bodies = { needsYou: 'Needs you', done: 'Done' }
/** The page route that opens a chat (web/src/pages/workspaces/search.ts `chat`). */
const chatRoute = '/workspaces?chat='
/** The message the app's page reads to open a chat in place (web/src/app/push/openChatMessages.ts). */
const openChatType = 'bridge:open-chat'

const isChatId = (value) => typeof value === 'string' && chatIdShape.test(value)

/** The push's {chat, name, event}, or null when it is not exactly that shape. */
function payloadOf(data) {
  if (data === null || data === undefined) return null
  let parsed
  try {
    parsed = JSON.parse(data.text())
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  const keys = Object.keys(parsed).sort().join(',')
  if (keys !== 'chat,event,name') return null
  const { chat, name, event } = parsed
  if (!isChatId(chat)) return null
  if (typeof name !== 'string' || name.length > maxName) return null
  if (event !== 'needsYou' && event !== 'done') return null
  return { chat, name, event }
}

self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = payloadOf(event.data)
  if (payload === null) return
  event.waitUntil(
    self.registration.showNotification(payload.name === '' ? 'The Bridge' : payload.name, {
      body: bodies[payload.event],
      tag: payload.chat,
      data: { chat: payload.chat },
    }),
  )
})

/** Focuses an open window of the app and asks it to open the chat, or opens a new window on the chat. */
async function openChat(chat) {
  const origin = self.location.origin
  const url = chat === null ? `${origin}/` : `${origin}${chatRoute}${encodeURIComponent(chat)}`
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const open = windows.find((client) => new URL(client.url).origin === origin)
  if (open === undefined) {
    await self.clients.openWindow(url)
    return
  }
  // The app's page opens the chat in place (a postMessage, as iOS's home-screen app keeps its page), with no reload.
  // A browser may refuse the focus (no user activation); the page still gets the message.
  const focused = (await open.focus().catch(() => null)) ?? open
  if (chat !== null) focused.postMessage({ type: openChatType, chat })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data
  const chat = typeof data === 'object' && data !== null && isChatId(data.chat) ? data.chat : null
  event.waitUntil(openChat(chat))
})
