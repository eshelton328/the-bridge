// The fields of the New chat form on the phone (M7 105:3282): the optional
// name with "random if blank", Runs in as one full-width choice per row with
// a check on the chosen one, the workspace, the folders as chips with Add
// folder, the model, and the first message with its attach button. D3's
// dialog draws the same form in `NewChatDialog`; this one stacks the choices
// for a phone's width. Props only.
import {
  Button,
  CheckIcon,
  CloseIcon,
  Composer,
  FolderIcon,
  Inline,
  KindMark,
  PlusIcon,
  Stack,
  TextField,
} from '@eshelton328/component-library-1701'
import type { RefObject } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { NewChatForm, NewChatLayers, Workspace } from '../types.ts'
import { FormField } from './FormField.tsx'
import { SelectField } from './SelectField.tsx'

const wide = css({ w: '[100%]' })
// A Runs in choice spans the form's width: the kind mark and the name at the start, the check at the end.
const choice = css({ w: '[100%]', justifyContent: 'flex-start' })
// M7 105:3284: the chosen name in the text colour and its check in cyan; the other names muted (105:3296, 105:3302).
const choiceLabel = css({ flex: '1', textAlign: 'start', color: 'fg.muted' })
const chosenLabel = css({ flex: '1', textAlign: 'start' })
const check = css({ display: 'flex', color: 'fg.accent' })

export type NewChatFieldsProps = {
  form: NewChatForm
  workspaces: readonly Workspace[]
  /** The box of the first message, which gets the focus when the form opens. */
  messageRef?: RefObject<HTMLDivElement | null> | undefined
  /** The frame's Figma layers. */
  layers?: NewChatLayers | undefined
}

export function NewChatFields({ form, workspaces, messageRef, layers }: NewChatFieldsProps) {
  const { labels } = form
  return (
    <>
      <FormField label={labels.name} hint={form.name.hint} figma={layers?.fields.name}>
        <div className={wide} data-figma={layers?.boxes.name}>
          <TextField label={labels.name} labelHidden size="xl" placeholder={form.name.placeholder} />
        </div>
      </FormField>
      <FormField label={labels.runsIn} figma={layers?.fields.runsIn}>
        <Stack gap="4" role="group" aria-label={labels.runsIn}>
          {form.runsIn.options.map((o) => (
            <Button
              key={o.kind}
              size="xl"
              className={choice}
              pressed={o.kind === form.runsIn.value}
              data-figma={layers?.runsIn[o.kind]}
            >
              <KindMark kind={o.kind} size="16" />
              <span className={o.kind === form.runsIn.value ? chosenLabel : choiceLabel}>{o.label}</span>
              {o.kind === form.runsIn.value ? (
                <span className={check}>
                  <CheckIcon size="16" />
                </span>
              ) : null}
            </Button>
          ))}
        </Stack>
      </FormField>
      <FormField label={labels.workspace} figma={layers?.fields.workspace}>
        <SelectField
          label={labels.workspace}
          options={workspaces.map((w) => ({ value: w.id, label: w.label }))}
          value={form.workspace}
          size="xl"
          figma={layers?.boxes.workspace}
        />
      </FormField>
      <FormField label={labels.folders} figma={layers?.fields.folders}>
        <Inline gap="6" align="center" wrap>
          {form.folders.map((path, i) =>
            i === 0 ? (
              <Button key={path} size="sm" pressed data-figma={layers?.folders[i]}>
                <FolderIcon size="12" />
                {path}
              </Button>
            ) : (
              <Button key={path} size="sm" aria-label={`Remove ${path}`} data-figma={layers?.folders[i]}>
                <FolderIcon size="12" />
                {path}
                <CloseIcon size="12" />
              </Button>
            ),
          )}
          <Button size="sm" textSize="xs" data-figma={layers?.addFolder}>
            <PlusIcon size="12" />
            {form.addFolder}
          </Button>
        </Inline>
      </FormField>
      <FormField label={labels.model} figma={layers?.fields.model}>
        <SelectField
          label={labels.model}
          options={form.model.options}
          value={form.model.value}
          size="xl"
          figma={layers?.boxes.model}
        />
      </FormField>
      <FormField label={labels.message} figma={layers?.fields.message}>
        <div ref={messageRef} className={wide} data-figma={layers?.boxes.message}>
          <Composer label={labels.message} placeholder={form.message.placeholder} onAttach={() => undefined} />
        </div>
      </FormField>
    </>
  )
}
