// The fields of the New chat form on the phone (M7 105:3282): the optional
// name with "random if blank" (hidden once a name is typed, M11), Runs in as
// one full-width choice per row with a check on the chosen one, the
// workspace, the folders as chips with Add folder (or as one field-high box,
// M11 148:82), the model, and the first message with its attach button. D3's
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
// Figma draws Add folder's border dashed (M7 128:41); a Button's border is solid.
const dashed = css({ borderStyle: 'dashed' })
// A Runs in choice spans the form's width: the kind mark and the name at the start, the check at the end.
const choice = css({ w: '[100%]', justifyContent: 'flex-start' })
// M7 105:3284: the chosen name in the text colour and its check in cyan; the other names muted (105:3296, 105:3302).
const choiceLabel = css({ flex: '1', textAlign: 'start', color: 'fg.muted' })
const chosenLabel = css({ flex: '1', textAlign: 'start' })
const check = css({ display: 'flex', color: 'fg.accent' })
// M11 148:82: the folders as one box, the text at the start as in the workspace box.
const box = css({ w: '[100%]', justifyContent: 'flex-start' })
// Figma keeps two spaces before "+1" (148:83).
const keepSpaces = css({ whiteSpace: 'pre' })

/** Fills in a `foldersBox` text: the first folder and the number of the others. */
function foldersText(template: string, folders: readonly string[]): string {
  return template.replace('{first}', folders[0] ?? '').replace('{more}', String(Math.max(folders.length - 1, 0)))
}

export type NewChatFieldsProps = {
  form: NewChatForm
  workspaces: readonly Workspace[]
  /** The box of the first message, which gets the focus when the form opens. */
  messageRef?: RefObject<HTMLDivElement | null> | undefined
  /** The box of the name, which gets the focus when `form.focus` is `name` (M11). */
  nameRef?: RefObject<HTMLDivElement | null> | undefined
  /** The frame's Figma layers. */
  layers?: NewChatLayers | undefined
}

export function NewChatFields({ form, workspaces, messageRef, nameRef, layers }: NewChatFieldsProps) {
  const { labels } = form
  const typed = form.name.value !== undefined && form.name.value !== ''
  return (
    <>
      <FormField label={labels.name} hint={typed ? undefined : form.name.hint} figma={layers?.fields.name}>
        <div ref={nameRef} className={wide} data-figma={layers?.boxes.name}>
          <TextField
            label={labels.name}
            labelHidden
            size="xl"
            placeholder={form.name.placeholder}
            defaultValue={form.name.value}
          />
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
        {form.foldersBox === undefined ? (
          <Inline gap="6" align="center" wrap>
            {form.folders.map((path, i) =>
              i === 0 ? (
                // M7 128:30: the own folder chip draws #5ee1ff at 0.6, border.selected's colour, not border.active.
                <Button key={path} size="sm" pressed pressedBorder="selected" data-figma={layers?.folders[i]}>
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
            <Button size="sm" textSize="xs" className={dashed} data-figma={layers?.addFolder}>
              <PlusIcon size="12" />
              {form.addFolder}
            </Button>
          </Inline>
        ) : (
          <Button
            size="xl"
            className={box}
            aria-label={`${labels.folders}: ${form.folders.join(', ')}`}
            data-figma={layers?.boxes.folders}
          >
            <span className={keepSpaces}>{foldersText(form.foldersBox, form.folders)}</span>
          </Button>
        )}
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
