// The prompt of a next step: suggested and read-only with Reset and Edit,
// or in its editor with Reset and Done, an "Edited" pill once changed and a
// hint under it. A sent prompt has no buttons. A long prompt ends with
// "Read the whole prompt", which opens it in a dialog. Props only.
import {
  Badge,
  Button,
  CheckIcon,
  ChevronRightIcon,
  Clamp,
  EditIcon,
  Panel,
  ResetIcon,
  Stack,
  TextArea,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'
import { DetailSection } from './DetailSection.tsx'
import { PromptDialog } from './PromptDialog.tsx'

const text = css({ textStyle: 'body', color: 'fg.default' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
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
}

export function PromptSection({ prompt, editing, open }: PromptSectionProps) {
  return (
    <DetailSection
      title={prompt.sent ? 'Sent prompt' : 'Suggested prompt'}
      figma="section · SUGGESTED PROMPT"
      meta={prompt.edited ? <Badge variant="pill" tone="needsYou" label="Edited" /> : undefined}
      actions={
        prompt.sent ? undefined : (
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
          <TextArea labelHidden label="Suggested prompt" defaultValue={prompt.text} autoresize rows={2} />
          <span className={hint}>Edits stay with this task until you start it or press Reset.</span>
        </Stack>
      ) : (
        <Stack gap="8">
          <Panel>
            <Clamp lines={5} fade>
              <span className={text}>{prompt.text}</span>
            </Clamp>
          </Panel>
          {prompt.long ? (
            <a className={more} href="#prompt">
              Read the whole prompt
              <ChevronRightIcon size="12" />
            </a>
          ) : null}
          <PromptDialog title="Suggested prompt" text={prompt.text} open={open} />
        </Stack>
      )}
    </DetailSection>
  )
}
