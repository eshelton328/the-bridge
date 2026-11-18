// An item's discussion beside it on the desktop (Figma `side panel · Discuss
// writer`, D5 438:2): `ToolkitDiscussHeader`, the messages (or, before the
// first, the empty state) and the reply box, in the AppShell's 420 px side
// slot. Built from the same library parts as the Artifacts discussion panel
// (D7 there). The header stays at the top and the reply box at the bottom;
// only the messages between them scroll (d-107, ScrollFrame). Props only.
import { ScrollFrame, Stack } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitDiscussEntry as Entry, ToolkitDiscussion } from '../types.ts'
import { ToolkitDiscussComposer } from './ToolkitDiscussComposer.tsx'
import { ToolkitDiscussEmpty } from './ToolkitDiscussEmpty.tsx'
import { ToolkitDiscussEntry } from './ToolkitDiscussEntry.tsx'
import { ToolkitDiscussHeader } from './ToolkitDiscussHeader.tsx'

// 438:2: 420 wide, its content 21 in from the sides and 19 from the top and the foot (20 on the grid).
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  // The panel fills the side slot's height and no more, so its ScrollFrame scrolls the messages (d-107).
  minH: '[0]',
  // The Composer caps a long draft at 30% of its size container (cqh): here the panel's own height.
  containerType: 'size',
  overflow: 'hidden',
  p: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const bodyGap = css({ gap: '12' })
const thread = css({ display: 'flex', flexDirection: 'column', flex: '1' })
// With no messages the empty state sits in the middle of the area, as the Artifacts panel's.
const middle = css({ justifyContent: 'center' })

export type ToolkitDiscussPanelProps = {
  discussion: ToolkitDiscussion
  itemName: string
  entries: readonly Entry[]
  draft: string
  onDraftChange: (text: string) => void
  onSend: (text: string) => void
  onCopy?: ((text: string) => void) | undefined
  onClose?: (() => void) | undefined
}

export function ToolkitDiscussPanel({
  discussion,
  itemName,
  entries,
  draft,
  onDraftChange,
  onSend,
  onCopy,
  onClose,
}: ToolkitDiscussPanelProps) {
  const empty = entries.length === 0
  return (
    <aside
      aria-label={`${discussion.title} ${itemName}`}
      className={panel}
      data-figma={`side panel · Discuss ${itemName}`}
    >
      <ScrollFrame
        gap="12"
        bodyClassName={bodyGap}
        header={<ToolkitDiscussHeader discussion={discussion} itemName={itemName} onClose={onClose} />}
        footer={
          <ToolkitDiscussComposer
            discussion={discussion}
            layer="composer"
            model
            draft={draft}
            onDraftChange={onDraftChange}
            onSend={onSend}
          />
        }
      >
        <div className={cx(thread, empty ? middle : undefined)}>
          {empty ? (
            <ToolkitDiscussEmpty empty={discussion.empty} layout="tablet" onPick={onDraftChange} />
          ) : (
            <Stack gap="12">
              {entries.map((entry, i) => (
                <ToolkitDiscussEntry key={`${String(i)}:${entry.type}`} entry={entry} onCopy={onCopy} />
              ))}
            </Stack>
          )}
        </div>
      </ScrollFrame>
    </aside>
  )
}
