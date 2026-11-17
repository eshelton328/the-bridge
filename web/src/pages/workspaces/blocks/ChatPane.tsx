// A chat pane's body: the transcript, then the composer at the bottom, with
// the skill list over it after "/" (D1 105:209). Props only.
import { Composer, ModelChip, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatEntry, ComposerState, Skill } from '../types.ts'
import { ChatEntryView } from './ChatEntryView.tsx'
import { SkillPicker } from './SkillPicker.tsx'

const body = css({ display: 'flex', flexDirection: 'column', flex: '1', gap: '10', p: '12', minH: '[0]' })
// The transcript takes the room above the composer.
const transcript = css({ flex: '1', minH: '[0]' })

export type ChatPaneProps = {
  /** The Figma layer of the composer. */
  composerFigma: string
  entries: readonly ChatEntry[]
  composer: ComposerState
  skills: { label: string; items: readonly Skill[]; value: string | null; open: boolean }
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
}

export function ChatPane({ composerFigma, entries, composer, skills, onSkillsOpenChange }: ChatPaneProps) {
  return (
    <div className={body}>
      <Stack gap="10" className={transcript}>
        {entries.map((entry, i) => (
          <ChatEntryView key={`${entry.type}-${String(i)}`} entry={entry} />
        ))}
      </Stack>
      <SkillPicker
        label={skills.label}
        skills={skills.items}
        value={skills.value}
        open={skills.open}
        onOpenChange={onSkillsOpenChange}
      >
        {/* The composer is the popover's trigger: the skill list belongs to what Erik types, so the box is a combobox
            (a div cannot carry the trigger's aria-expanded). The library's Composer has no skill list (LIBRARY_GAPS.md). */}
        <div data-figma={composerFigma} role="combobox" aria-label={skills.label}>
          <Composer
            label={composer.placeholder}
            placeholder={composer.placeholder}
            defaultValue={composer.text}
            running={composer.running}
            attachments={composer.attachments.map((name) => ({ id: name, name }))}
            onRemoveAttachment={() => undefined}
            onAttach={() => undefined}
            model={
              composer.model === undefined ? undefined : (
                <ModelChip
                  model={composer.model}
                  options={[{ value: composer.model, label: composer.model }]}
                  value={composer.model}
                />
              )
            }
          />
        </div>
      </SkillPicker>
    </div>
  )
}
