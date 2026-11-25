# Inbox page

The Inbox: items that need the owner, next steps and snoozed items, and
the detail of the selected item. Its Figma frames are `D*` (desktop),
`T*` (tablet) and `M*` (phone) on the Main page; their saved copies are
in `references/inbox/`.

## Rules

- Only `InboxPage.tsx` reads `inboxStore.ts`. The store holds the owner's
  changes on top of the shown state; its dialog and search changes are
  dropped when another `?state=` shows (`inboxStore.test.ts`).
- A part the library cannot draw is a row in `LIBRARY_GAPS.md` for the
  batched library PR. Until it ships, use the part the row names under
  "Used now" and list the difference in the frame's
  `references/inbox/<frame>/deviations.md`.
- Pure view logic goes in `screens/<name>View.ts`; its tests are in this
  folder (`listView.test.ts`, `discussionView.test.ts`).
- The desktop draws the open task's row selected (d-101).
- The removal flow stays as built (d-101), though the M25 note calls it
  undecided.
- Each detail keeps its Back bar at the top and its reply box or pinned
  bar at the bottom; only the content between them scrolls (d-107,
  `app/InboxStickyBars.test.tsx`).
- A detail at least 1600 px wide widens the task column and puts the
  discussion in a side pane (screen review R1 to R3,
  `app/InboxWide.test.tsx`).
- On a tablet or phone a row with no detail opens `RowDetail`, and Back
  returns to the list at the scroll it had (R11).
- A discussion's Send goes through the store's `send`: the reply box keeps the
  draft until it resolves, a failed send is reported, and `markSent` empties
  only the draft that still holds the sent text (audit L-3,
  `InboxSendDraft.test.tsx`).
- In development the home reads the live Inbox (`liveInbox.ts`, mapped by
  `liveList.ts`): `GET /api/inbox`, read again on each `inbox.changed` of
  `GET /api/events` and each time the stream opens, never on a timer. The
  tab badge is the server's `counts.needsYou`. `?state=` and
  `?source=fixtures` show the sample data.
- The server's `needsYou` flag places a live item (f-003, R20; R48): Needs
  you holds what waits on the owner, To review a finished chat's turn and
  Snoozed the rest. Needs you's group and chip and the badge are
  `counts.needsYou`; the header and All are `counts.total` of the same
  read (`app/InboxNeedsYouLive.test.tsx`).
- A list read with no answer (none, a timeout, or a 5xx with no error
  body) after the page showed a list keeps that list for 10 s with no
  line (review R43b, as the Workspaces list); past it the line shows with
  one report. A 4xx, an error body or a first read shows at once
  (`liveInbox.ts` `watchLiveInbox`, `app/InboxListGrace.test.tsx`).
- The stream and the list read are the app's (`app/InboxFeedProvider.tsx`,
  `lib/inboxFeed.ts`): the page follows the feed and gives it the count it
  loaded, so the app reads the list once per burst. Every page's rail and
  tab bar show that count on a live page (`app/InboxBadgeLive.test.tsx`).
- A Filter box's value has its section's prefix (`kindValue`, `projectValue`,
  `tagValue` in `types.ts`), so a project named like a kind is its own box; a
  project named `global` has its own tag section. The menu shows the label.
- On the live Inbox a row opens its item at any width (`LiveDetail`, read
  from `GET /api/inbox/:item` in `useLiveItem.ts`). No row shows Allow or
  Deny (v1); a chat item's Open chat goes to `/workspaces?chat=`. Snooze,
  Mark done and Dismiss go to the server; a brain item is read-only and
  shows none of them. A miss shows one short line, and report() gets only
  the step, kind and status (`InboxMissError`).
- A brain item's text draws inline code as a badge and a fenced block
  as the library's MarkdownCodeBlock with Copy, which goes through the
  page's `copyText` (`onCopyCode`), as the chat's code does
  (`app/InboxMarkdownCode.test.tsx`).
- The live tests run on the owner's path with `lib/fakeInboxServer.ts`
  (`app/InboxLive.test.tsx`, `app/InboxLiveActions.test.tsx`).
- The route tests are in `app/` (`InboxRoute.test.tsx`,
  `InboxListTools.test.tsx`, `InboxPhone.test.tsx`, with
  `inboxRouteHelpers.ts`; the home in `InboxHome.test.tsx`). Run them
  after a change to the page, a screen or a block.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you add or change
  a screen, a story or a view helper.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block of this page.
- [states/AGENTS.md](states/AGENTS.md): read before you add or change a
  state or the screen map.
