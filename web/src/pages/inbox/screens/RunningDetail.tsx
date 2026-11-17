// The detail of a started item: a header with where it runs and its state,
// the chat streaming below it and a reply box at the bottom. On the
// desktop (D5) the header has View task and Open in Workspaces; on a
// tablet or phone (T5) Back and Workspaces sit above it, and the header
// itself opens the task, with the place and the chat on their own lines.
// Props only.
import {
  BackRow,
  Button,
  ChevronRightIcon,
  Composer,
  Container,
  ExternalLinkIcon,
  Inline,
  KindMark,
  ModelChip,
  Panel,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { ChatEntry } from '../blocks/ChatEntry.tsx'
import { InboxStatus } from '../blocks/InboxStatus.tsx'
import type { InboxRunning } from '../types.ts'

const fill = css({ flex: '1' })
// T5: the first message 22 below the started task (346:6378 to 346:6393), 24 on the grid (d-072); D5 has 18, the
// stack's 16. On the tablet the chat takes 8 more than the stack's gap.
const chatCompact = css({ flex: '1', mt: '8' })
const title = css({ textStyle: 'subtitle', m: '0', flex: '1' })
// T5 346:6380: SemiBold 15.
const compactTitle = css({ textStyle: 'paneTitle', m: '0', flex: '1' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' })
const chevron = css({ color: 'fg.muted', display: 'inline-flex' })

export type RunningDetailProps = {
  detail: InboxRunning
  /** The screen's layout. */
  layout?: Viewport | undefined
  /** Back on a tablet or phone. */
  onBack?: (() => void) | undefined
}

function DesktopHeader({ detail }: { detail: InboxRunning }) {
  return (
    <div data-figma="started task">
      <Panel>
        <Stack gap="6">
          <Inline gap="10" align="center">
            <h1 className={title}>{detail.title}</h1>
            <Button size="sm">
              View task
              <ChevronRightIcon />
            </Button>
            <Button size="sm">
              <ExternalLinkIcon />
              Open in Workspaces
            </Button>
          </Inline>
          <Inline gap="6" align="center">
            <KindMark kind={detail.agent} size="16" />
            <span className={meta}>
              {detail.meta.task} · {detail.meta.started} {detail.meta.chat}
            </span>
            <InboxStatus pill={detail.status} />
          </Inline>
        </Stack>
      </Panel>
    </div>
  )
}

function CompactHeader({ detail, onBack }: { detail: InboxRunning; onBack: (() => void) | undefined }) {
  return (
    <>
      <div data-figma="nav">
        <BackRow label="Inbox" onBack={onBack}>
          <Button size="sm" data-figma="button · Open in Workspaces">
            <ExternalLinkIcon />
            Workspaces
          </Button>
        </BackRow>
      </div>
      <div data-figma="started task">
        <Panel>
          <Stack gap="4">
            <Inline gap="8" align="center">
              <h1 className={compactTitle}>{detail.title}</h1>
              <InboxStatus pill={detail.status} />
              <span className={chevron} data-figma="chevron · open task">
                <ChevronRightIcon size="16" />
              </span>
            </Inline>
            <span className={meta}>{detail.meta.task}</span>
            <Inline gap="6" align="center" data-figma="running in">
              <KindMark kind={detail.agent} size="16" />
              <span className={meta}>{detail.meta.chat}</span>
            </Inline>
          </Stack>
        </Panel>
      </div>
    </>
  )
}

export function RunningDetail({ detail, layout = 'desktop', onBack }: RunningDetailProps) {
  return (
    <Container size={detailContainerSize(layout)} className={fill}>
      <Stack gap="16" className={fill}>
        {layout === 'desktop' ? <DesktopHeader detail={detail} /> : <CompactHeader detail={detail} onBack={onBack} />}
        <Stack gap="16" className={layout === 'desktop' ? fill : chatCompact}>
          {detail.chat.map((entry, i) => (
            <ChatEntry key={`${String(i)}:${entry.type}`} entry={entry} />
          ))}
        </Stack>
        {/* T5's reply box is the unnamed layer 346:6416. */}
        <div data-figma={layout === 'desktop' ? undefined : '346:6416'}>
          <Composer
            label="Reply"
            placeholder={detail.reply}
            running
            onAttach={() => undefined}
            // T5's reply box (346:6416) has no model chip.
            model={
              layout === 'desktop' ? (
                <ModelChip model={detail.model} options={[{ value: detail.model, label: detail.model }]} />
              ) : undefined
            }
          />
        </div>
      </Stack>
    </Container>
  )
}
