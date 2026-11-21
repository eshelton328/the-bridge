// The Notifications switch of d-118, which the phone's More drawer and the
// desktop rail draw at their end: on asks for the permission and subscribes
// this browser to the server's Web Push, off ends it. Figma has no such row;
// each frame with the drawer or the rail records it as a deviation. A switch
// the browser cannot use is off and disabled, with a line that says why.
// Props only; the page entry passes the store's switch (state/pushStore.ts).
import { Switch } from '@eshelton328/component-library-1701'
import type { PushSwitch } from '../lib/pushSwitch.ts'

/** The line under the label for each state the owner cannot change from here, and for a turn-on that missed. */
function notificationsHint(push: PushSwitch): string | undefined {
  if (push.state === 'denied') return 'Blocked in Settings'
  if (push.state === 'homeScreen') return 'Add The Bridge to the Home Screen to get notifications'
  if (push.state === 'unsupported') return 'This browser cannot get notifications'
  if (push.failed) return 'Not turned on. Try again.'
  return undefined
}

/** Whether the owner can change the switch now. */
const changeable = (push: PushSwitch) => !push.busy && (push.state === 'on' || push.state === 'off')

export type NotificationsSwitchProps = {
  push: PushSwitch
  /** `inline` in the drawer: the label and line, the switch at the end. `stacked` in the 64 px rail. */
  layout: 'inline' | 'stacked'
}

export function NotificationsSwitch({ push, layout }: NotificationsSwitchProps) {
  return (
    <Switch
      label="Notifications"
      hint={notificationsHint(push)}
      checked={push.state === 'on'}
      disabled={!changeable(push)}
      onCheckedChange={push.onCheckedChange}
      layout={layout}
    />
  )
}
