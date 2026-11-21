// The detail of a next step: why, the prompt, where to run it and the
// Start button (or, once started, the chat it runs in), the owner's notes and
// the sources. On a tablet or phone the item sits under Back, and a started
// next step's run card stays at the bottom of the screen, above the tab bar
// (T4 346:6281); on the phone Start does too (M2 346:9386). While the owner edits
// the prompt on the phone, the keyboard covers the bottom of the screen: the
// head and Why give way to the title on one line, so the prompt stays in
// sight, and Start waits (M3). Props only.
import { Button, Inline, MarkdownView, PlayIcon, Stack, TruncatedText } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { type DiscussControl, DetailHead, type SnoozeControl } from '../blocks/DetailHead.tsx'
import { DetailSection } from '../blocks/DetailSection.tsx'
import { NotesBox } from '../blocks/NotesBox.tsx'
import { PinnedAction } from '../blocks/PinnedAction.tsx'
import { PromptSection } from '../blocks/PromptSection.tsx'
import { RunCard } from '../blocks/RunCard.tsx'
import { RunInCard } from '../blocks/RunInCard.tsx'
import { SourceList } from '../blocks/SourceList.tsx'
import { type InboxDrafts, type InboxNextStep, type InboxUi } from '../types.ts'

const hint = css({ textStyle: 'small', color: 'fg.subtle' })
// M2 346:9246, M5 346:9866: the phone's task frame insets its content 4 at the sides, 8 at the top and 28 at the bottom
// (28 takes 32, d-072). Its sections
// are 18 apart (M2 to M5), which takes 20 (d-072: a tie takes the larger token); the tablet's 22 takes 24.
const phoneTask = css({ px: '4', pt: '8', pb: '32' })
// T2 346:5683, T3 346:5911, T4 346:6144: the tablet's task frame pads its content 6 at the top and 28 at the bottom (Auto
// Layout, hug). 28 has no spacing token; it is halfway between 24 and 32, so it takes 32 (d-072: a tie takes the larger).
const tabletTask = css({ pt: '6', pb: '32' })
// M3 346:9434: the title on one line, cut with an ellipsis, over the prompt.
const scrolledTitle = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0', display: 'grid' })
// T4 346:6281: the run card 11 below the bar's top edge and 10 above the tab bar, 22 in (24, d-072), on the chrome.
// It sticks the ScrollFrame's inset above the bottom, so it stays above the tab bar that lies over the page.
const footer = css({
  position: 'sticky',
  bottom: '[var(--scroll-frame-inset, 0px)]',
  pt: '10',
  pb: '10',
  // Opaque, as PinnedAction: the chrome over the canvas, so the page that scrolls under it does not show through.
  bg: 'bg.canvas',
  backgroundImage: 'linear-gradient(token(colors.surface.chrome), token(colors.surface.chrome))',
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
})
// T4: 22 in on the tablet (24, d-072); M10 346:11086: 12 in on the phone.
const footerInset = { desktop: css({ px: '24' }), tablet: css({ px: '24' }), phone: css({ px: '12' }) } as const

export type NextStepDetailProps = {
  detail: InboxNextStep
  ui: Pick<InboxUi, 'editingPrompt' | 'pickerOpen' | 'promptOpen'>
  /** The screen's layout. */
  layout?: Viewport | undefined
  /** Back, over the item on a tablet or phone. */
  back?: ReactNode
  onPromptOpenChange?: ((open: boolean) => void) | undefined
  /** Copy in the whole prompt's dialog or sheet, with the prompt's text; the page entry copies it. */
  onCopyPrompt?: ((text: string) => void) | undefined
  /** The task has a discussion; see `DetailHead`. */
  discuss?: DiscussControl | undefined
  /** Undo on the line under a prompt that a discussion changed. */
  onUndoChange?: (() => void) | undefined
  /** Keeps what the owner types in the prompt and his note; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** The Snooze menu of the task bar. */
  snooze?: SnoozeControl | undefined
  /** Reports the prompt editor or the Run in picker opened or closed. */
  onUiChange?: ((change: Partial<InboxUi>) => void) | undefined
  /** A task removed in its discussion: its card's Open discussion and Restore. */
  removed?: RemovedControl | undefined
  /** Start: the task starts and shows its run card (`startView`). */
  onStart?: (() => void) | undefined
}

/** A removed task's card: Open discussion opens its discussion, Restore puts the task back. */
export type RemovedControl = { onOpenDiscussion: () => void; onRestore: () => void }

type LaunchProps = {
  launch: InboxNextStep['launch']
  onOpenChat: (() => void) | undefined
  onRestore: (() => void) | undefined
  onStart: (() => void) | undefined
  pickerOpen: boolean
  onPickerOpenChange: (open: boolean) => void
  layout: Viewport
}

function Launch({ launch, onOpenChat, onRestore, onStart, pickerOpen, onPickerOpenChange, layout }: LaunchProps) {
  if (launch.stage === 'started') return <RunCard run={launch.run} onOpen={onOpenChat} onRestore={onRestore} />
  return (
    <>
      <DetailSection title="Run in">
        <RunInCard
          runIn={launch.runIn}
          pickerOpen={pickerOpen}
          onPickerOpenChange={onPickerOpenChange}
          layout={layout}
        />
      </DetailSection>
      {/* The phone pins Start above the tab bar (PinnedAction). */}
      {layout === 'phone' ? null : (
        <Inline gap="12" align="center" data-figma="start">
          <Button variant="primary" size="lg" textSize="smStrong" onClick={onStart}>
            <PlayIcon />
            {launch.startLabel}
          </Button>
          <span className={hint}>{launch.startHint}</span>
        </Inline>
      )}
    </>
  )
}

export function NextStepDetail({
  detail,
  ui,
  layout = 'desktop',
  back,
  onPromptOpenChange,
  onCopyPrompt,
  discuss,
  drafts,
  snooze,
  onUiChange,
  onUndoChange,
  removed,
  onStart,
}: NextStepDetailProps) {
  const compact = layout !== 'desktop'
  const phone = layout === 'phone'
  // On the phone the keyboard of the prompt editor covers the bottom of the screen (M3).
  const keyboard = phone && ui.editingPrompt
  const pinned = compact && detail.launch.stage === 'started' ? detail.launch.run : undefined
  const start = phone && !keyboard && detail.launch.stage === 'suggested' ? detail.launch.startLabel : undefined
  // Reply here opens the chat in the inbox, when the state has it; a removed task's card opens its discussion.
  const onOpenChat =
    removed?.onOpenDiscussion ??
    (detail.launch.stage === 'started' && detail.launch.run.chat !== undefined
      ? () => {
          onUiChange?.({ chatOpen: true })
        }
      : undefined)
  const onRestore = removed?.onRestore
  const item = (
    <Stack
      gap={phone ? '20' : '24'}
      className={phone ? phoneTask : compact ? tabletTask : undefined}
      // The tablet names a started task's frame "task · running" (T4); the phone keeps "task · next step" (M10).
      data-figma={compact ? `task · ${pinned === undefined || phone ? 'next step' : 'running'}` : undefined}
    >
      {keyboard ? (
        <h1 className={scrolledTitle} data-figma="scrolled title">
          <TruncatedText>{detail.title}</TruncatedText>
        </h1>
      ) : (
        <>
          <DetailHead head={detail} snooze={snooze} discuss={discuss} barActions={!phone} />
          <DetailSection title="Why">
            {/* A rich block: when it fails to render, only it shows the error (d-084, audit P-6). */}
            <BlockBoundary contentKey={detail.id}>
              <MarkdownView size="sm" padding="none">
                <p>{detail.why}</p>
              </MarkdownView>
            </BlockBoundary>
          </DetailSection>
        </>
      )}
      <PromptSection
        prompt={detail.prompt}
        editing={ui.editingPrompt}
        open={ui.promptOpen}
        onOpenChange={onPromptOpenChange}
        layout={layout}
        drafts={drafts}
        onUndoChange={onUndoChange}
        onCopyPrompt={onCopyPrompt}
        onEditingChange={(editingPrompt) => {
          onUiChange?.({ editingPrompt })
        }}
      />
      {pinned === undefined ? (
        <Launch
          launch={detail.launch}
          onOpenChat={onOpenChat}
          onRestore={onRestore}
          onStart={onStart}
          pickerOpen={ui.pickerOpen}
          onPickerOpenChange={(pickerOpen) => {
            onUiChange?.({ pickerOpen })
          }}
          layout={layout}
        />
      ) : null}
      {detail.notes === null || keyboard ? null : (
        <DetailSection title="My notes">
          <NotesBox notes={detail.notes} drafts={drafts} />
        </DetailSection>
      )}
      <DetailSection title="Sources">
        <SourceList sources={detail.sources} />
      </DetailSection>
    </Stack>
  )
  const footerBar =
    start !== undefined ? (
      <PinnedAction label={start} onPress={onStart} />
    ) : pinned === undefined ? undefined : (
      <div className={cx(footer, footerInset[layout])} data-figma="running">
        <RunCard run={pinned} onOpen={onOpenChat} onRestore={onRestore} />
      </div>
    )
  return (
    <DetailFrame layout={layout} back={back} footer={footerBar}>
      {item}
    </DetailFrame>
  )
}
