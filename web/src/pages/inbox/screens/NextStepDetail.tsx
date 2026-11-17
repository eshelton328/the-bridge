// The detail of a next step: why, the suggested prompt, where to run it and
// the Start button, Erik's notes and the sources. Props only.
import { Button, Container, Inline, PlayIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailHead } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { NotesBox } from '../blocks/NotesBox.tsx'
import { PromptSection } from '../blocks/PromptSection.tsx'
import { RunInCard } from '../blocks/RunInCard.tsx'
import { SourceList } from '../blocks/SourceList.tsx'
import type { InboxNextStep, InboxUi } from '../types.ts'

const why = css({ textStyle: 'body', color: 'fg.muted', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })

export type NextStepDetailProps = {
  detail: InboxNextStep
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen'>
}

export function NextStepDetail({ detail, ui }: NextStepDetailProps) {
  return (
    <Container size="detail">
      <Stack gap="24">
        <DetailHead head={detail} />
        <DetailSection title="Why">
          <p className={why}>{detail.why}</p>
        </DetailSection>
        <PromptSection prompt={detail.prompt} editing={ui.editingPrompt} />
        <DetailSection title="Run in">
          <RunInCard runIn={detail.runIn} pickerOpen={ui.pickerOpen} />
        </DetailSection>
        <Inline gap="12" align="center" data-figma="start">
          <Button variant="primary" size="lg">
            <PlayIcon />
            {detail.startLabel}
          </Button>
          <span className={hint}>{detail.startHint}</span>
        </Inline>
        {detail.notes === null ? null : (
          <DetailSection title="My notes">
            <NotesBox notes={detail.notes} />
          </DetailSection>
        )}
        <DetailSection title="Sources">
          <SourceList sources={detail.sources} />
        </DetailSection>
      </Stack>
    </Container>
  )
}
