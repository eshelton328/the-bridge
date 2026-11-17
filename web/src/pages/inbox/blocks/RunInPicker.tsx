// The Run in picker's content: a search field and the chats a prompt can
// run in, new chats first, then existing chats per workspace. Each choice
// starts with its agent's mark, or a plus for a chat elsewhere; a label
// pill ("Recommended") sits beside the title and a status pill at the end.
// Props only.
import {
  KindMark,
  OptionList,
  PlusIcon,
  PopoverSection,
  SearchField,
  SearchIcon,
} from '@eshelton328/component-library-1701'
import type { InboxRunIn } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

export function RunInPicker({ picker }: { picker: NonNullable<InboxRunIn['picker']> }) {
  return (
    <>
      <SearchField size="md" label={picker.search} placeholder={picker.search} icon={<SearchIcon />} />
      {picker.sections.map((section) => (
        <PopoverSection key={section.label} label={section.label}>
          <OptionList
            label={section.label}
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
        </PopoverSection>
      ))}
    </>
  )
}
