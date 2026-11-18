// The field that takes the place of a chat's name in its header while Erik
// renames it (D21 417:2442): the name, selected for typing, and × at its end.
// A click outside it or Enter saves the name; × or Escape undoes the change.
// Either closes it. The library has no rename field (LIBRARY_GAPS.md: Rename
// field), so it is the library's `SearchField`, whose clear button is the ×,
// 300 wide. Props only.
import { CloseIcon, SearchField } from '@eshelton328/component-library-1701'
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// Figma's field is 300 wide (d-100: shell.popoverFilter is 300).
const box = css({ w: 'shell.popoverFilter', maxW: '[100%]' })

export type ChatNameFieldProps = {
  /** The chat's name before the change. */
  name: string
  /** Called with the new name; an empty name keeps the old one. */
  onSave?: ((name: string) => void) | undefined
  /** Called when Erik undoes the change. */
  onCancel?: (() => void) | undefined
  /** The Figma layer of the field, for the fidelity checks. */
  figma?: string | undefined
}

export function ChatNameField({ name, onSave, onCancel, figma }: ChatNameFieldProps) {
  const [draft, setDraft] = useState(name)
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
    const frame = requestAnimationFrame(() => {
      rootRef.current?.querySelector('input')?.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [])
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') close(true)
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
      className={box}
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
