// The page of an Inbox item the mock data has no detail for, on a tablet or
// phone (screen review R11): a tap on its row opens it, as the desktop opens
// an item. Back returns to the list. ⋯ at the end of the Back row opens the
// row's actions sheet (M6), the same sheet a long press on the row opens.
// The page shows what the row knows: its kind, title, meta and age, what it
// blocks, when it returns or where it runs, how it ended, the answer buttons
// of an approval, and its prompt and notes. Props only.
import { Button, Inline, KindTile, MoreIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView } from '../types.ts'
import { BackToInbox } from './BackToInbox.tsx'

const title = css({ textStyle: 'title', color: 'fg.default', m: '0', textWrap: 'wrap' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const line = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
const blocks = css({ textStyle: 'bodySm', color: 'status.needsYou.fg', m: '0' })
const text = css({ textStyle: 'body', color: 'fg.default', m: '0', whiteSpace: 'pre-wrap' })

export type RowDetailProps = {
  row: InboxRowView
  /** Back to the list. */
  onBack?: (() => void) | undefined
  /** ⋯ was pressed: open the row's actions sheet. A finished row (in Done) has no actions, so no ⋯. */
  onActions?: (() => void) | undefined
}

export function RowDetail({ row, onBack, onActions }: RowDetailProps) {
  const status = row.outcome?.line ?? row.snoozed?.line ?? row.running?.line ?? row.blocks
  return (
    <article aria-label={row.title} data-figma="row detail">
      <BackToInbox
        onBack={onBack}
        actions={
          onActions === undefined ? undefined : (
            <Button
              size="sm"
              iconOnly
              aria-label={`More actions for ${row.title}`}
              aria-haspopup="dialog"
              onClick={onActions}
            >
              <MoreIcon />
            </Button>
          )
        }
      />
      <Stack gap="12">
        <Inline gap="10" align="center">
          <KindTile kind={row.kind} />
          <h1 className={title}>{row.title}</h1>
        </Inline>
        <p className={meta}>{`${row.meta} · ${row.snoozed?.age ?? row.age}`}</p>
        {status === null ? null : (
          <p
            className={
              row.outcome === undefined && row.snoozed === undefined && row.running === undefined ? blocks : line
            }
          >
            {status}
          </p>
        )}
        {row.approval ? (
          <Inline gap="8" wrap>
            <Button variant="primary" size="sm" textSize="xs">
              Allow once
            </Button>
            <Button variant="secondaryDanger" size="sm" textSize="xs">
              Deny
            </Button>
            <Button size="sm" textSize="xs">
              Open chat
            </Button>
          </Inline>
        ) : null}
        {(row.text ?? []).map((t) => (
          <p key={t} className={text}>
            {t}
          </p>
        ))}
      </Stack>
    </article>
  )
}
