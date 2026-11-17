// A started next step's chat: where it runs or ran, its state, what it is
// doing or what it did, and the two ways to open it. A removed next step
// uses the same card for how it was removed. The primary button opens the
// chat in the inbox when the card has one (Reply here, M10 to M8), or a
// removed task's discussion; the other waits for the Workspaces page
// (`OpenInWorkspaces`), or on a removed task's card is Restore. Props only.
import {
  BubbleIcon,
  Button,
  ExternalLinkIcon,
  Grid,
  Inline,
  KindMark,
  Panel,
  Stack,
  TruncatedText,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRunCard } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'
import { OpenInWorkspaces } from './OpenInWorkspaces.tsx'

const title = css({ textStyle: 'label', flex: '1' })
// M10 346:11097: the meta stays on one line, cut with an ellipsis, on the phone's narrow card.
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', display: 'grid' })

export type RunCardProps = {
  run: InboxRunCard
  /** The primary button: opens the card's chat, or a removed task's discussion. */
  onOpen?: (() => void) | undefined
  /** A removed task's card: the secondary button is Restore, which puts the task back. */
  onRestore?: (() => void) | undefined
}

export function RunCard({ run, onOpen, onRestore }: RunCardProps) {
  // Figma names the card after the run's state: "running card" (D6) or "result card" (D7, D21).
  const running = run.status.tone === 'working'
  // A running card has the accent border and tint; Figma's green border of a result card (D7) and red border
  // of a removed one (D21) have no Panel tone (LIBRARY_GAPS.md).
  return (
    <div data-figma={running ? 'running card' : 'result card'}>
      <Panel tone={running ? 'accent' : undefined}>
        <Stack gap="8">
          <Inline gap="8" align="center">
            <KindMark kind={run.agent} size="16" />
            <span className={title}>{run.title}</span>
            <InboxStatus pill={run.status} />
          </Inline>
          <span className={meta}>
            <TruncatedText>{run.meta}</TruncatedText>
          </span>
          <Grid columns="2" gap="8">
            <Button variant="primary" size="lg" onClick={onOpen}>
              <BubbleIcon />
              {run.open}
            </Button>
            {onRestore === undefined ? (
              <OpenInWorkspaces size="lg" label={run.openElsewhere} />
            ) : (
              // Figma draws Restore with Open in Workspaces' icon (D21 403:4278).
              <Button size="lg" onClick={onRestore}>
                <ExternalLinkIcon />
                {run.openElsewhere}
              </Button>
            )}
          </Grid>
        </Stack>
      </Panel>
    </div>
  )
}
