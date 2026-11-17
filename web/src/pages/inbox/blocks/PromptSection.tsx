// The prompt of a next step: suggested and read-only with Reset and Edit,
// or in its editor with Reset and Done, an "Edited" pill once changed and a
// hint under it. A sent prompt, or one removed before it ran, has no
// buttons. A long prompt ends with "Read the whole prompt", which opens it
// in a dialog; a prompt a discussion changed has a line with Undo beside
// it. Props only.
import {
  Badge,
  Button,
  CheckIcon,
  ChevronRightIcon,
  Clamp,
  EditIcon,
  Inline,
  Panel,
  ResetIcon,
  Stack,
  TextArea,
  UndoIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'
import { DetailSection } from './DetailSection.tsx'
import { PromptDialog } from './PromptDialog.tsx'

const text = css({ textStyle: 'bodySm', color: 'fg.default' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
const change = css({ display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'monoSm', color: 'fg.muted' })
const undo = css({ textStyle: 'label', color: 'fg.accent', textDecoration: 'none' })
const titles = { suggested: 'Suggested prompt', sent: 'Sent prompt', notRun: 'Prompt · not run' } as const
const more = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4',
  alignSelf: 'flex-start',
  textStyle: 'label',
  color: 'fg.accent',
  textDecoration: 'none',
})

export type PromptSectionProps = {
  prompt: InboxNextStep['prompt']
  editing: boolean
  /** The whole prompt is open in its dialog. */
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function PromptSection({ prompt, editing, open, onOpenChange }: PromptSectionProps) {
  const readMore = prompt.long ? (
    <a className={more} href="#prompt">
      Read the whole prompt
      <ChevronRightIcon size="12" />
    </a>
  ) : null
  return (
    <DetailSection
      title={titles[prompt.state]}
      figma="section · SUGGESTED PROMPT"
      meta={prompt.edited ? <Badge variant="pill" tone="needsYou" label="Edited" /> : undefined}
      actions={
        prompt.state !== 'suggested' ? undefined : (
          <>
            <Button size="sm">
              <ResetIcon />
              Reset
            </Button>
            <Button size="sm">
              {editing ? <CheckIcon /> : <EditIcon />}
              {editing ? 'Done' : 'Edit'}
            </Button>
          </>
        )
      }
    >
      {editing ? (
        <Stack gap="8">
          <TextArea labelHidden label="Suggested prompt" textSize="sm" defaultValue={prompt.text} autoresize rows={2} />
          <span className={hint}>Edits stay with this task until you start it or press Reset.</span>
        </Stack>
      ) : (
        <Stack gap="8">
          <Panel>
            <Clamp lines={5} fade>
              <span className={text}>{prompt.text}</span>
            </Clamp>
          </Panel>
          {prompt.change === undefined ? (
            readMore
          ) : (
            <Inline gap="16" align="center">
              {readMore}
              <span className={change} data-figma="change history">
                <UndoIcon size="12" />
                {prompt.change.line}
                <a className={undo} href="#undo">
                  {prompt.change.undo}
                </a>
              </span>
            </Inline>
          )}
          <PromptDialog title="Suggested prompt" text={prompt.text} open={open} onOpenChange={onOpenChange} />
        </Stack>
      )}
    </DetailSection>
  )
}
