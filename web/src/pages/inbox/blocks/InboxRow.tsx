// One Inbox item in the list: its kind tile, title, meta and age; what it
// blocks, when a snoozed item returns, where a started item runs or how a
// finished one ended; a pill such as New; and, for an approval, the answer
// buttons. A search marks its query in the meta line. Props only.
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
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

const blocks = css({ color: 'status.needsYou.fg' })
const runs = css({ color: 'fg.accent' })
const finished = css({ color: 'status.done.fg' })
const dismissed = css({ color: 'fg.subtle' })
const removed = css({ color: 'status.danger.fg' })

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

export function InboxRow({ row, selected, onSelect, query }: InboxRowProps) {
  const lines =
    row.outcome !== undefined ||
    row.running !== undefined ||
    row.snoozed !== undefined ||
    row.blocks !== null ||
    row.pill !== undefined
  return (
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
            <Button variant="primary" size="sm">
              Allow once
            </Button>
            <Button variant="secondaryDanger" size="sm">
              Deny
            </Button>
            <Button size="sm">Open chat</Button>
          </>
        ) : undefined
      }
    >
      {lines ? <Lines row={row} /> : undefined}
    </ListRow>
  )
}
