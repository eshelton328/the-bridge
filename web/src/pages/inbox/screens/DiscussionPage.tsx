// A task's discussion on a tablet or phone (T17 to T23, M18 to M23): a
// page of its own, like a started task's chat (T5). Back returns to the
// task, the model and context sit in the middle of the row (in the task
// card on the phone, M18) and a Discussion pill at its end; the task card
// under it says what the discussion may do. The entries and the reply box
// fill the rest; Back stays at the top and the reply box at the bottom, and the task card and the entries scroll
// between them (d-107). Props only.
import {
  BackRow,
  ChevronRightIcon,
  Container,
  Inline,
  Panel,
  Stack,
  StatusPill,
  TruncatedText,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { DiscussionGuard } from '../blocks/DiscussionGuard.tsx'
import { DiscussionThread } from '../blocks/DiscussionThread.tsx'
import { ModelContext } from '../blocks/ModelContext.tsx'
import type { ProposalControl } from '../blocks/ProposalCard.tsx'
import type { InboxDiscussion, InboxDrafts, InboxNextStep } from '../types.ts'

// The page fills the detail's height and no more: Back stays at the top, the reply box at the bottom (d-107).
const fill = css({ flex: '1', minH: '[0]' })
const spacer = css({ flex: '1' })
// T17 402:11176: SemiBold 15, as the chat's task card (T5 346:6380).
const title = css({ textStyle: 'paneTitle', m: '0', flex: '1' })
// M18 402:1989: on the phone the title stays on one line, cut with an ellipsis.
const oneLine = css({ display: 'grid' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted' })
const chevron = css({ color: 'fg.muted', display: 'inline-flex' })
// T17 and M18 to M24 put the task card 8 under the nav (T17 402:11162 to 402:11174, M21 402:7184 to 402:7196).
// T18: the first entry 22 below the task card (402:11357 to 402:11425), 24 on the grid (d-072): the stack's 8 and 16.
const thread = css({ mt: '16' })

export type DiscussionPageProps = {
  discussion: InboxDiscussion
  /** The task under discussion: its title and status. */
  task: Pick<InboxNextStep, 'title' | 'status'>
  /** The task's place, such as "ncc-1701 · f-005 · NCC-28". */
  place: string
  layout: Viewport
  /** Back: the task page shows again. */
  onClose?: (() => void) | undefined
  control?: ProposalControl | undefined
  /** Keeps the reply Erik is typing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** Erik sent a message from the reply box. */
  onSend?: ((text: string) => void) | undefined
}

export function DiscussionPage({
  discussion,
  task,
  place,
  layout,
  onClose,
  control,
  drafts,
  onSend,
}: DiscussionPageProps) {
  const phone = layout === 'phone'
  return (
    <Container size={detailContainerSize(layout)} className={fill}>
      <DiscussionThread
        discussion={discussion}
        control={control}
        centred={false}
        className={thread}
        drafts={drafts}
        stacked={phone}
        onSend={onSend}
        gap="8"
        header={
          <Inline gap="8" align="center" data-figma="nav">
            <BackRow label="Task" backLabel="Back to the task" onBack={onClose} />
            <span className={spacer} />
            {phone ? null : (
              <>
                <ModelContext discussion={discussion} centred />
                <span className={spacer} />
              </>
            )}
            <StatusPill tone="running" label="Discussion" dot />
          </Inline>
        }
        before={
          <div data-figma="task · discussing">
            {/* Figma's task card (M18 and T17 task · discussing) pads 10 at the top and bottom and 12 at the sides: the
                notice Panel, not the section one (12 and 16). */}
            <Panel variant="notice">
              <Stack gap="4">
                <Inline gap="8" align="center">
                  <h1 className={phone ? cx(title, oneLine) : title}>
                    {phone ? <TruncatedText>{task.title}</TruncatedText> : task.title}
                  </h1>
                  <StatusPill tone={task.status.tone} label={task.status.label} dot />
                  <span className={chevron} data-figma="chevron · open task">
                    <ChevronRightIcon size="16" />
                  </span>
                </Inline>
                <span className={meta}>{place}</span>
                {phone ? <ModelContext discussion={discussion} /> : null}
                <DiscussionGuard text={discussion.guard} />
              </Stack>
            </Panel>
          </div>
        }
      />
    </Container>
  )
}
