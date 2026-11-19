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
  ScrollFrame,
  Stack,
  TruncatedText,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { compactChatPadding } from '../../../lib/compactPadding.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { ChatEntry } from '../blocks/ChatEntry.tsx'
import { InboxStatus } from '../blocks/InboxStatus.tsx'
import { OpenInWorkspaces } from '../blocks/OpenInWorkspaces.tsx'
import { draftProps, type InboxDrafts, type InboxRunning } from '../types.ts'

const fill = css({ flex: '1' })
// The chat fills the detail's height and no more: the Back bar stays at the top, the reply box at the bottom, and only
// the started task and the chat between them scroll (d-107).
const frame = css({ flex: '1', minH: '[0]' })
// The started task and the chat, 16 apart, as the stack around them was. The list is the containing block of what a
// message positions absolutely (its hidden name), so that scrolls with the list and stays above the reply box (R22).
const bodyGap = css({ gap: '16', position: 'relative' })
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
  /** Keeps the reply the owner is typing; see `InboxDrafts` in types.ts. */
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
            {/* Figma sets the header's Open in Workspaces in Medium 12 (D5 346:2239). */}
            <OpenInWorkspaces size="sm" textSize="xs" label="Open in Workspaces" />
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

// T5 346:6366 and M8 346:10836: the nav is 38 high, 4 under the status bar, with its 30 px button 4 in from its top.
// The page pads 4 at the top (`compactChatPadding`), and the nav pads 4 around the 28 px Back row: 36 high.
const compactNav = css({ py: '4' })

function CompactNav({ onBack }: { onBack: (() => void) | undefined }) {
  return (
    <div data-figma="nav" className={compactNav}>
      <BackRow label="Inbox" onBack={onBack}>
        <OpenInWorkspaces size="sm" textSize="xs" label="Workspaces" figma="button · Open in Workspaces" />
      </BackRow>
    </div>
  )
}

function CompactHeader({ detail, phone }: { detail: InboxRunning; phone: boolean }) {
  return (
    <>
      <div data-figma="started task">
        {/* T5 346:6378 and M8 346:10848 pad their content 10 at the top and 12 or 13 at the sides inside the border:
            the notice Panel (10 and 12), as the discussion page's task card. */}
        <Panel variant="notice">
          <Stack gap="4">
            {/* Figma sets the title, the state and the chevron 8 apart in a row 340 wide (M8 346:10849); the notice
                `Panel` pads 12 against Figma's 13, so the row is 342 here. A longer title ends with an ellipsis. */}
            <Inline gap="8" align="center">
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
  // On a tablet or phone the frame is the shell detail's own child, with the page's padding, so AppShell docks the reply
  // box on the on-screen keyboard (R21); the desktop's detail column keeps its Container.
  const chat = (
    <ScrollFrame
      className={layout === 'desktop' ? undefined : compactChatPadding[layout]}
      // T5 and M8: the started task 8 under the nav (346:6366 to 346:6378, 346:10836 to 346:10848).
      gap={layout === 'desktop' ? '16' : '8'}
      bodyClassName={bodyGap}
      header={layout === 'desktop' ? undefined : <CompactNav onBack={onBack} />}
      footer={
        // A long reply grows the reply box; the library Composer stops it at 30% of the window and scrolls inside. The
        // frame is not a size container: where its parent grows with its content, size containment would collapse it.
        <div data-figma={replyLayer[layout]} data-keyboard-keep="">
          <Composer
            label="Reply"
            placeholder={detail.reply}
            running
            // Figma draws the Stop square at 12 (D5 346:2285, T5 346:6426, M8 346:10896).
            stopIconSize="12"
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
      }
    >
      {layout === 'desktop' ? (
        <DesktopHeader detail={detail} onViewTask={onViewTask} />
      ) : (
        <CompactHeader detail={detail} phone={layout === 'phone'} />
      )}
      {/* T5 and M8 set the chat's entries 12 apart (346:6393 to 346:6433, 346:10863 to 346:10882); D5 has 16. */}
      <Stack gap={layout === 'desktop' ? '16' : '12'} className={layout === 'desktop' ? fill : chatCompact}>
        {detail.chat.map((entry, i) => (
          <ChatEntry key={`${String(i)}:${entry.type}`} entry={entry} />
        ))}
      </Stack>
    </ScrollFrame>
  )
  return layout === 'desktop' ? (
    <Container size="detail" className={frame}>
      {chat}
    </Container>
  ) : (
    chat
  )
}
