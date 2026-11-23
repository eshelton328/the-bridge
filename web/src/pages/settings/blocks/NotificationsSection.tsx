// Settings' Notifications (d-118, d-119): the Notifications switch, with the
// same states, lines and behaviour it had in the More drawer and the rail
// (bridge-coord, 2026-11-23, from the owner's "maybe notifications should go
// in there too"). The Settings page is its one place. Props only.
import { Panel } from '@eshelton328/component-library-1701'
import type { PushSwitch } from '../../../lib/pushSwitch.ts'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

export type NotificationsSectionProps = {
  push: PushSwitch
}

export function NotificationsSection({ push }: NotificationsSectionProps) {
  return (
    <Panel variant="section" title="Notifications">
      <NotificationsSwitch push={push} layout="inline" />
    </Panel>
  )
}
