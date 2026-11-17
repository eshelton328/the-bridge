// A chat's body: the transcript, then the composer at the bottom, with the
// skill list over it after "/" (D1 105:209). `size="pane"` is a pane of the
// split, `size="full"` the chat alone beside the sidebar (D2 105:868) and
// `size="side"` the side chat's body (D2 105:933 to 105:948). Props only.
import { Composer, Inline, ModelChip, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ChatEntry, ComposerState, Skill } from '../types.ts'
import { ChatEntryView } from './ChatEntryView.tsx'
import { SkillPicker } from './SkillPicker.tsx'

const body = css({ display: 'flex', flexDirection: 'column', flex: '1', gap: '10', p: '12', minH: '[0]' })
// D2 105:868: the transcript and composer sit 22 in from the chat's sides and 16 from its top and bottom.
const sizes = {
  pane: undefined,
  full: css({ gap: '12', px: '24', py: '16' }),
  // D2 105:920: 17 in from the side chat's edges, 12 under its note.
  side: css({ gap: '12', px: '16', pt: '12', pb: '16' }),
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
}

export function ChatPane(props: ChatPaneProps) {
  const { figma, entries, composer, skills, onSkillsOpenChange, size = 'pane', folders } = props
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
      running={composer.running}
      attachments={composer.attachments.map((name) => ({ id: name, name }))}
      onRemoveAttachment={() => undefined}
      onAttach={() => undefined}
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
      <Stack gap={size === 'pane' ? '10' : '12'} className={transcript}>
        {entries.map((entry, i) => (
          <ChatEntryView key={`${entry.type}-${String(i)}`} entry={entry} figma={figma.entries?.[i]} />
        ))}
      </Stack>
      {skills === undefined ? (
        <div data-figma={figma.composer}>{box}</div>
      ) : (
        <SkillPicker
          label={skills.label}
          skills={skills.items}
          value={skills.value}
          open={skills.open}
          onOpenChange={onSkillsOpenChange}
        >
          {/* The composer is the popover's trigger: the skill list belongs to what Erik types, so the box is a combobox
              (a div cannot carry the trigger's aria-expanded). The library's Composer has no skill list (LIBRARY_GAPS.md). */}
          <div data-figma={figma.composer} role="combobox" aria-label={skills.label}>
            {box}
          </div>
        </SkillPicker>
      )}
    </div>
  )
}
