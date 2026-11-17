// The open artifact's discussion, beside it on the desktop (Figma
// "discussion panel", D7 452:2410): the header with Open in workspace and
// Close, the model and how much context it uses, what it may do, the empty
// state or the entries (D8: Erik's question, the reply and the proposed
// change, applied in D9, then the messages he sent), and the reply box. Built from the same
// library parts as the Inbox's DiscussionPanel (D14), which the Inbox page
// does not export. The reply box has no attach button, as the Inbox's: no
// file flow is designed. Props only.
import {
  BubbleIcon,
  Button,
  ChatIcon,
  CloseIcon,
  Composer,
  ContextMeter,
  Inline,
  LockIcon,
  ModelChip,
  Stack,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ArtifactDiscussion, ArtifactDiscussionEntry } from '../types.ts'
import type { ArtifactProposalProps } from './ArtifactProposal.tsx'
import { DiscussionEmpty } from './DiscussionEmpty.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'

// Figma's panel is 628 wide, what is left beside the 820 px artifact pane. The pane here is Container
// size="detail" (748 + 2 × 40), so the panel starts 8 px further right; its 12 px start padding keeps the content at
// Figma's x 905, as the Inbox's panel (LIBRARY_GAPS.md "Discussion panel width").
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12',
  flex: '1',
  overflow: 'hidden',
  pt: '16',
  pb: '16',
  ps: '12',
  pe: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1' })
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
const meterLabel = css({ textStyle: 'monoSm', color: 'fg.muted' })
const hug = css({ alignSelf: 'flex-start' })
const guard = css({ display: 'flex', gap: '6', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const lock = css({ display: 'inline-flex', flexShrink: '0', pt: '2' })
const thread = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', pt: '6' })
// The empty state sits in the middle of the discussion area, as the Inbox's (D14). Figma puts it 120 below the
// area's top (452:2426 at y 264); no spacing token is that large (LIBRARY_GAPS.md "Empty state placement").
const middle = css({ justifyContent: 'center' })

export type DiscussionPanelProps = {
  discussion: ArtifactDiscussion
  /** What Erik has typed in the reply box. */
  draft?: string | undefined
  /** What the discussion shows; with none, the empty state. */
  entries?: readonly ArtifactDiscussionEntry[] | undefined
  /** Erik applied the proposal (D9): it shows its applied form. */
  applied?: ArtifactProposalProps['applied']
  /** A button of the proposal was pressed. */
  onAct?: ArtifactProposalProps['onAct']
  onDraftChange?: ((text: string) => void) | undefined
  onSend?: ((text: string) => void) | undefined
  onOpenInWorkspace?: (() => void) | undefined
  onClose?: (() => void) | undefined
}

export function DiscussionPanel({
  discussion,
  draft = '',
  entries = [],
  applied,
  onAct,
  onDraftChange,
  onSend,
  onOpenInWorkspace,
  onClose,
}: DiscussionPanelProps) {
  const empty = entries.length === 0
  return (
    <aside aria-label={discussion.title} className={panel} data-figma="discussion panel">
      <Inline gap="8" align="center" data-figma="header">
        <span className={bubble}>
          <BubbleIcon size="16" />
        </span>
        <h2 className={heading}>{discussion.title}</h2>
        {/* Two layers are named "button · Open in workspace"; this is the header's. */}
        <span data-figma={discussion.layers.header}>
          <Button onClick={onOpenInWorkspace}>
            <ChatIcon />
            {discussion.openInWorkspace}
          </Button>
        </span>
        <span data-figma="button · x">
          <Button size="sm" iconOnly aria-label="Close the discussion" onClick={onClose}>
            <CloseIcon />
          </Button>
        </span>
      </Inline>
      <Inline gap="8" align="center" className={hug} data-figma="model and context">
        <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
        <ContextMeter value={discussion.context} />
        <span className={meterLabel}>{discussion.contextLabel}</span>
      </Inline>
      <p className={guard} data-figma="guard">
        <span className={lock}>
          <LockIcon size="12" />
        </span>
        {discussion.guard}
      </p>
      <div className={cx(thread, empty ? middle : undefined)} data-figma="discussion">
        {empty ? (
          <DiscussionEmpty empty={discussion.empty} onPick={onDraftChange} />
        ) : (
          <Stack gap="12">
            {entries.map((entry, i) => (
              <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} applied={applied} onAct={onAct} />
            ))}
          </Stack>
        )}
      </div>
      <div data-figma="composer · discussion">
        <Composer
          label={discussion.placeholder}
          placeholder={discussion.placeholder}
          // With no one to keep the draft, the box keeps it (a story or a canvas board).
          {...(onDraftChange === undefined ? { defaultValue: draft } : { value: draft, onValueChange: onDraftChange })}
          onSubmit={(text) => {
            onSend?.(text)
          }}
        />
      </div>
    </aside>
  )
}
