// One field of the New chat form (D3 114:2): its label in capitals over the
// control. Figma writes the label in the eyebrow style; the library's
// `TextField` label is `small` (LIBRARY_GAPS.md: Form field label), so the
// label is shown here and the control names itself for assistive
// technology. Props only.
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

const field = css({ display: 'flex', flexDirection: 'column', gap: '6', minW: '[0]' })
const label = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const top = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8' })
const hintText = css({ textStyle: 'mono', color: 'fg.subtle' })

export type FormFieldProps = {
  label: string
  /**
   * A hint at the end of the label row, such as "random if blank". Figma draws it inside the field at its end; no
   * library field has a slot there (LIBRARY_GAPS.md: Field hint).
   */
  hint?: string | undefined
  children: ReactNode
  /** The Figma layer the field stands for, for the fidelity checks. */
  figma?: string | undefined
}

export function FormField({ label: text, hint, children, figma }: FormFieldProps) {
  return (
    <div data-figma={figma} className={field}>
      <div className={top}>
        <span className={label} aria-hidden="true">
          {text}
        </span>
        {hint === undefined ? null : <span className={hintText}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}
