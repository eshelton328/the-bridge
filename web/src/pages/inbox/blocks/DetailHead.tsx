// The top of an item's detail: the task bar (status, where it came from,
// Discuss when the task has a discussion, Snooze and Dismiss) and the title
// block (title, meta chips and tags). Snooze opens the Snooze menu when the
// item has one and reports a snooze time or Mark done; "Pick a date and
// time…" and "Dismiss with a reason…" lead to steps Figma does not draw
// yet, so they only close the menu. Discuss shows pressed while the discussion is open. Props
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

/** The Snooze menu: whether it is open, and what Erik picks: a time to snooze the item until, or `null` for Mark done. */
export type SnoozeControl = {
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onPick?: ((until: string | null) => void) | undefined
}

const origin = css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' })
const title = css({ textStyle: 'title', m: '0' })

const chipIcons = {
  folder: <FolderIcon />,
  feature: <FeatureIcon />,
  linear: <LinearIcon />,
  file: <FileIcon />,
} as const satisfies Record<InboxDetailHead['chips'][number]['icon'], ReactNode>

function SnoozeButton({ head, snooze }: { head: InboxDetailHead; snooze: SnoozeControl }) {
  const { open, onOpenChange, onPick } = snooze
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
      onOpenChange={onOpenChange}
      onSelect={(value) => {
        const time = menu.times.find((t) => t.value === value)?.time
        if (time !== undefined) onPick?.(time)
        else if (value === 'done') onPick?.(null)
      }}
      placement="bottom-end"
      width="md"
      size="lg"
      data-figma={open ? 'menu · Snooze or dismiss' : undefined}
      heading={menu.heading}
      items={items}
    />
  )
}

export type DetailHeadProps = {
  head: InboxDetailHead
  /** The Snooze menu; closed when not set. */
  snooze?: SnoozeControl | undefined
  /** The task has a discussion: the task bar shows Discuss, pressed while the discussion is open. */
  discuss?: { open: boolean } | undefined
}

export function DetailHead({ head, snooze = { open: false }, discuss }: DetailHeadProps) {
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
            <SnoozeButton head={head} snooze={snooze} />
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
