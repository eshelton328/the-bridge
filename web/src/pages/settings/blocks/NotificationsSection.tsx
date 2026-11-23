// Settings' Notifications (d-118, d-119): the Notifications switch, with the
// same states, lines and behaviour it had in the More drawer and the rail
// (bridge-coord, 2026-11-23, from the owner's "maybe notifications should go
// in there too"), and below it "Show message preview" (on by default): a push
// then holds one line of what the chat did or waits on, else only "Done" or
// "Needs you". The Settings page is its one place. Props only.
import { Panel, Switch } from '@eshelton328/component-library-1701'
import type { PushSwitch } from '../../../lib/pushSwitch.ts'
import { NotificationsSwitch } from './NotificationsSwitch.tsx'

export type NotificationsSectionProps = {
  push: PushSwitch
}

/** The preview choice can change while push can: it goes with the subscription now, or with the next turn on. */
const previewChangeable = (push: PushSwitch) => !push.busy && (push.state === 'on' || push.state === 'off')

export function NotificationsSection({ push }: NotificationsSectionProps) {
  return (
    <Panel variant="section" title="Notifications">
      <NotificationsSwitch push={push} layout="inline" />
      <Switch
        label="Show message preview"
        hint={push.previewFailed ? 'Not saved. Try again.' : 'A line of what the chat did or asks'}
        checked={push.preview}
        disabled={!previewChangeable(push)}
        onCheckedChange={push.onPreviewChange}
        layout="inline"
      />
    </Panel>
  )
}
