// The top of an item's detail: the task bar (status, where it came from,
// Discuss when the task has a discussion, Snooze and Dismiss) and the title
// block (title, meta chips and tags). Snooze opens the Snooze menu when the
// item has one and reports a snooze time or Mark done; Dismiss in the task
// bar reports itself. "Pick a date and time…" and "Dismiss with a
// reason…" lead to steps Figma does not draw yet, so they only close the
// menu. Discuss opens and closes the discussion and shows pressed while
// it is open. Props
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
import type { InboxDetailHead, InboxSnoozeMenu } from '../types.ts'

/**
 * The task bar's Snooze menu and Dismiss: the menu's entries, whether it is
 * open, what Erik picks in it (a time to snooze the item until, or `null`
 * for Mark done), and Dismiss.
 */
export type SnoozeControl = {
  menu?: InboxSnoozeMenu | undefined
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onPick?: ((until: string | null) => void) | undefined
  onDismiss?: (() => void) | undefined
}

/** Discuss in the task bar: whether the discussion is open, and Discuss pressed to open or close it. */
export type DiscussControl = { open: boolean; onOpenChange?: ((open: boolean) => void) | undefined }

const origin = css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' })
// Panda's preflight balances the lines of every heading (`text-wrap: balance`), which broke M5's title after "or"
// with half the line empty. Figma fills each line before it wraps, as `wrap` does.
const title = css({ textStyle: 'title', m: '0', textWrap: 'wrap' })

const chipIcons = {
  folder: <FolderIcon />,
  feature: <FeatureIcon />,
  linear: <LinearIcon />,
  file: <FileIcon />,
} as const satisfies Record<InboxDetailHead['chips'][number]['icon'], ReactNode>

function SnoozeButton({ snooze, iconOnly }: { snooze: SnoozeControl; iconOnly: boolean }) {
  const { menu, open, onOpenChange, onPick } = snooze
  // The phone's nav draws Snooze and Dismiss as 32 px icon buttons (M2 346:9237).
  const button = iconOnly ? (
    <Button size="md" iconOnly aria-label="Snooze" pressed={open ? true : undefined}>
      <ClockIcon />
    </Button>
  ) : (
    <Button size="sm" pressed={open ? true : undefined}>
      <SnoozeIcon />
      Snooze
    </Button>
  )
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

/** Snooze and Dismiss: in the task bar, or as icons in the phone's nav (M2). */
export function SnoozeActions({ snooze, iconOnly = false }: { snooze: SnoozeControl; iconOnly?: boolean }) {
  return (
    <>
      <SnoozeButton snooze={snooze} iconOnly={iconOnly} />
      {iconOnly ? (
        <Button size="md" iconOnly aria-label="Dismiss" onClick={snooze.onDismiss}>
          <CloseIcon />
        </Button>
      ) : (
        <Button size="sm" onClick={snooze.onDismiss}>
          <CloseIcon />
          Dismiss
        </Button>
      )}
    </>
  )
}

/** Discuss: in the task bar, or in the phone's nav before Snooze and Dismiss (M17, 402:1945). */
export function DiscussButton({ discuss }: { discuss: DiscussControl }) {
  // Figma draws Discuss in violet while the discussion is open; the library's pressed button is cyan (LIBRARY_GAPS.md).
  return (
    <Button
      pressed={discuss.open}
      onClick={() => {
        discuss.onOpenChange?.(!discuss.open)
      }}
    >
      <BubbleIcon />
      Discuss
    </Button>
  )
}

export type DetailHeadProps = {
  head: InboxDetailHead
  /** The Snooze menu; closed when not set. */
  snooze?: SnoozeControl | undefined
  /** The task has a discussion: the task bar shows Discuss, pressed while the discussion is open. */
  discuss?: DiscussControl | undefined
  /** Discuss, Snooze and Dismiss sit in the task bar; on the phone they sit in the nav instead (M2, M17). */
  barActions?: boolean | undefined
}

export function DetailHead({ head, snooze = { open: false }, discuss, barActions = true }: DetailHeadProps) {
  return (
    <>
      <Inline gap="8" align="center" data-figma="task bar">
        <StatusPill tone={head.status.tone} label={head.status.label} dot />
        <span className={origin}>{head.origin}</span>
        {discuss === undefined || !barActions ? null : <DiscussButton discuss={discuss} />}
        {head.actions && barActions ? <SnoozeActions snooze={snooze} /> : null}
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
