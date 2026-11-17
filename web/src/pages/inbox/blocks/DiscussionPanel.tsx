// A task's discussion, beside the task: the header with Close, the model
// and how much context it uses, what it may do, the entries (or, before
// the first message, the empty state) and the reply box. Props only.
import {
  BubbleIcon,
  Button,
  CloseIcon,
  Composer,
  ContextMeter,
  Inline,
  LockIcon,
  ModelChip,
  Stack,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { InboxDiscussion } from '../types.ts'
import { DiscussionEmpty } from './DiscussionEmpty.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'

// Figma's panel (403:947) is 628 wide: what is left of the pane beside an 820 px task. The task here is
// Container size="detail" (748 + 2 × 40), so the panel starts 8 px further right; its 12 px start padding
// keeps the content at Figma's x (LIBRARY_GAPS.md: no width token for the panel).
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12',
  flex: '1',
  // A flex item keeps its content's width unless it clips.
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
const muted = css({ textStyle: 'monoSm', color: 'fg.muted' })
const hug = css({ alignSelf: 'flex-start' })
const guard = css({ display: 'flex', gap: '6', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const lock = css({ display: 'inline-flex', flexShrink: '0', pt: '2' })
const entries = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', pt: '6' })
const centred = css({ justifyContent: 'center' })

export type DiscussionPanelProps = {
  discussion: InboxDiscussion
  /** Remove… was pressed in a proposed removal. */
  onRemove?: (() => void) | undefined
}

export function DiscussionPanel({ discussion, onRemove }: DiscussionPanelProps) {
  const empty = discussion.entries.length === 0 ? discussion.empty : undefined
  return (
    <aside aria-label={discussion.title} className={panel} data-figma="discussion panel">
      <Inline gap="8" align="center">
        <span className={bubble}>
          <BubbleIcon size="16" />
        </span>
        <h2 className={heading}>{discussion.title}</h2>
        <Button size="sm" iconOnly aria-label="Close the discussion">
          <CloseIcon />
        </Button>
      </Inline>
      <Inline gap="8" align="center" className={hug} data-figma="model and context">
        <ModelChip model={discussion.model} options={[{ value: discussion.model, label: discussion.model }]} />
        <ContextMeter value={discussion.context} />
        <span className={muted}>{discussion.contextLabel}</span>
      </Inline>
      <p className={guard} data-figma="guard">
        <span className={lock}>
          <LockIcon size="12" />
        </span>
        {discussion.guard}
      </p>
      <div className={cx(entries, empty === undefined ? undefined : centred)} data-figma="discussion">
        {empty === undefined ? null : <DiscussionEmpty empty={empty} />}
        <Stack gap="12">
          {discussion.entries.map((entry, i) => (
            <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} onRemove={onRemove} />
          ))}
        </Stack>
      </div>
      <div data-figma="composer · discussion">
        <Composer label={discussion.placeholder} placeholder={discussion.placeholder} onAttach={() => undefined} />
      </div>
    </aside>
  )
}
