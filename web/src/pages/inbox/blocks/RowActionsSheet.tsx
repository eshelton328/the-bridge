// The sheet a long-pressed row opens on the phone (M6): the row's title,
// its meta and kind, the snooze times, "Pick a date and time…", then Mark
// done and "Dismiss with a reason…". A time snoozes the row, Mark done and
// Dismiss put it in Done; the reason step and the date picker are not drawn
// yet, so Dismiss dismisses without a reason and the picker only closes
// the sheet. Props only.
import {
  BottomSheet,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  OptionList,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRowView, InboxSnoozeMenu } from '../types.ts'
import { MenuSection } from './MenuSection.tsx'

// M6 346:10213: the meta line in mono under the title.
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', px: '4' })
const time = css({ textStyle: 'mono', color: 'fg.subtle' })
// M6 346:10248: a rule between the snooze rows and Mark done.
const finish = css({ borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' })

export type RowActionsSheetProps = {
  row: InboxRowView
  /** The row's kind as the Filter menu names it, such as "Review". */
  kindLabel: string
  menu: InboxSnoozeMenu
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** A snooze time and the menu choice it came from (`value`), or `null` for Mark done. */
  onPick?: ((until: string | null, value?: string) => void) | undefined
  onDismiss?: (() => void) | undefined
}

export function RowActionsSheet({ row, kindLabel, menu, open, onOpenChange, onPick, onDismiss }: RowActionsSheetProps) {
  const pick = (value: string) => {
    const until = menu.times.find((t) => t.value === value)?.time
    if (until !== undefined) onPick?.(until, value)
    else if (value === 'done') onPick?.(null)
    else if (value === 'dismiss') onDismiss?.()
    else onOpenChange?.(false)
  }
  return (
    <BottomSheet title={row.title} open={open} onOpenChange={onOpenChange}>
      <span className={meta}>{`${row.meta} · ${kindLabel}`}</span>
      <MenuSection label={menu.heading} sheet>
        <OptionList
          label={menu.heading}
          value={null}
          onItemSelect={pick}
          items={[
            ...menu.times.map((t) => ({
              value: t.value,
              label: t.label,
              leading: <ClockIcon size="16" />,
              trailing: <span className={time}>{t.time}</span>,
            })),
            { value: 'pick', label: menu.pick, leading: <CalendarIcon size="16" /> },
          ]}
        />
      </MenuSection>
      <div className={finish}>
        <OptionList
          label={row.title}
          value={null}
          onItemSelect={pick}
          items={[
            { value: 'done', label: menu.done, leading: <CheckIcon size="16" /> },
            { value: 'dismiss', label: menu.dismiss, leading: <CloseIcon size="16" /> },
          ]}
        />
      </div>
    </BottomSheet>
  )
}
