// One Inbox item in the list: its kind tile, title, meta and age; what it
// blocks, when a snoozed item returns, where a started item runs or how a
// finished one ended; a pill such as New; and, for an approval, the answer
// buttons. A search marks its query in the meta line. With `onActions`, a
// long-press (a touch held for half a second) or the context menu (a right
// click, the menu key, Shift+F10) opens the row's actions (M6); a row that
// does not open is a button that opens them. Props only.
import {
  Button,
  CheckIcon,
  CloseIcon,
  Highlight,
  Inline,
  KindMark,
  KindTile,
  ListRow,
  SnoozeIcon,
  TrashIcon,
} from '@eshelton328/component-library-1701'
import { type KeyboardEvent, type MouseEvent, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

const blocks = css({ color: 'status.needsYou.fg' })
const runs = css({ color: 'fg.accent' })
const finished = css({ color: 'status.done.fg' })
const dismissed = css({ color: 'fg.subtle' })
const removed = css({ color: 'status.danger.fg' })
// M1 346:9052: the phone's rows pad their content 4 at the sides, against `ListRow`'s 10 (with its 1 px border, 11),
// so the kind tile lines up under the group's chevron (16) and the age ends 16 from the screen's edge. The row
// takes the 6 px difference outside the list's padding (LIBRARY_GAPS.md: List row padding on the phone).
const phoneRow = css({ mx: '-6' })

const outcomes = {
  done: { className: finished, icon: <CheckIcon size="12" /> },
  dismissed: { className: dismissed, icon: <CloseIcon size="12" /> },
  removed: { className: removed, icon: <TrashIcon size="12" /> },
} as const

export type InboxRowProps = {
  row: InboxRowView
  selected: boolean
  onSelect?: (() => void) | undefined
  /** The search query, marked in the meta line. */
  query?: string | undefined
  /** Opens the row's actions: a long-press or the context menu. */
  onActions?: (() => void) | undefined
  /** The row is in the phone's list, which pulls it out of the list's padding, with or without actions (M12). */
  phone?: boolean | undefined
}

/** How long a touch is held before it opens the row's actions, in ms; iOS's own long-press is about this. */
const longPress = 500

function useLongPress(onActions: (() => void) | undefined) {
  const timerRef = useRef<number | undefined>(undefined)
  // A held touch that opened the actions ends in a click; it must not open the row as well.
  const firedRef = useRef(false)
  const clear = () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    timerRef.current = undefined
  }
  if (onActions === undefined) return {}
  return {
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault()
      clear()
      onActions()
    },
    onPointerDown: (event: { pointerType: string }) => {
      firedRef.current = false
      if (event.pointerType !== 'touch') return
      clear()
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined
        firedRef.current = true
        onActions()
      }, longPress)
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onClickCapture: (event: MouseEvent) => {
      if (!firedRef.current) return
      firedRef.current = false
      event.stopPropagation()
    },
  }
}

function Lines({ row }: { row: InboxRowView }) {
  if (row.outcome !== undefined) {
    const { className, icon } = outcomes[row.outcome.result]
    return (
      <Inline gap="6" align="center" className={className}>
        {icon}
        {row.outcome.line}
      </Inline>
    )
  }
  if (row.pill !== undefined)
    return (
      <Inline gap="6" align="center">
        <InboxStatus pill={row.pill} />
      </Inline>
    )
  if (row.running !== undefined)
    return (
      <Inline gap="6" align="center" className={runs}>
        <KindMark kind={row.running.agent} size="12" />
        {row.running.line}
      </Inline>
    )
  const line = row.snoozed?.line ?? row.blocks
  if (line === null) return null
  return (
    <Inline gap="6" align="center" className={row.snoozed === undefined ? blocks : undefined}>
      <SnoozeIcon size="12" />
      {line}
    </Inline>
  )
}

export function InboxRow({ row, selected, onSelect, query, onActions, phone = false }: InboxRowProps) {
  const press = useLongPress(onActions)
  const lines =
    row.outcome !== undefined ||
    row.running !== undefined ||
    row.snoozed !== undefined ||
    row.blocks !== null ||
    row.pill !== undefined
  const item = (
    <ListRow
      density="compact"
      title={row.title}
      meta={query === undefined ? row.meta : <Highlight text={row.meta} query={query} variant="colour" />}
      leading={<KindTile kind={row.kind} />}
      trailing={
        row.running === undefined ? (
          (row.snoozed?.age ?? row.age)
        ) : (
          <>
            {row.age}
            <InboxStatus pill={row.running.status} />
          </>
        )
      }
      selected={selected}
      snoozed={row.snoozed !== undefined}
      finished={row.outcome !== undefined}
      onSelect={onSelect}
      actions={
        row.approval ? (
          <>
            <Button variant="primary" size="sm" textSize="xs">
              Allow once
            </Button>
            <Button variant="secondaryDanger" size="sm" textSize="xs">
              Deny
            </Button>
            <Button size="sm" textSize="xs">
              Open chat
            </Button>
          </>
        ) : undefined
      }
    >
      {lines ? <Lines row={row} /> : undefined}
    </ListRow>
  )
  // Only a phone row gets the wrapper, so the desktop and tablet lists keep their boxes; a finished row in the phone's
  // Done has no actions, but lines up with the others.
  if (!phone) return item
  if (onActions === undefined) return <div className={phoneRow}>{item}</div>
  // A row that does not open is not a button itself, so the wrapper is the row's control: a tap, Enter or Space opens
  // its actions, and a keyboard or screen reader reaches it. A row that opens keeps its own button, and the context
  // menu key on that button opens the actions through the wrapper.
  const control =
    onSelect === undefined
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-haspopup': 'dialog' as const,
          onClick: onActions,
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            onActions()
          },
        }
      : {}
  return (
    <div className={phoneRow} {...control} {...press}>
      {item}
    </div>
  )
}
