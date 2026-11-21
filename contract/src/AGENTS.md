# contract/src

One file for each area of the API, named after the area in camelCase,
with its `*.test.ts` beside it. `index.ts` exports each name.

- A schema is Zod, and its type is `z.infer` of it, exported under the
  same name; never write the type by hand.
- An ID that the server makes is a branded schema in the IDs file. A
  workspace or chat ID holds its machine ID before a `/`
  (`mac-mini/w17`), so IDs stay unique across machines.
- A live event wraps its data in the event envelope: source, sequence
  number, type and data. Each source has its own sequence numbers.
- A live event says what changed, not the new list: a client reads the
  workspaces again on `workspaces.changed` and each time the stream
  opens.
- Every error response and SSE `error` event is an `ErrorBody`: a `kind`
  from the `ErrorKind` union, a client message with no path or login,
  and the request ID (d-115, `errors.test.ts`). A new kind gets a status
  in `errorStatus`.
- A layout names each pane by its chat ID, as `GET /api/workspaces`
  does, never by a herdr pane ID; `TabLayout` checks that its chats are
  its panes in tree order and that the focused chat is in the tree
  (`layout.test.ts`).
- A transcript entry has an ID that is stable in its chat; a change
  event replaces the entry with that ID or adds it at the end. A tool
  entry has a name and a short target, never its arguments or its
  result (`transcripts.test.ts`).
- A prompt request holds only its text and at most `maxAttachments`
  upload IDs (a strict object, never a path), and a stop request and an
  input clear request are empty objects; the text may be empty only with
  a file, and goes to the chat and nowhere else. A command request is
  `compact` with at most one line of instructions, or `clear`; the
  instructions go to the chat as a prompt's text does (`prompts.test.ts`).
- An upload request holds the file's name, size and type only (a strict
  object), never a path; the file goes up in chunks of the size the
  server gives, at most `maxUploadBytes` (1 GiB) a file, and the name
  never goes into a log line or an error body (`uploads.test.ts`).
- A `ClientErrorReport` holds only its listed fields (a strict object),
  so a report carries no page text or app state (`clientErrors.test.ts`).
