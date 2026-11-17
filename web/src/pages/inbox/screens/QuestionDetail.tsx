// The detail of a question from a chat: the chat it blocks, the context,
// the options with the recommended one first, a note and the answer
// button. On a tablet or phone it sits under Back (T3). Props only.
import {
  Badge,
  Button,
  Container,
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
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { DetailHead, type SnoozeControl } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { draftProps, type InboxDrafts, type InboxQuestion } from '../types.ts'

const grow = css({ flex: '1' })
const waitTitle = css({ textStyle: 'label' })
const mono = css({ textStyle: 'monoSm', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })

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
  return (
    <Container size={detailContainerSize(layout)}>
      {back}
      <Stack gap="24" data-figma={layout === 'desktop' ? undefined : 'task · question'}>
        <DetailHead head={detail} snooze={snooze} />
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
              <Button size="sm">
                <ExternalLinkIcon />
                Open chat
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
              badge: o.recommended ? <Badge variant="pill" tone="working" label="Recommended" /> : undefined,
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
        <Inline gap="12" align="center" data-figma="answer">
          <Button variant="primary" size="lg">
            <PlayIcon />
            {detail.answerLabel}
          </Button>
          <span className={hint}>{detail.answerHint}</span>
        </Inline>
      </Stack>
    </Container>
  )
}
