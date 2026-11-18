// A chat's body: the transcript, then the composer at the bottom, with the
// skill list over it after "/" (D1 105:209). Only what Erik types opens the
// list: a message that starts with "/" opens it, and the focus stays in the
// box. `size="pane"` is a pane of the
// split, `size="full"` the chat alone beside the sidebar (D2 105:868) and
// `size="side"` the side chat's body (D2 105:933 to 105:948). An overlay,
// such as the side chat in a pane (D5 158:518), sits over the body's right
// side. The composer stays at the bottom of its pane and only the transcript
// above it scrolls (d-107, `ScrollFrame`). `size="phone"` is the chat on the
// phone (M3 105:2784), with the skill list as wide as the composer. Props only.
import { Composer, Inline, ModelChip, ScrollFrame } from '@eshelton328/component-library-1701'
import { type ReactNode, useEffect, useRef } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ChatEntry, ComposerState, Skill } from '../types.ts'
import { ChatEntryView } from './ChatEntryView.tsx'
import { SkillPicker } from './SkillPicker.tsx'

const body = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  p: '12',
  minH: '[0]',
})
// D2 105:868: the transcript and composer sit 22 in from the chat's sides and 16 from its top and bottom.
const sizes = {
  pane: undefined,
  full: css({ px: '24', py: '16' }),
  // D2 105:920: 17 in from the side chat's edges, 12 under its note.
  side: css({ px: '16', pt: '12', pb: '16' }),
  // D5 158:518: the side chat in a pane pads its parts itself, and fills the panel under its title row.
  inset: css({ px: '0', pt: '0', pb: '0' }),
  // M3 105:2784: 16 in from the screen's sides and 14 under the header's rule (12 on the grid). The composer ends 10
  // over Figma's 21 px home indicator band, 31 from the screen's end; `AppShell` keeps a 34 px safe area there with no
  // tab bar, so the body pads nothing under the composer.
  phone: css({ px: '16', pt: '12', pb: '0' }),
}
// The space between the entries, and between the transcript, `above` and the composer: 10 in a pane of the split
// and the side chat in a pane (D1, D5), 12 in the chat alone and the side chat (D2).
const gaps = {
  pane: { body: css({ gap: '10' }), footer: css({ gap: '10', pt: '10' }) },
  full: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  side: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // M3: the entries 12 apart (105:2785 to 105:2790).
  phone: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // The side chat in a pane: in a short pane its transcript keeps two 17 px lines (`control.lg`, 36, the nearest size
  // token, d-100) and scrolls with the note; the title row and the composer stay in view (d-107).
  inset: { body: css({ gap: '10', minH: 'control.lg' }), footer: css({ gap: '10', pt: '10' }) },
} satisfies Record<keyof typeof sizes, { body: string; footer: string }>
// The side chat in a pane: its one-row composer never shrinks below its own height, however short the pane. The
// library's ScrollFrame lets its footer shrink (and scroll) so a long draft leaves the transcript room; the inline
// composer caps its own draft, so here the footer keeps its height (`footerShrink={false}`, library beta.27) and the
// panel scrolls instead (SideChatPanel).
const footerShrinks = { pane: true, full: true, side: true, phone: true, inset: false } satisfies Record<keyof typeof sizes, boolean>
const footer = css({ display: 'flex', flexDirection: 'column' })
export type ChatPaneProps = {
  /** The Figma layers of the composer and of each entry, for the fidelity checks. */
  figma: {
    /** The composer; none when the frame does not draw it, such as under M4's sheet. */
    composer?: string | undefined
    entries?: readonly (string | undefined)[] | undefined
    /** The skill list; D1's when not set. */
    skills?: string | undefined
  }
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
  /** The composer's layout: `inline` is one row, as the side chat in a pane draws it (D5 158:545); `stacked` when not set. */
  layout?: 'stacked' | 'inline' | undefined
  /** Drawn at the top of the transcript and scrolled with it, such as the side chat's note in a pane (D5 158:530). */
  lead?: ReactNode
  /** Drawn between the transcript and the composer, such as "Open as its own pane" (D5 158:540). */
  above?: ReactNode
  /** Drawn over the body, such as the side chat in a pane (D5 158:518); it places itself. */
  overlay?: ReactNode
  /** Put the focus in the message box when the chat shows, as the phone's chat does with the skills open (M3). */
  autoFocus?: boolean | undefined
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
    layout,
    lead,
    above,
    overlay,
    autoFocus = false,
  } = props
  // Set when "/" opens the list, so the list hands the focus back to the box (SkillPicker `onListFocus`).
  const typedRef = useRef(false)
  const areaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!autoFocus) return
    const area = areaRef.current?.querySelector('textarea')
    // The caret goes after the text, where typing goes on.
    area?.focus()
    area?.setSelectionRange(area.value.length, area.value.length)
  }, [autoFocus])
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
      layout={layout}
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
  const composerBox =
    skills === undefined ? (
      <div ref={areaRef} data-figma={figma.composer}>
        {box}
      </div>
    ) : (
      <SkillPicker
        label={skills.label}
        skills={skills.items}
        value={skills.value}
        open={skills.open}
        layout={size === 'phone' ? 'phone' : 'pane'}
        figma={figma.skills}
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
    )
  return (
    <div className={cx(body, sizes[size])}>
      <ScrollFrame
        footerShrink={footerShrinks[size]}
        bodyClassName={gaps[size].body}
        footer={
          <div className={cx(footer, gaps[size].footer)}>
            {above}
            {composerBox}
          </div>
        }
      >
        {lead}
        {entries.map((entry, i) => (
          <ChatEntryView key={`${entry.type}-${String(i)}`} entry={entry} figma={figma.entries?.[i]} />
        ))}
      </ScrollFrame>
      {overlay}
    </div>
  )
}
