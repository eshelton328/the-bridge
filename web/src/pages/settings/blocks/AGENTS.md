# Settings blocks

Props-only blocks that only the Settings page draws. Make one with
`pnpm new block <Name> --page settings`; a block a second page needs
moves to `web/src/blocks/`.

- One block per section: `AppearanceSection`, `NavigationSection`,
  `NotificationsSection`, `ChatDefaultsSection`; `settingsParts.ts` holds
  their shared styles.
- `NotificationsSwitch` (d-118) moved here from `web/src/blocks/` when the
  Settings page became its one place (d-119). Keep its states and lines.
- A nav switch the rules refuse to turn off stays on, with the line
  `navNoticeText` under it.
