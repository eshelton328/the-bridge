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
