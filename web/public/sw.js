// sw.js version 3 (d-118; richer pushes, bridge-coord 2026-11-23). Change the number with each change, so the phone
// takes the new worker on its next open.
//
// The-bridge's service worker: it shows the server's Web Push as a
// notification and opens the chat when the owner taps it. Nothing else: no
// fetch handler and no cache, so every request goes to the network as before.
//
// A push holds JSON text {chat, name, workspace, event, body} (the
// contract's PushPayload), or the old {chat, name, event} that the server
// sends to a subscription from before the preview choice: the title is "<chat> · <workspace>", the body the
// server's one-line preview, or the event's line when it sends none (the
// owner turned "Show message preview" off, or the chat has no text). A push
// that is not one of those shapes shows nothing. A new push of a chat closes the one
// it shows before (the same tag), so each chat has one. A tap
// builds the chat's URL only from this worker's origin, the Workspaces route
// and the chat ID, checked again and URL-encoded; never a URL or path from
// the push. Tests load this file with a fake `self` (src/app/push/sw.test.ts).

/** A chat ID as the contract's ChatId (contract/src/ids.ts): "<machine>/<local>". */
const chatIdShape = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[A-Za-z0-9._:-]+$/
/** The most characters of a chat or workspace name in a push (the contract's maxPushName). */
const maxName = 120
/** The most code points of a preview line (the contract's maxPushBody). */
const maxBody = 140
/** The words under the chat name for each event. */
const bodies = { needsYou: 'Needs you', done: 'Done' }
/** The page route that opens a chat (web/src/pages/workspaces/search.ts `chat`). */
const chatRoute = '/workspaces?chat='
/** The message the app's page reads to open a chat in place (web/src/app/push/openChatMessages.ts). */
const openChatType = 'bridge:open-chat'

const isChatId = (value) => typeof value === 'string' && chatIdShape.test(value)

const codePoints = (text) => Array.from(text).length

/** The push's {chat, name, workspace, event, body}, or null when it is not exactly that shape or the old one. */
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
  // The old payload (sw.js version 2's) has no workspace and no line.
  const old = keys === 'chat,event,name'
  if (!old && keys !== 'body,chat,event,name,workspace') return null
  const { chat, name, event } = parsed
  const workspace = old ? '' : parsed.workspace
  const body = old ? null : parsed.body
  if (!isChatId(chat)) return null
  if (typeof name !== 'string' || codePoints(name) > maxName) return null
  if (typeof workspace !== 'string' || codePoints(workspace) > maxName) return null
  if (event !== 'needsYou' && event !== 'done') return null
  if (body !== null && (typeof body !== 'string' || body === '' || codePoints(body) > maxBody)) return null
  return { chat, name, workspace, event, body }
}

/** The notification's title: the chat, then its workspace. */
function titleOf(payload) {
  const name = payload.name === '' ? 'The Bridge' : payload.name
  return payload.workspace === '' ? name : `${name} · ${payload.workspace}`
}

/** Closes the notifications this chat shows now, then shows the new one. */
async function showFor(payload) {
  const shown = await self.registration.getNotifications({ tag: payload.chat })
  for (const old of shown) old.close()
  await self.registration.showNotification(titleOf(payload), {
    body: payload.body ?? bodies[payload.event],
    tag: payload.chat,
    data: { chat: payload.chat },
  })
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
  event.waitUntil(showFor(payload))
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
