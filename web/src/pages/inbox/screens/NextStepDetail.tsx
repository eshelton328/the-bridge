// The detail of a next step: why, the prompt, where to run it and the
// Start button (or, once started, the chat it runs in), Erik's notes and
// the sources. Props only.
import { Button, Container, Inline, MarkdownView, PlayIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailHead } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { NotesBox } from '../blocks/NotesBox.tsx'
import { PromptSection } from '../blocks/PromptSection.tsx'
import { RunCard } from '../blocks/RunCard.tsx'
import { RunInCard } from '../blocks/RunInCard.tsx'
import { SourceList } from '../blocks/SourceList.tsx'
import type { InboxNextStep, InboxUi } from '../types.ts'

const hint = css({ textStyle: 'small', color: 'fg.subtle' })

export type NextStepDetailProps = {
  detail: InboxNextStep
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'snoozeOpen' | 'promptOpen'>
  onPromptOpenChange?: ((open: boolean) => void) | undefined
}

function Launch({ launch, pickerOpen }: { launch: InboxNextStep['launch']; pickerOpen: boolean }) {
  if (launch.stage === 'started') return <RunCard run={launch.run} />
  return (
    <>
      <DetailSection title="Run in">
        <RunInCard runIn={launch.runIn} pickerOpen={pickerOpen} />
      </DetailSection>
      <Inline gap="12" align="center" data-figma="start">
        <Button variant="primary" size="lg">
          <PlayIcon />
          {launch.startLabel}
        </Button>
        <span className={hint}>{launch.startHint}</span>
      </Inline>
    </>
  )
}

export function NextStepDetail({ detail, ui, onPromptOpenChange }: NextStepDetailProps) {
  return (
    <Container size="detail">
      <Stack gap="24">
        <DetailHead head={detail} snoozeOpen={ui.snoozeOpen} />
        <DetailSection title="Why">
          <MarkdownView size="sm" padding="none">
            <p>{detail.why}</p>
          </MarkdownView>
        </DetailSection>
        <PromptSection
          prompt={detail.prompt}
          editing={ui.editingPrompt}
          open={ui.promptOpen}
          onOpenChange={onPromptOpenChange}
        />
        <Launch launch={detail.launch} pickerOpen={ui.pickerOpen} />
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
