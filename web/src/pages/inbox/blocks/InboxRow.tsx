// One Inbox item in the list: its kind tile, title, meta and age; what it
// blocks, when a snoozed item returns, where a started item runs or how a
// finished one ended; and, for an approval, the answer buttons. A search
// marks its query in the meta line. Props only.
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
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

const blocks = css({ color: 'status.needsYou.fg' })
const runs = css({ color: 'fg.accent' })
const finished = css({ color: 'status.done.fg' })
const dismissed = css({ color: 'fg.subtle' })

export type InboxRowProps = {
  row: InboxRowView
  selected: boolean
  onSelect?: (() => void) | undefined
  /** The search query, marked in the meta line. */
  query?: string | undefined
}

function Lines({ row }: { row: InboxRowView }) {
  if (row.outcome !== undefined)
    return (
      <Inline gap="6" align="center" className={row.outcome.dismissed ? dismissed : finished}>
        {row.outcome.dismissed ? <CloseIcon size="12" /> : <CheckIcon size="12" />}
        {row.outcome.line}
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
    row.outcome !== undefined || row.running !== undefined || row.snoozed !== undefined || row.blocks !== null
  return (
    <ListRow
      density="compact"
      title={row.title}
      meta={query === undefined ? row.meta : <Highlight text={row.meta} query={query} />}
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
