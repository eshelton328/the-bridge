// The detail of a question from a chat: the chat it blocks, the context,
// the options with the recommended one first, a note and the answer
// button. On a tablet or phone it sits under Back (T3); on the phone the
// answer button is pinned above the tab bar, without its hint, and the
// blocked chat's button says Open (M5). Props only.
import {
  Badge,
  Button,
  ExternalLinkIcon,
  Inline,
  KindMark,
  MarkdownView,
  OptionList,
  Panel,
  PlayIcon,
  Stack,
  TextArea,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { DetailHead, type SnoozeControl } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { PinnedAction } from '../blocks/PinnedAction.tsx'
import { draftProps, type InboxDrafts, type InboxQuestion } from '../types.ts'

const grow = css({ flex: '1' })
const waitTitle = css({ textStyle: 'label' })
const mono = css({ textStyle: 'monoSm', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
// M2 346:9246, M5 346:9866: the phone's task frame insets its content 4 at the sides and 8 at the top. Its sections
// are 18 apart (M2 to M5), which takes 20 (d-072: a tie takes the larger token); the tablet's 22 takes 24.
const phoneTask = css({ px: '4', pt: '8' })

export type QuestionDetailProps = {
  detail: InboxQuestion
  /** The screen's layout. */
  layout?: Viewport | undefined
  /** Back, over the item on a tablet or phone. */
  back?: ReactNode
  /** Keeps the note Erik is typing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** The Snooze menu of the task bar. */
  snooze?: SnoozeControl | undefined
}

export function QuestionDetail({ detail, layout = 'desktop', back, drafts, snooze }: QuestionDetailProps) {
  const phone = layout === 'phone'
  const item = (
    <Stack
      gap={phone ? '20' : '24'}
      className={phone ? phoneTask : undefined}
      data-figma={layout === 'desktop' ? undefined : 'task · question'}
    >
      <DetailHead head={detail} snooze={snooze} barActions={!phone} />
      <div data-figma="blocking">
        <Panel tone="needsYou">
          <Inline gap="10" align="center">
            <KindMark kind={detail.waiting.agent} size="16" />
            <div className={grow}>
              <Stack gap="2">
                <span className={waitTitle}>{detail.waiting.title}</span>
                <span className={mono}>{detail.waiting.detail}</span>
              </Stack>
            </div>
            <Button size="sm" textSize="xs">
              <ExternalLinkIcon />
              {phone ? 'Open' : 'Open chat'}
            </Button>
          </Inline>
        </Panel>
      </div>
      <DetailSection title="Context">
        <MarkdownView size="sm" padding="none">
          <p>{detail.context}</p>
        </MarkdownView>
      </DetailSection>
      <DetailSection title="Choose one">
        <OptionList
          label="Choose one"
          variant="card"
          size="sm"
          value={detail.selected}
          items={detail.options.map((o) => ({
            value: o.value,
            label: o.label,
            description: o.description,
            badge: o.recommended ? <Badge variant="pill" size="sm" tone="working" label="Recommended" /> : undefined,
          }))}
        />
      </DetailSection>
      <DetailSection title={detail.noteLabel}>
        <TextArea
          labelHidden
          label={detail.noteLabel}
          textSize="sm"
          autoresize
          rows={1}
          {...draftProps(drafts, 'answer', detail.note)}
        />
      </DetailSection>
      {phone ? null : (
        <Inline gap="12" align="center" data-figma="answer">
          <Button variant="primary" size="lg">
            <PlayIcon />
            {detail.answerLabel}
          </Button>
          <span className={hint}>{detail.answerHint}</span>
        </Inline>
      )}
    </Stack>
  )
  return (
    <DetailFrame layout={layout} back={back} footer={phone ? <PinnedAction label={detail.answerLabel} /> : undefined}>
      {item}
    </DetailFrame>
  )
}
