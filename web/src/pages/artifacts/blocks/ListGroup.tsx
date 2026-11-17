// A group of the library's list view (Figma "group · …", D4 403:8208): the
// group header, with a count and the New dot when it has them, and under it,
// while the group is open, its rows 6 apart (403:8215). Props only.
import { GroupHeader, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'

export type ListGroupProps = {
  /** The id of the rows' element, for the header's `aria-controls`. */
  id: string
  label: string
  /** The Figma layer the header stands for, such as "group · matches". */
  figma: string
  count?: number | undefined
  dot?: boolean | undefined
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The Figma layer the rows stand for, such as "result list". */
  rowsFigma?: string | undefined
  /** The rows. */
  children: ReactNode
}

export function ListGroup({
  id,
  label,
  figma,
  count,
  dot = false,
  open,
  onOpenChange,
  rowsFigma,
  children,
}: ListGroupProps) {
  return (
    <Stack gap="12">
      {/* Level 2 under the page's h1, around the toggle, as CardGroup's heading. */}
      <div role="heading" aria-level={2} data-figma={figma}>
        <GroupHeader
          label={label}
          count={count}
          dot={dot ? 'working' : undefined}
          open={open}
          onOpenChange={onOpenChange}
          contentId={id}
        />
      </div>
      {open ? (
        <Stack gap="6" id={id} data-figma={rowsFigma}>
          {children}
        </Stack>
      ) : null}
    </Stack>
  )
}
