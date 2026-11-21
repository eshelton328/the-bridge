# Inbox blocks

Props-only blocks that only the Inbox uses. A block a second page needs
moves to `web/src/blocks/`; the Artifacts page copies the discussion
blocks' pattern instead of importing them.

- One component per file, named after the part it draws
  (`PascalCase.tsx`); start one with `pnpm new block <Name> --page
  inbox`.
- Build each block from library parts. A missing part is a row in
  `../LIBRARY_GAPS.md`, never a hand-built copy.
- `DiscussionThread` holds the entries and the reply box that
  `DiscussionPanel` (desktop) and the discussion page share; change it
  once for both.
- A block never uses the clipboard: Copy hands its text up
  (`onCopyPrompt`), and `InboxPage` copies it with `copyText`
  (`app/InboxPhone.test.tsx`).
