# app/push

The app's side of Web Push (d-118) that runs once per page. `mountApp`
calls `startPush()` only in the real app: never in a test (Vitest's
`test` mode) or Storybook, and only with a service worker in a secure
context, in a build that reads the live server.

- `startPush.ts` registers `/sw.js` (`web/public/sw.js`) with scope `/`,
  listens for its open-chat messages and starts the "seen" beat. A
  registration that fails goes to `report()` as its error's name only.
- `seenBeat.ts` sends `POST /api/push/seen` when the page shows and every
  20 s while it shows, with one timer for the app; the server sends no
  push while a page was seen in the last 30 s.
- `openChatMessages.ts`: a tap on a notification with the app open makes
  the worker focus the window and post the chat ID; the router then opens
  `/workspaces?chat=<id>` (`pages/workspaces/useChatLink.ts`). Only a
  chat ID of the contract's shape gets through.
- `sw.test.ts` loads `sw.js` with a fake `self` and tests each event:
  a push of another shape shows nothing, and a tap builds the URL only
  from the worker's origin and the encoded chat ID.

The switch itself is `state/pushStore.ts` (its state), `lib/pushSwitch.ts`
(turn on and off), `lib/pushBrowser.ts` (the browser's push API, which
tests replace with `lib/fakePush.ts`) and `blocks/NotificationsSwitch.tsx`.
