// The prompt of a next step: suggested and read-only with Reset and Edit,
// or in its editor with Reset and Done, an "Edited" pill while it differs
// from the suggestion and a hint under it. Edit and Done open and close the
// editor; Reset brings back the suggested prompt. A sent prompt, or one removed before it ran, has no
// buttons. A long prompt ends with "Read the whole prompt", which opens it
// in a dialog; a prompt a discussion changed has a line with Undo beside
// it, which takes the change back. Edit puts the focus in the editor, as
// Figma draws it (M3, T12, D3). Props only.
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
import { type ReactNode, useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { useWideDetail } from '../../../lib/wideDetail.ts'
import { draftProps, type InboxDrafts, type InboxNextStep } from '../types.ts'
import { DetailSection } from './DetailSection.tsx'
import { PromptDialog } from './PromptDialog.tsx'

const text = css({ textStyle: 'bodySm', color: 'fg.default' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
const change = css({ display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'monoSm', color: 'fg.muted' })
// Figma 403:1858 and 403:1980: Geist Medium 12, the `small` size at the label weight.
const undo = css({ textStyle: 'small', fontWeight: 'text.label', color: 'fg.accent', textDecoration: 'none' })
const titles = { suggested: 'Suggested prompt', sent: 'Sent prompt', notRun: 'Prompt · not run' } as const
const more = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4',
  alignSelf: 'flex-start',
  textStyle: 'small',
  fontWeight: 'text.label',
  color: 'fg.accent',
  textDecoration: 'none',
})

// Figma breaks a line after a slash ("following toolkit/" | "rules/linear.md", 403:1855); a browser keeps a path
// whole. A <wbr> after each slash gives the browser the same break, so the lines wrap where Figma's do.
function breakAfterSlashes(text: string) {
  const out: ReactNode[] = []
  let start = 0
  for (let slash = text.indexOf('/'); slash !== -1; slash = text.indexOf('/', start)) {
    out.push(text.slice(start, slash + 1), <wbr key={`wbr-${String(slash)}`} />)
    start = slash + 1
  }
  out.push(text.slice(start))
  return out
}

export type PromptSectionProps = {
  prompt: InboxNextStep['prompt']
  editing: boolean
  /** The whole prompt is open in its dialog. */
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The screen's layout: the whole prompt opens in a dialog on the desktop and in a sheet on a tablet or phone. */
  layout?: Viewport | undefined
  /** Keeps the prompt Erik is editing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** Edit opens the editor and Done closes it. */
  onEditingChange?: ((editing: boolean) => void) | undefined
  /** Undo on the line under a prompt that a discussion changed. */
  onUndoChange?: (() => void) | undefined
}

export function PromptSection({
  prompt,
  editing,
  open,
  onOpenChange,
  layout,
  drafts,
  onEditingChange,
  onUndoChange,
}: PromptSectionProps) {
  // The prompt as Erik left it; it counts as edited while it differs from the suggestion, which Reset brings back.
  const suggested = prompt.suggested ?? { text: prompt.text, long: prompt.long }
  const current = drafts?.values.prompt ?? prompt.text
  const edited = current !== suggested.text
  // The suggestion keeps its own length after Reset; any other text is as long as the state's prompt.
  const long = current === suggested.text ? suggested.long : prompt.long
  // Edit puts the focus in the editor it opens; a state that starts with the editor open leaves the focus alone.
  const [clampRef, wide] = useWideDetail()
  const editorRef = useRef<HTMLDivElement>(null)
  const focusEditorRef = useRef(false)
  useEffect(() => {
    if (!editing || !focusEditorRef.current) return
    focusEditorRef.current = false
    editorRef.current?.querySelector('textarea')?.focus()
  }, [editing])
  const readMore = long ? (
    <a
      className={more}
      href="#prompt"
      onClick={(event) => {
        // It opens the whole prompt read-only: a dialog, or a sheet on a tablet or phone (T8; M2's note).
        event.preventDefault()
        onOpenChange?.(true)
      }}
    >
      Read the whole prompt
      <ChevronRightIcon size="12" />
    </a>
  ) : null
  const changeLine =
    prompt.change === undefined ? null : (
      <span className={change} data-figma="change history">
        <UndoIcon size="12" />
        {prompt.change.line}
        <a
          className={undo}
          href="#undo"
          onClick={(e) => {
            e.preventDefault()
            onUndoChange?.()
          }}
        >
          {prompt.change.undo}
        </a>
      </span>
    )
  return (
    <DetailSection
      title={titles[prompt.state]}
      figma="section · SUGGESTED PROMPT"
      meta={edited ? <Badge variant="pill" size="sm" tone="needsYou" label="Edited" /> : undefined}
      actions={
        prompt.state !== 'suggested' ? undefined : (
          <>
            {/* Reset brings back the suggested prompt, so it does nothing until Erik edits it (Figma D1 346:359, T2 346:5736). */}
            {/* Done and Reset act while the editor's keyboard is up, so a tap on them keeps it (library #213). */}
            <Button
              data-keyboard-keep=""
              size="sm"
              textSize="xs"
              disabled={!edited}
              onClick={() => {
                drafts?.onChange('prompt', suggested.text)
              }}
            >
              <ResetIcon />
              Reset
            </Button>
            <Button
              data-keyboard-keep=""
              size="sm"
              textSize="xs"
              onClick={() => {
                focusEditorRef.current = !editing
                onEditingChange?.(!editing)
              }}
            >
              {editing ? <CheckIcon /> : <EditIcon />}
              {editing ? 'Done' : 'Edit'}
            </Button>
          </>
        )
      }
    >
      {editing ? (
        <Stack gap="8" ref={editorRef}>
          <TextArea
            labelHidden
            label="Suggested prompt"
            textSize="sm"
            autoresize
            rows={2}
            {...draftProps(drafts, 'prompt', prompt.text)}
          />
          <span className={hint}>Edits stay with this task until you start it or press Reset.</span>
        </Stack>
      ) : (
        <Stack gap="8">
          <Panel>
            {/* `Clamp` takes its parent's text style and cuts at five of its lines. The style sits on a block: on an
                inline span the 13 px text in the panel's 14 px line makes 21 px lines, and the cut hides the fifth. */}
            <div className={text} ref={clampRef}>
              {/* After an applied update, Figma keeps the prompt box at its five lines' height (128, D16 403:1854;
                  T19) for the shorter prompt; a short prompt with no change line hugs its text (D4). In a detail at
                  least 1600 px wide the column widens to 1024 and shows eight lines (Erik, R2); Read the whole prompt
                  stays. */}
              <Clamp lines={wide ? 8 : 5} fade reserve={changeLine !== null}>
                {breakAfterSlashes(current)}
              </Clamp>
            </div>
          </Panel>
          {/* The phone puts the change line under Read the whole prompt (M20 402:2440), 8 below it. */}
          {changeLine !== null && layout === 'phone' ? (
            <Stack gap="8">
              {readMore}
              {changeLine}
            </Stack>
          ) : changeLine !== null ? (
            <Inline gap="16" align="center">
              {readMore}
              {changeLine}
            </Inline>
          ) : (
            readMore
          )}
          <PromptDialog
            title="Suggested prompt"
            text={current}
            open={open}
            onOpenChange={onOpenChange}
            layout={layout}
            onEdit={
              prompt.state === 'suggested'
                ? () => {
                    // Edit prompt closes the sheet and opens the editor with the focus in it (M9 to M3).
                    onOpenChange?.(false)
                    focusEditorRef.current = true
                    onEditingChange?.(true)
                  }
                : undefined
            }
          />
        </Stack>
      )}
    </DetailSection>
  )
}
