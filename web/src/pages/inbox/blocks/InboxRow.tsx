// One Inbox item in the list: its kind tile, title, meta and age; what it
// blocks, when a snoozed item returns or where a started item runs; and,
// for an approval, the answer buttons. Props only.
import { Button, Inline, KindMark, KindTile, ListRow, SnoozeIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

const blocks = css({ color: 'status.needsYou.fg' })
const runs = css({ color: 'fg.accent' })

export type InboxRowProps = {
  row: InboxRowView
  selected: boolean
  onSelect?: (() => void) | undefined
}

function Lines({ row }: { row: InboxRowView }) {
  if (row.running !== undefined)
    return (
      <Inline gap="6" align="center" className={runs}>
        <KindMark kind={row.running.agent} size="14" />
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

export function InboxRow({ row, selected, onSelect }: InboxRowProps) {
  const lines = row.running !== undefined || row.snoozed !== undefined || row.blocks !== null
  return (
    <ListRow
      title={row.title}
      meta={row.meta}
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
            <Button variant="dangerSoft" size="sm">
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
