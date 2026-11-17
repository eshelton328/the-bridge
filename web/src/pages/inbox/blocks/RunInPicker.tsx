// The Run in picker's content: a search field and the chats a prompt can
// run in, new chats first, then existing chats per workspace. Props only.
import { OptionList, PopoverSection, SearchField, SearchIcon } from '@eshelton328/component-library-1701'
import type { InboxRunIn } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

export function RunInPicker({ picker }: { picker: NonNullable<InboxRunIn['picker']> }) {
  return (
    <div data-figma="run in picker">
      <SearchField size="md" label={picker.search} placeholder={picker.search} icon={<SearchIcon />} />
      {picker.sections.map((section) => (
        <PopoverSection key={section.label} label={section.label}>
          <OptionList
            label={section.label}
            value={section.choices.some((c) => c.value === picker.selected) ? picker.selected : null}
            items={section.choices.map((c) => ({
              value: c.value,
              label: c.label,
              description: c.description,
              badge: c.pill === undefined ? undefined : <InboxStatus pill={c.pill} />,
            }))}
          />
        </PopoverSection>
      ))}
    </div>
  )
}
