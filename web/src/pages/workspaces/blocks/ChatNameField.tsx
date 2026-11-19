// The field that takes the place of a chat's name in its header while the owner
// renames it (D21 417:2442): the name, selected for typing, and × at its end.
// A click outside it or Enter saves the name; × or Escape undoes the change.
// Either closes it. The library has no rename field (LIBRARY_GAPS.md: Rename
// field), so it is the library's `SearchField`, whose clear button is the ×,
// 300 wide. The phone's edit mode (M2 146:37, 105:2614) draws it in a chat
// row or a workspace header, as wide as the room it has (`fill`), with the
// text the owner has typed (`draft`). The phone chat's header (M23 422:925) draws
// it 160 wide (`size="phone"`). Props only.
import { CloseIcon, SearchField } from '@eshelton328/component-library-1701'
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// Figma's field is 300 wide (d-100: shell.popoverFilter is 300).
const box = css({ w: 'shell.popoverFilter', maxW: '[100%]' })
// M23 422:925: in the phone chat's header Figma's field is 160 wide, the name, a spacer and × in it (d-100:
// shell.popoverXs is 160), and it shrinks when the header has less room.
const phoneBox = css({ w: 'shell.popoverXs', maxW: '[100%]' })
// M2 146:37: in the phone's list the field takes the whole room after the kind mark or the chevron.
const fillBox = css({ flex: '1', minW: '[0]' })

export type ChatNameFieldProps = {
  /** The chat's name before the change. */
  name: string
  /** Called with the new name; an empty name keeps the old one. */
  onSave?: ((name: string) => void) | undefined
  /** Called when the owner undoes the change. */
  onCancel?: (() => void) | undefined
  /** The Figma layer of the field, for the fidelity checks. */
  figma?: string | undefined
  /** The text in the field as it opens; the name when not set. */
  draft?: string | undefined
  /** `false`: the field opens without the focus, as when another field has it (M2). */
  autoFocus?: boolean | undefined
  /** `true`: the field takes the room it has in its row (M2), in place of 300. */
  fill?: boolean | undefined
  /** `phone`: 160 wide, in the phone chat's header (M23); `full` (the default): 300 wide, in the chat alone's (D21). */
  size?: 'full' | 'phone' | undefined
}

export function ChatNameField(props: ChatNameFieldProps) {
  const { name, onSave, onCancel, figma, autoFocus = true, fill = false, size = 'full' } = props
  const [draft, setDraft] = useState(props.draft ?? name)
  const rootRef = useRef<HTMLDivElement>(null)
  // The field closes once: a save or an undo, whichever comes first.
  const closedRef = useRef(false)
  const close = (save: boolean) => {
    if (closedRef.current) return
    closedRef.current = true
    if (save) onSave?.(draft.trim() === '' ? name : draft.trim())
    else onCancel?.()
  }
  // The field opens with the focus in it and the caret after the name. The focus waits a frame: opened from Rename
  // chat, the closing menu gives the focus back to its ⋯ in a microtask, which would blur the field and save it.
  useEffect(() => {
    if (!autoFocus) return
    const frame = requestAnimationFrame(() => {
      rootRef.current?.querySelector('input')?.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [autoFocus])
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    // Enter saves from the box only: on the × it presses the button, which undoes the change.
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) close(true)
    if (e.key === 'Escape') close(false)
  }
  const onBlur = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return
    // A switch to another window is no click outside: the field stays open with the change.
    if (!document.hasFocus()) return
    close(true)
  }
  // The field's only button is its × (SearchField's clear button), which undoes the change here.
  const onClickCapture = (e: MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('button') !== null) close(false)
  }
  return (
    // The keys, the blur and the × reach this wrapper from the field inside it.
    <div
      ref={rootRef}
      data-figma={figma ?? 'rename field · chat'}
      className={fill ? fillBox : size === 'phone' ? phoneBox : box}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onClickCapture={onClickCapture}
    >
      <SearchField
        label={`Rename ${name}`}
        size="sm"
        value={draft}
        onValueChange={setDraft}
        clearIcon={<CloseIcon size="16" />}
        clearLabel="Undo the rename"
        clearSize="16"
      />
    </div>
  )
}
