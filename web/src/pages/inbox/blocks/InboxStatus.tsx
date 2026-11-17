// A pill from the view model: a status with a dot ("Needs you", "Working")
// is the library's StatusPill; a label without one ("Recommended") is a
// pill Badge. Props only.
import { Badge, StatusPill } from '@eshelton328/component-library-1701'
import type { InboxPill } from '../types.ts'

export function InboxStatus({ pill }: { pill: InboxPill }) {
  return pill.dot ? (
    <StatusPill tone={pill.tone} label={pill.label} dot />
  ) : (
    <Badge variant="pill" tone={pill.tone} label={pill.label} />
  )
}
