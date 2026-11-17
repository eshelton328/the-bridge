// The top of an item's detail: the task bar (status, where it came from,
// Discuss when the task has a discussion, Snooze and Dismiss) and the title
// block (title, meta chips and tags). Snooze opens the Snooze menu when the
// state has one; Discuss shows pressed while the discussion is open. Props
// only.
import {
  BubbleIcon,
  Button,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  FeatureIcon,
  FileIcon,
  FolderIcon,
  Inline,
  LinearIcon,
  Menu,
  type MenuEntry,
  MetaChip,
  SnoozeIcon,
  Stack,
  StatusPill,
  TagIcon,
  TagsLine,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDetailHead } from '../types.ts'

const origin = css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' })
const title = css({ textStyle: 'title', m: '0' })

const chipIcons = {
  folder: <FolderIcon />,
  feature: <FeatureIcon />,
  linear: <LinearIcon />,
  file: <FileIcon />,
} as const satisfies Record<InboxDetailHead['chips'][number]['icon'], ReactNode>

function SnoozeButton({ head, open }: { head: InboxDetailHead; open: boolean }) {
  const button = (
    <Button size="sm" pressed={open ? true : undefined}>
      <SnoozeIcon />
      Snooze
    </Button>
  )
  const menu = head.snoozeMenu
  if (menu === undefined) return button
  const items: MenuEntry[] = [
    ...menu.times.map((t) => ({ value: t.value, label: t.label, icon: <ClockIcon />, trailing: t.time })),
    { value: 'pick', label: menu.pick, icon: <CalendarIcon /> },
    { type: 'separator' },
    { value: 'done', label: menu.done, icon: <CheckIcon /> },
    { value: 'dismiss', label: menu.dismiss, icon: <CloseIcon />, tone: 'danger' },
  ]
  return (
    <Menu
      trigger={button}
      open={open}
      placement="bottom-end"
      width="md"
      size="lg"
      data-figma="menu · Snooze or dismiss"
      heading={menu.heading}
      items={items}
    />
  )
}

export type DetailHeadProps = {
  head: InboxDetailHead
  /** The Snooze menu is open. */
  snoozeOpen?: boolean | undefined
  /** The task has a discussion: the task bar shows Discuss, pressed while the discussion is open. */
  discuss?: { open: boolean } | undefined
}

export function DetailHead({ head, snoozeOpen = false, discuss }: DetailHeadProps) {
  return (
    <>
      <Inline gap="8" align="center" data-figma="task bar">
        <StatusPill tone={head.status.tone} label={head.status.label} dot />
        <span className={origin}>{head.origin}</span>
        {discuss === undefined ? null : (
          // Figma draws Discuss in violet while the discussion is open; the library's pressed button is cyan (LIBRARY_GAPS.md).
          <Button pressed={discuss.open}>
            <BubbleIcon />
            Discuss
          </Button>
        )}
        {head.actions ? (
          <>
            <SnoozeButton head={head} open={snoozeOpen} />
            <Button size="sm">
              <CloseIcon />
              Dismiss
            </Button>
          </>
        ) : null}
      </Inline>
      <Stack gap="10" data-figma="title block">
        <h1 className={title}>{head.title}</h1>
        <Inline gap="6" wrap>
          {head.chips.map((c) => (
            <MetaChip
              key={c.label}
              size="sm"
              label={c.label}
              icon={chipIcons[c.icon]}
              tone={c.issue ? 'issue' : 'muted'}
            />
          ))}
        </Inline>
        <TagsLine size="sm" tags={head.tags} icon={<TagIcon />} />
      </Stack>
    </>
  )
}
