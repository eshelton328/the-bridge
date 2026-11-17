// The Run in picker's content: a search field and the chats a prompt can
// run in, new chats first, then existing chats per workspace. Each choice
// starts with its agent's mark, or a plus for a chat elsewhere; a label
// pill ("Recommended") sits beside the title and a status pill at the end.
// Props only.
import { KindMark, OptionList, PlusIcon, SearchField, SearchIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRunIn } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'
import { MenuSection } from './MenuSection.tsx'

// `SearchField` draws its placeholder in `fg.subtle`, 4.39:1 on the popover's `surface.raised` (below WCAG AA), so the
// picker's placeholder is `fg.muted`. The wrapper adds no box.
const search = css({ display: 'contents', '& input::placeholder': { color: 'fg.muted' } })

export type RunInPickerProps = {
  picker: NonNullable<InboxRunIn['picker']>
  /** The picker is the phone's sheet (M4), not a popover. */
  sheet?: boolean | undefined
}

export function RunInPicker({ picker, sheet }: RunInPickerProps) {
  return (
    <>
      <div className={search}>
        <SearchField size="md" textSize="sm" label={picker.search} placeholder={picker.search} icon={<SearchIcon />} />
      </div>
      {picker.sections.map((section) => (
        <MenuSection key={section.label} label={section.label} sheet={sheet}>
          <OptionList
            label={section.label}
            size="sm"
            descriptionStyle="mono"
            selectedFill
            value={section.choices.some((c) => c.value === picker.selected) ? picker.selected : null}
            items={section.choices.map((c) => ({
              value: c.value,
              label: c.label,
              description: c.description,
              leading: c.agent === undefined ? <PlusIcon size="16" /> : <KindMark kind={c.agent} size="16" />,
              badge: c.pill !== undefined && !c.pill.dot ? <InboxStatus pill={c.pill} /> : undefined,
              trailing: c.pill?.dot === true ? <InboxStatus pill={c.pill} /> : undefined,
            }))}
          />
        </MenuSection>
      ))}
    </>
  )
}
