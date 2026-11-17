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
  Inline,
  KindMark,
  ModelChip,
  Panel,
  Stack,
  TruncatedText,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { ChatEntry } from '../blocks/ChatEntry.tsx'
import { InboxStatus } from '../blocks/InboxStatus.tsx'
import { OpenInWorkspaces } from '../blocks/OpenInWorkspaces.tsx'
import { draftProps, type InboxDrafts, type InboxRunning } from '../types.ts'

const fill = css({ flex: '1' })
// The reply box is an unnamed layer: 346:6416 in T5, 346:10886 in M8.
const replyLayer = { desktop: undefined, tablet: '346:6416', phone: '346:10886' } as const satisfies Record<
  Viewport,
  string | undefined
>
// T5: the first message 22 below the started task (346:6378 to 346:6393), 24 on the grid (d-072); D5 has 18, the
// stack's 16. On the tablet the chat takes 8 more than the stack's gap.
const chatCompact = css({ flex: '1', mt: '8' })
const title = css({ textStyle: 'subtitle', m: '0', flex: '1' })
// T5 346:6380: SemiBold 15. M8's note: the title stays on one line, cut with an ellipsis, so the state keeps its
// place beside it.
const compactTitle = css({ textStyle: 'paneTitle', m: '0', flex: '1', display: 'grid' })
// M8 346:10850: the title is 14 px SemiBold, so it fits beside the state; no text style is (LIBRARY_GAPS.md: Title
// of the started task on the phone), and `paneTitle` (15) cuts it. `label` is 14 px at Medium.
const phoneTitle = css({ textStyle: 'label', m: '0', flex: '1', display: 'grid' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', flex: '1' })
const chevron = css({ color: 'fg.muted', display: 'inline-flex' })

export type RunningDetailProps = {
  detail: InboxRunning
  /** The screen's layout. */
  layout?: Viewport | undefined
  /** Back on a tablet or phone. */
  onBack?: (() => void) | undefined
  /** Keeps the reply Erik is typing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** View task on the desktop: closes a chat that Reply here opened and shows its task again. */
  onViewTask?: (() => void) | undefined
}

function DesktopHeader({ detail, onViewTask }: { detail: InboxRunning; onViewTask: (() => void) | undefined }) {
  return (
    <div data-figma="started task">
      <Panel>
        <Stack gap="6">
          <Inline gap="10" align="center">
            <h1 className={title}>{detail.title}</h1>
            <Button size="sm" onClick={onViewTask}>
              View task
              <ChevronRightIcon />
            </Button>
            <OpenInWorkspaces size="sm" label="Open in Workspaces" />
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

type CompactHeaderProps = { detail: InboxRunning; onBack: (() => void) | undefined; phone: boolean }

function CompactHeader({ detail, onBack, phone }: CompactHeaderProps) {
  return (
    <>
      <div data-figma="nav">
        <BackRow label="Inbox" onBack={onBack}>
          <OpenInWorkspaces size="sm" label="Workspaces" figma="button · Open in Workspaces" />
        </BackRow>
      </div>
      <div data-figma="started task">
        <Panel>
          <Stack gap="4">
            {/* Figma sets the title, the state and the chevron 8 apart in a row 340 wide (M8 346:10849); the header's
                `Panel` pads 16 against Figma's 13, so the row is 332 here and the pill 2 px wider. On the phone the
                gaps take 6, which gives the title back the 4 px it needs to show whole, as Figma draws it; a longer
                title still ends with an ellipsis. */}
            <Inline gap={phone ? '6' : '8'} align="center">
              <h1 className={phone ? phoneTitle : compactTitle}>
                <TruncatedText>{detail.title}</TruncatedText>
              </h1>
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

export function RunningDetail({ detail, layout = 'desktop', onBack, drafts, onViewTask }: RunningDetailProps) {
  return (
    <Container size={detailContainerSize(layout)} className={fill}>
      <Stack gap="16" className={fill}>
        {layout === 'desktop' ? (
          <DesktopHeader detail={detail} onViewTask={onViewTask} />
        ) : (
          <CompactHeader detail={detail} onBack={onBack} phone={layout === 'phone'} />
        )}
        {/* T5 and M8 set the chat's entries 12 apart (346:6393 to 346:6433, 346:10863 to 346:10882); D5 has 16. */}
        <Stack gap={layout === 'desktop' ? '16' : '12'} className={layout === 'desktop' ? fill : chatCompact}>
          {detail.chat.map((entry, i) => (
            <ChatEntry key={`${String(i)}:${entry.type}`} entry={entry} />
          ))}
        </Stack>
        <div data-figma={replyLayer[layout]}>
          <Composer
            label="Reply"
            placeholder={detail.reply}
            running
            onAttach={() => undefined}
            {...draftProps(drafts, 'reply')}
            // The tablet's and phone's reply box (346:6416, 346:10886) has no model chip.
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
