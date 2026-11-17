// One Inbox item in the list: its kind tile, title, meta, age, what it
// blocks and, for an approval, the answer buttons. Props only.
import { Button, KindTile, ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'

const blocks = css({ textStyle: 'small', color: 'fg.muted' })

export type InboxRowProps = {
  row: InboxRowView
  selected: boolean
  onSelect?: (() => void) | undefined
}

export function InboxRow({ row, selected, onSelect }: InboxRowProps) {
  return (
    <ListRow
      title={row.title}
      meta={row.meta}
      leading={<KindTile kind={row.kind} />}
      trailing={row.age}
      selected={selected}
      onSelect={onSelect}
      actions={
        row.approval ? (
          <>
            <Button variant="primary" size="sm">
              Allow once
            </Button>
            <Button variant="dangerText" size="sm">
              Deny
            </Button>
            <Button size="sm">Open chat</Button>
          </>
        ) : undefined
      }
    >
      {row.blocks === null ? null : <span className={blocks}>{row.blocks}</span>}
    </ListRow>
  )
}
