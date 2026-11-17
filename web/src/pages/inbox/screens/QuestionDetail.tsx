// The detail of a question from a chat: the chat it blocks, the context,
// the options with the recommended one first, a note and the answer
// button. Props only.
import {
  Badge,
  Button,
  Container,
  ExternalLinkIcon,
  Inline,
  KindMark,
  OptionList,
  Panel,
  PlayIcon,
  Stack,
  TextArea,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailHead } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import type { InboxQuestion } from '../types.ts'

const grow = css({ flex: '1' })
const waitTitle = css({ textStyle: 'label' })
const mono = css({ textStyle: 'mono', color: 'fg.muted' })
const context = css({ textStyle: 'body', color: 'fg.muted', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })

export function QuestionDetail({ detail }: { detail: InboxQuestion }) {
  return (
    <Container size="detail">
      <Stack gap="24">
        <DetailHead head={detail} />
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
          <p className={context}>{detail.context}</p>
        </DetailSection>
        <DetailSection title="Choose one">
          <OptionList
            label="Choose one"
            variant="card"
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
          <TextArea labelHidden label={detail.noteLabel} defaultValue={detail.note} rows={1} />
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
