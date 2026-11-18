// The Subtask form's fields (D17 417:1026, M20 422:520): the model that runs
// the subagent, what it should do, a `Composer` with its attach button as the
// New chat form's first message (LIBRARY_GAPS.md: Composer in a form), and
// the line on what the subtask gets and where its result goes. The desktop
// `SubtaskDialog` and the phone's `PhoneSubtask` draw them. Props only.
import { Composer } from '@eshelton328/component-library-1701'
import type { RefObject } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SubtaskForm } from '../types.ts'
import { FormField } from './FormField.tsx'
import { SelectField } from './SelectField.tsx'

const wide = css({ w: '[100%]' })
const note = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

/** The Figma layers of the fields, for the fidelity checks. */
type SubtaskFieldsLayers = {
  model?: string | undefined
  modelBox?: string | undefined
  task?: string | undefined
  taskBox?: string | undefined
  note?: string | undefined
}

export type SubtaskFieldsProps = {
  form: SubtaskForm
  /** The box around the task, so the form can give its message box the focus when it opens. */
  taskRef?: RefObject<HTMLDivElement | null> | undefined
  layers?: SubtaskFieldsLayers | undefined
}

export function SubtaskFields({ form, taskRef, layers }: SubtaskFieldsProps) {
  const { labels } = form
  return (
    <>
      <FormField label={labels.model} figma={layers?.model}>
        <SelectField
          label={labels.model}
          options={form.model.options}
          value={form.model.value}
          figma={layers?.modelBox}
        />
      </FormField>
      <FormField label={labels.task} figma={layers?.task}>
        <div ref={taskRef} data-figma={layers?.taskBox} className={wide}>
          <Composer
            label={labels.task}
            placeholder={form.task.placeholder}
            defaultValue={form.task.value}
            onAttach={() => undefined}
          />
        </div>
      </FormField>
      <p className={note} data-figma={layers?.note}>
        {form.note}
      </p>
    </>
  )
}
