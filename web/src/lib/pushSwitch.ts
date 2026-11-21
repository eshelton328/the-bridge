// The Notifications switch of d-118: what it shows, and what turning it on
// or off does. On asks for the permission, subscribes this browser with the
// server's key and saves the subscription; off ends the subscription and
// removes it from the server. A miss goes to the sink that
// errors/globalHandlers.ts sets (lib may not import errors) as a
// PushMissError, with its kind only.
import { pushBrowser, type PushSubscriptionLike, pushSupportOf } from './pushBrowser.ts'
import { readPushKey, removePushSubscription, savePushSubscription } from './pushServer.ts'

/**
 * What the switch shows: `unsupported` and `homeScreen` (iOS Safari outside the home-screen app) are off and
 * disabled; `denied` is off and says it is blocked in Settings; `off` and `on` follow the subscription.
 */
export type PushSwitchState = 'unsupported' | 'homeScreen' | 'denied' | 'off' | 'on'

/** The switch as a screen draws it: its state, whether a change runs, whether the last turn-on missed. */
export type PushSwitch = {
  readonly state: PushSwitchState | 'unknown'
  readonly busy: boolean
  readonly failed: boolean
  readonly onCheckedChange: (on: boolean) => void
}

/** A Web Push step that missed, for report(): its kind only, never a key, an endpoint or the server's message. */
export class PushMissError extends Error {
  readonly miss: string

  constructor(step: 'key' | 'subscribe' | 'save' | 'remove', miss: string) {
    super(`A push ${step} missed: ${miss}`)
    this.name = 'PushMissError'
    this.miss = `${step} ${miss}`
  }
}

let sink: ((error: PushMissError) => void) | undefined

/** Sends each push miss to `next` (errors/globalHandlers.ts sets report()); returns the removal. */
export function setPushMissSink(next: (error: PushMissError) => void): () => void {
  sink = next
  return () => {
    if (sink === next) sink = undefined
  }
}

const missed = (error: PushMissError) => {
  sink?.(error)
}

/** Where the switch stands now, read from the browser. */
export async function readPushState(): Promise<PushSwitchState> {
  const support = pushSupportOf(pushBrowser.env())
  if (support !== 'supported') return support
  const permission = pushBrowser.permission()
  if (permission === 'denied') return 'denied'
  if (permission !== 'granted') return 'off'
  try {
    return (await pushBrowser.subscription()) === null ? 'off' : 'on'
  } catch (error) {
    missed(new PushMissError('subscribe', error instanceof Error ? error.name : 'unknown'))
    return 'off'
  }
}

/** The outcome of a turn on or off: the state, and whether a turn-on missed (the row then says so). */
export type PushTurn = { readonly state: PushSwitchState; readonly failed: boolean }

/**
 * Turns push on. `asked` is the permission request, which the caller starts inside the tap. A miss of the key, the
 * subscribe or the save leaves the switch off with `failed`, and a subscription made before a missed save ends.
 */
export async function turnPushOn(asked: Promise<NotificationPermission>): Promise<PushTurn> {
  let permission: NotificationPermission
  try {
    permission = await asked
  } catch (error) {
    missed(new PushMissError('subscribe', error instanceof Error ? error.name : 'unknown'))
    return { state: 'off', failed: true }
  }
  if (permission === 'denied') return { state: 'denied', failed: false }
  if (permission !== 'granted') return { state: 'off', failed: false }
  const key = await readPushKey()
  if (typeof key !== 'string') {
    missed(new PushMissError('key', key.miss))
    return { state: 'off', failed: true }
  }
  let subscription: PushSubscriptionLike | undefined
  try {
    subscription = await pushBrowser.subscribe(key)
  } catch (error) {
    missed(new PushMissError('subscribe', error instanceof Error ? error.name : 'unknown'))
    return { state: 'off', failed: true }
  }
  if (subscription === undefined) {
    missed(new PushMissError('subscribe', 'no-worker'))
    return { state: 'off', failed: true }
  }
  const saved = await savePushSubscription(subscription.toJSON())
  if (saved === undefined) return { state: 'on', failed: false }
  missed(new PushMissError('save', saved.miss))
  await endSubscription(subscription)
  return { state: 'off', failed: true }
}

/** Ends a subscription in the browser; a miss is reported and the switch still turns off. */
async function endSubscription(subscription: PushSubscriptionLike): Promise<void> {
  try {
    await subscription.unsubscribe()
  } catch (error) {
    missed(new PushMissError('remove', error instanceof Error ? error.name : 'unknown'))
  }
}

/** Turns push off: ends this browser's subscription, then removes it from the server. */
export async function turnPushOff(): Promise<PushTurn> {
  let subscription: PushSubscriptionLike | null
  try {
    subscription = await pushBrowser.subscription()
  } catch (error) {
    missed(new PushMissError('remove', error instanceof Error ? error.name : 'unknown'))
    return { state: 'off', failed: false }
  }
  if (subscription === null) return { state: 'off', failed: false }
  const endpoint = subscription.endpoint
  await endSubscription(subscription)
  const removed = await removePushSubscription(endpoint)
  if (removed !== undefined) missed(new PushMissError('remove', removed.miss))
  return { state: 'off', failed: false }
}
