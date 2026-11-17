// The detail of a next step: why, the prompt, where to run it and the
// Start button (or, once started, the chat it runs in), Erik's notes and
// the sources. On a tablet or phone the item sits under Back, and a started
// next step's run card stays at the bottom of the screen, above the tab bar
// (T4 346:6281). Props only.
import { Button, Container, Inline, MarkdownView, PlayIcon, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { detailContainerSize } from '../../../lib/containerSize.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { DetailHead, type SnoozeControl } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { NotesBox } from '../blocks/NotesBox.tsx'
import { PromptSection } from '../blocks/PromptSection.tsx'
import { RunCard } from '../blocks/RunCard.tsx'
import { RunInCard } from '../blocks/RunInCard.tsx'
import { SourceList } from '../blocks/SourceList.tsx'
import { type InboxDrafts, type InboxNextStep, type InboxUi } from '../types.ts'

const hint = css({ textStyle: 'small', color: 'fg.subtle' })
const fill = css({ flex: '1' })
// T4 346:6281: the run card 11 below the bar's top edge and 10 above the tab bar, 22 in (24, d-072), on the chrome.
const footer = css({
  position: 'sticky',
  bottom: '0',
  pt: '10',
  pb: '10',
  px: '24',
  bg: 'surface.chrome',
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
})

export type NextStepDetailProps = {
  detail: InboxNextStep
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'promptOpen'>
  /** The screen's layout. */
  layout?: Viewport | undefined
  /** Back, over the item on a tablet or phone. */
  back?: ReactNode
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** The task has a discussion; see `DetailHead`. */
  discuss?: { open: boolean } | undefined
  /** Keeps what Erik types in the prompt and his note; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** The Snooze menu of the task bar. */
  snooze?: SnoozeControl | undefined
  /** Reports the prompt editor or the Run in picker opened or closed. */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
}

type LaunchProps = {
  launch: InboxNextStep['launch']
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
}

function Launch({ launch, pickerOpen, onPickerOpenChange }: LaunchProps) {
  if (launch.stage === 'started') return <RunCard run={launch.run} />
  return (
    <>
      <DetailSection title="Run in">
        <RunInCard runIn={launch.runIn} pickerOpen={pickerOpen} onPickerOpenChange={onPickerOpenChange} />
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

export function NextStepDetail({
  detail,
  ui,
  layout = 'desktop',
  back,
  onPromptOpenChange,
  discuss,
  drafts,
  snooze,
  onUiChange,
}: NextStepDetailProps) {
  const compact = layout !== 'desktop'
  const pinned = compact && detail.launch.stage === 'started' ? detail.launch.run : undefined
  const column = (
    <Container size={detailContainerSize(layout)} className={pinned === undefined ? undefined : fill}>
      {back}
      <Stack gap="24" data-figma={compact ? `task · ${pinned === undefined ? 'next step' : 'running'}` : undefined}>
        <DetailHead head={detail} snooze={snooze} discuss={discuss} />
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
          layout={layout}
          drafts={drafts}
          onEditingChange={(editingPrompt) => {
            onUiChange?.({ editingPrompt })
          }}
        />
        {pinned === undefined ? (
          <Launch
            launch={detail.launch}
            pickerOpen={ui.pickerOpen}
            onPickerOpenChange={(pickerOpen) => {
              onUiChange?.({ pickerOpen })
            }}
          />
        ) : null}
        {detail.notes === null ? null : (
          <DetailSection title="My notes">
            <NotesBox notes={detail.notes} drafts={drafts} />
          </DetailSection>
        )}
        <DetailSection title="Sources">
          <SourceList sources={detail.sources} />
        </DetailSection>
      </Stack>
    </Container>
  )
  if (pinned === undefined) return column
  return (
    <>
      {column}
      <div className={footer} data-figma="running">
        <RunCard run={pinned} />
      </div>
    </>
  )
}
