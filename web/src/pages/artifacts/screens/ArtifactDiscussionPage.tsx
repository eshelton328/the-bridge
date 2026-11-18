// The open artifact's discussion on a tablet (Figma T4 452:3707): a page of
// its own in the artifact's place, with no tab bar, as the Inbox's (T17).
// The nav has Back to the artifact, the model and context in the middle and
// Open in workspace at its end; the artifact's card under it returns to the
// artifact too. Then the empty state or the entries, and the reply box. The
// nav and the card stay at the top and the reply box at the bottom, and only
// the messages between them scroll (d-107): the shared DetailFrame, with the
// reply box as its sticky footer, capped as the desktop panel's. With entries
// (T5 452:3841) the question, the reply and the proposal, as D8's. Props only.
import { BackRow, Button, ChatIcon, Composer, Inline, Stack } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { ArtifactProposalProps } from '../blocks/ArtifactProposal.tsx'
import { DiscussedArtifactCard } from '../blocks/DiscussedArtifactCard.tsx'
import { DiscussionEmpty } from '../blocks/DiscussionEmpty.tsx'
import { DiscussionEntry } from '../blocks/DiscussionEntry.tsx'
import { ModelContext } from '../blocks/ModelContext.tsx'
import type { ArtifactDetail, ArtifactDiscussion, ArtifactDiscussionEntry } from '../types.ts'

// The page fills the detail's height and no more, so only the messages scroll; the Composer caps a long draft at 30%
// of the page's height (cqh), as the desktop panel's at 30% of the panel's.
const page = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]', containerType: 'size' })
// 452:3769: the nav is 40 high, 4 under the status bar, and the card 8 under it (452:3778). The Container pads 12 at
// the top; the nav takes 8 of it back and pads its 32 px buttons 4 above and below.
const nav = css({ mt: '-8', py: '4' })
const spacer = css({ flex: '1' })
// 452:3793: the discussion area starts 8 under the card, and the empty state's tile 74 under its top (452:3795).
// The library's tile (44 against 42) and title (28 high against 22) are 8 taller than Figma's, so the tile sits 64
// under the top, 32 here and 32 above the empty state, and the text, "It can" and the suggestions keep Figma's
// places. T5 (452:3927): the first entry 14 under the area's top (452:3928), 12 on the 4 px grid.
const thread = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', mt: '8' })
const emptyPad = css({ pt: '32' })
const entriesPad = css({ pt: '12' })
const emptyTop = css({ pt: '32' })
// 452:3823: the reply box 12 under the discussion area and 22 above the home indicator's 21 px (43, 40 on the grid),
// 22 in (24, as the page). It stays on the page's canvas, so the messages that scroll under it do not show through.
const footer = css({
  position: 'sticky',
  bottom: '[var(--scroll-frame-inset, 0px)]',
  pt: '12',
  pb: '40',
  px: '24',
  bg: 'bg.canvas',
})

export type ArtifactDiscussionPageProps = {
  artifact: ArtifactDetail
  discussion: ArtifactDiscussion
  /** The status pill of the artifact's card, such as "New"; none without it. */
  badge?: string | undefined
  /** What Erik has typed in the reply box. */
  draft?: string | undefined
  /** What the discussion shows; with none, the empty state. */
  entries?: readonly ArtifactDiscussionEntry[] | undefined
  applied?: ArtifactProposalProps['applied']
  onAct?: ArtifactProposalProps['onAct']
  /** Back or the artifact's card: the artifact's page shows again (T2). */
  onBack?: (() => void) | undefined
  onDraftChange?: ((text: string) => void) | undefined
  onSend?: ((text: string) => void) | undefined
  onOpenInWorkspace?: (() => void) | undefined
}

export function ArtifactDiscussionPage({
  artifact,
  discussion,
  badge,
  draft = '',
  entries = [],
  applied,
  onAct,
  onBack,
  onDraftChange,
  onSend,
  onOpenInWorkspace,
}: ArtifactDiscussionPageProps) {
  const back = discussion.back ?? artifact.title
  return (
    <div className={page}>
      <DetailFrame
        layout="tablet"
        back={
          <Stack gap="8">
            <Inline gap="8" align="center" className={nav} data-figma="nav">
              <BackRow label={back} onBack={onBack} />
              <span className={spacer} />
              <ModelContext discussion={discussion} />
              <span className={spacer} />
              <span data-figma={discussion.layers.header}>
                <Button onClick={onOpenInWorkspace}>
                  <ChatIcon />
                  {discussion.openInWorkspace}
                </Button>
              </span>
            </Inline>
            <DiscussedArtifactCard artifact={artifact} badge={badge} guard={discussion.guard} onOpen={onBack} />
          </Stack>
        }
        footer={
          <div className={footer}>
            <div data-figma="composer · discussion">
              <Composer
                label={discussion.placeholder}
                placeholder={discussion.placeholder}
                // With no one to keep the draft, the box keeps it (a story or a canvas board).
                {...(onDraftChange === undefined
                  ? { defaultValue: draft }
                  : { value: draft, onValueChange: onDraftChange })}
                onSubmit={(text) => {
                  onSend?.(text)
                }}
              />
            </div>
          </div>
        }
      >
        <div className={cx(thread, entries.length === 0 ? emptyPad : entriesPad)} data-figma="discussion">
          {entries.length === 0 ? (
            <div className={emptyTop}>
              <DiscussionEmpty empty={discussion.empty} onPick={onDraftChange} place="page" />
            </div>
          ) : (
            <Stack gap="12">
              {entries.map((entry, i) => (
                <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} applied={applied} onAct={onAct} />
              ))}
            </Stack>
          )}
        </div>
      </DetailFrame>
    </div>
  )
}
