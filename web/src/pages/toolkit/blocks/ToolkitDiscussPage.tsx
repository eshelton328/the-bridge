// An item's discussion on a tablet or phone (Figma T5 438:64, M7 435:556): a
// page of its own in the item's place, with no tab bar, as the Artifacts
// discussion's (T4 and M9 there). The nav has Back to the item, the model and
// context in the middle (on the tablet), the Discussion pill and Open in
// Workbench; the item's card under it returns to the item too. Then the
// empty state or the messages, and the reply box. The nav and the card stay at
// the top and the reply box at the bottom, and only the messages between them
// scroll (d-107): the shared DetailFrame, with the reply box as its sticky
// footer, whose long draft the Composer caps at 30% of the page. On the phone
// the model and context sit in the card under its meta line, the button says
// only Workbench and the suggestions stack under "Try". Props only.
import { BackRow, Inline, Stack, StatusPill } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { ToolkitDiscussEntry as Entry, ToolkitDiscussion } from '../types.ts'
import { ToolkitDiscussCard } from './ToolkitDiscussCard.tsx'
import { ToolkitDiscussComposer } from './ToolkitDiscussComposer.tsx'
import { ToolkitDiscussEmpty } from './ToolkitDiscussEmpty.tsx'
import { ToolkitDiscussEntry } from './ToolkitDiscussEntry.tsx'
import { ToolkitDiscussModel } from './ToolkitDiscussModel.tsx'
import { ToolkitOpenInWorkbench } from './ToolkitOpenInWorkbench.tsx'

// The page fills the detail's height and no more, so only the messages scroll; the Composer caps a long draft at 30%
// of the page's height (cqh).
const page = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]', containerType: 'size' })
// T5 464:305: the nav is 30 high, 4 under the status bar, and the card 8 under it (464:334). The Container pads 12 at
// the top; the nav takes 8 of it back. M7 464:141: on the phone the nav is 4 under the status bar, the phone
// Container's 4 at the top.
// The nav's 32 px Back row is 2 taller than Figma's nav, so it takes 6 back and the row's middle stays at Figma's.
const navs = { tablet: css({ mt: '-6' }), phone: undefined }
const spacer = css({ flex: '1' })
// T5 464:349: the discussion area starts 8 under the card, and the empty state 14 under its top (12 on the grid).
const threads = {
  // The nav sits 2 lower than Figma's (its Back row is 2 taller), so the area starts 6 under the card.
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', mt: '6', pt: '12' }),
  // M7 464:184: on the phone the card is 8 taller than Figma's (the model chip and the guard's 16 px lines), so the
  // area starts 4 under it and the empty state, "It can" and the suggestions keep Figma's places (within 4 px).
  phone: css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', mt: '4', pt: '12' }),
}
// T5 464:350: the empty state's tile is 60 under its top and its text ends 8 over its foot. The library's tile (44
// against 42) and title (28 high against 22) are 8 taller than Figma's, so the tile sits 52 under the top (20 and 32)
// and the text, "It can" and the suggestions keep Figma's places. M7 464:185: on the phone the tile is 28 under the
// top: 20.
const emptyPads = { tablet: css({ pt: '20', pb: '8' }), phone: css({ pt: '20', pb: '8' }) }
const emptyInner = { tablet: css({ pt: '32' }), phone: undefined }
// T5 464:379: the reply box 22 in, as the page (24), and 22 above the home indicator's 21 (43, 40 on the grid). It
// stays on the page's canvas, so the messages that scroll under it do not show through.
// M7 464:214: on the phone the reply box is 12 in, as the page, and ends 22 above the home indicator's 21. With no tab
// bar the phone AppShell keeps the home indicator's 34 (`shell.safeAreaBottom`) under the page, so the footer pads 8.
const footers = {
  tablet: css({
    position: 'sticky',
    bottom: '[var(--scroll-frame-inset, 0px)]',
    pt: '12',
    pb: '40',
    px: '24',
    bg: 'bg.canvas',
  }),
  phone: css({
    position: 'sticky',
    bottom: '[var(--scroll-frame-inset, 0px)]',
    pt: '8',
    pb: '8',
    px: '12',
    bg: 'bg.canvas',
  }),
}

export type ToolkitDiscussPageProps = {
  layout: 'tablet' | 'phone'
  discussion: ToolkitDiscussion
  /** The item under discussion: its name and its kind's label, such as "Skill". */
  item: { name: string; kind: string }
  entries: readonly Entry[]
  draft: string
  onDraftChange: (text: string) => void
  onSend: (text: string) => void
  onCopy?: ((text: string) => void) | undefined
  /** Back or the item's card: the item shows again. */
  onBack?: (() => void) | undefined
}

export function ToolkitDiscussPage({
  layout,
  discussion,
  item,
  entries,
  draft,
  onDraftChange,
  onSend,
  onCopy,
  onBack,
}: ToolkitDiscussPageProps) {
  const phone = layout === 'phone'
  const model = <ToolkitDiscussModel discussion={discussion} />
  return (
    <div className={page}>
      <DetailFrame
        layout={layout}
        back={
          <Stack gap="8">
            <Inline gap="8" align="center" className={navs[layout]} data-figma="nav">
              <BackRow label={item.name} backLabel={`Back to ${item.name}`} onBack={onBack} />
              <span className={spacer} />
              {phone ? null : (
                <>
                  {model}
                  <span className={spacer} />
                </>
              )}
              <span data-figma={`pill · ${discussion.badge}`}>
                <StatusPill tone="running" label={discussion.badge} dot />
              </span>
              <ToolkitOpenInWorkbench label={discussion.openInWorkbench} size="xs" textSize="xs" />
            </Inline>
            <ToolkitDiscussCard
              name={item.name}
              kind={item.kind}
              meta={discussion.card.meta}
              guard={discussion.card.guard}
              model={phone ? model : undefined}
              onOpen={onBack}
            />
          </Stack>
        }
        footer={
          <div className={footers[layout]}>
            <ToolkitDiscussComposer
              discussion={discussion}
              layer="composer · discussion"
              draft={draft}
              onDraftChange={onDraftChange}
              onSend={onSend}
            />
          </div>
        }
      >
        <div className={threads[layout]} data-figma="discussion">
          {entries.length === 0 ? (
            <ToolkitDiscussEmpty
              empty={discussion.empty}
              layout={layout}
              onPick={onDraftChange}
              pad={{ outer: emptyPads[layout], inner: emptyInner[layout] }}
            />
          ) : (
            <Stack gap="12">
              {entries.map((entry, i) => (
                <ToolkitDiscussEntry key={`${String(i)}:${entry.type}`} entry={entry} onCopy={onCopy} />
              ))}
            </Stack>
          )}
        </div>
      </DetailFrame>
    </div>
  )
}
