// A chat's body: the transcript, then the composer at the bottom, with the
// skill list over it after "/" (D1 105:209). Only what Erik types opens the
// list: a message that starts with "/" opens it, and the focus stays in the
// box. `size="pane"` is a pane of the
// split, `size="full"` the chat alone beside the sidebar (D2 105:868) and
// `size="side"` the side chat's body (D2 105:933 to 105:948). An overlay,
// such as the side chat in a pane (D5 158:518), sits over the body's right
// side. Props only.
import { Composer, Inline, ModelChip, Stack } from '@eshelton328/component-library-1701'
import { type ReactNode, useRef } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ChatEntry, ComposerState, Skill } from '../types.ts'
import { ChatEntryView } from './ChatEntryView.tsx'
import { SkillPicker } from './SkillPicker.tsx'

const body = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  gap: '10',
  p: '12',
  minH: '[0]',
})
// D2 105:868: the transcript and composer sit 22 in from the chat's sides and 16 from its top and bottom.
const sizes = {
  pane: undefined,
  full: css({ gap: '12', px: '24', py: '16' }),
  // D2 105:920: 17 in from the side chat's edges, 12 under its note.
  side: css({ gap: '12', px: '16', pt: '12', pb: '16' }),
  // D5 158:518: the side chat in a pane pads its parts itself and keeps them 10 apart.
  inset: css({ gap: '10', px: '0', pt: '0', pb: '0' }),
}
// The transcript takes the room above the composer.
const transcript = css({ flex: '1', minH: '[0]' })

export type ChatPaneProps = {
  /** The Figma layers of the composer and of each entry, for the fidelity checks. */
  figma: { composer: string; entries?: readonly (string | undefined)[] | undefined }
  entries: readonly ChatEntry[]
  composer: ComposerState
  /** The skills that "/" lists; a chat without them lists none. */
  skills?: { label: string; items: readonly Skill[]; value: string | null; open: boolean } | undefined
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  size?: keyof typeof sizes | undefined
  /** The folders control, before the model in the composer's bottom row (D4 137:9). */
  folders?: ReactNode
  /** `false`: the composer has no attach button, as the side chat in a pane draws it (D5 158:545). */
  attach?: boolean | undefined
  /** Drawn between the transcript and the composer, such as "Open as its own pane" (D5 158:540). */
  above?: ReactNode
  /** Drawn over the body, such as the side chat in a pane (D5 158:518); it places itself. */
  overlay?: ReactNode
}

export function ChatPane(props: ChatPaneProps) {
  const {
    figma,
    entries,
    composer,
    skills,
    onSkillsOpenChange,
    size = 'pane',
    folders,
    attach = true,
    above,
    overlay,
  } = props
  // Set when "/" opens the list, so the list hands the focus back to the box (SkillPicker `onListFocus`).
  const typedRef = useRef(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const onValueChange = (text: string) => {
    const open = text.startsWith('/')
    if (skills === undefined || open === skills.open) return
    typedRef.current = open
    onSkillsOpenChange?.(open)
  }
  const chip =
    composer.model === undefined ? undefined : (
      <ModelChip
        model={composer.model}
        options={[{ value: composer.model, label: composer.model }]}
        value={composer.model}
      />
    )
  const box = (
    <Composer
      label={composer.placeholder}
      placeholder={composer.placeholder}
      defaultValue={composer.text}
      onValueChange={onValueChange}
      running={composer.running}
      attachments={composer.attachments.map((name) => ({ id: name, name }))}
      onRemoveAttachment={() => undefined}
      onAttach={attach ? () => undefined : undefined}
      model={
        folders === undefined ? (
          chip
        ) : (
          <Inline gap="6" align="center">
            {folders}
            {chip}
          </Inline>
        )
      }
    />
  )
  return (
    <div className={cx(body, sizes[size])}>
      <Stack gap={size === 'pane' || size === 'inset' ? '10' : '12'} className={transcript}>
        {entries.map((entry, i) => (
          <ChatEntryView key={`${entry.type}-${String(i)}`} entry={entry} figma={figma.entries?.[i]} />
        ))}
      </Stack>
      {above}
      {skills === undefined ? (
        <div data-figma={figma.composer}>{box}</div>
      ) : (
        <SkillPicker
          label={skills.label}
          skills={skills.items}
          value={skills.value}
          open={skills.open}
          onOpenChange={(open) => {
            // The box is the popover's trigger: a click on it asks to open the list, which only "/" does.
            if (!open) onSkillsOpenChange?.(false)
          }}
          onListFocus={() => {
            if (!typedRef.current) return
            typedRef.current = false
            areaRef.current?.querySelector('textarea')?.focus()
          }}
        >
          {/* The composer is the popover's trigger: the skill list belongs to what Erik types, so the box is a combobox
              (a div cannot carry the trigger's aria-expanded). The library's Composer has no skill list (LIBRARY_GAPS.md). */}
          <div ref={areaRef} data-figma={figma.composer} role="combobox" aria-label={skills.label}>
            {box}
          </div>
        </SkillPicker>
      )}
      {overlay}
    </div>
  )
}
