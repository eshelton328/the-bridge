// A task's discussion on a tablet or phone (T17 to T23): a page of its
// own, like a started task's chat (T5). Back returns to the task, the
// model and context sit in the middle of the row and a Discussion pill at
// its end; the task card under it says what the
// discussion may do. The entries and the reply box fill the rest. Props
// only.
import {
  BackRow,
  ChevronRightIcon,
  Container,
  Inline,
  Panel,
  Stack,
  StatusPill,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { DiscussionGuard } from '../blocks/DiscussionGuard.tsx'
import { DiscussionThread } from '../blocks/DiscussionThread.tsx'
import { ModelContext } from '../blocks/ModelContext.tsx'
import type { ProposalControl } from '../blocks/ProposalCard.tsx'
import type { InboxDiscussion, InboxDrafts, InboxNextStep } from '../types.ts'

const fill = css({ flex: '1' })
const spacer = css({ flex: '1' })
// T17 402:11176: SemiBold 15, as the chat's task card (T5 346:6380).
const title = css({ textStyle: 'paneTitle', m: '0', flex: '1' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted' })
const chevron = css({ color: 'fg.muted', display: 'inline-flex' })
// T18: the first entry 22 below the task card (402:11357 to 402:11425), 24 on the grid (d-072): the stack's 16 and 8.
const thread = css({ mt: '8' })

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
}

export function DiscussionPage({ discussion, task, place, layout, onClose, control, drafts }: DiscussionPageProps) {
  return (
    <Container size={detailContainerSize(layout)} className={fill}>
      <Stack gap="16" className={fill}>
        <Inline gap="8" align="center" data-figma="nav">
          <BackRow label="Task" backLabel="Back to the task" onBack={onClose} />
          <span className={spacer} />
          <ModelContext discussion={discussion} centred />
          <span className={spacer} />
          <StatusPill tone="running" label="Discussion" dot />
        </Inline>
        <div data-figma="task · discussing">
          <Panel>
            <Stack gap="4">
              <Inline gap="8" align="center">
                <h1 className={title}>{task.title}</h1>
                <StatusPill tone={task.status.tone} label={task.status.label} dot />
                <span className={chevron} data-figma="chevron · open task">
                  <ChevronRightIcon size="16" />
                </span>
              </Inline>
              <span className={meta}>{place}</span>
              <DiscussionGuard text={discussion.guard} />
            </Stack>
          </Panel>
        </div>
        <DiscussionThread
          discussion={discussion}
          control={control}
          centred={false}
          className={thread}
          drafts={drafts}
        />
      </Stack>
    </Container>
  )
}
