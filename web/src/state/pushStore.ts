// The Notifications switch's client state (d-118): where Web Push stands in
// this browser, whether a turn on or off runs, and whether the last turn-on
// missed. The Settings page entry reads it with usePushSwitch() and passes it
// to the screen, which draws it in the Notifications section (d-119). The browser and
// server work is in lib/pushSwitch.ts.
import { useEffect } from 'react'
import { pushBrowser } from '../lib/pushBrowser.ts'
import { type PushSwitch, type PushSwitchState, readPushState, turnPushOff, turnPushOn } from '../lib/pushSwitch.ts'
import { createAppStore } from './createAppStore.ts'

type PushState = {
  /** `unknown` until the first read of the browser. */
  status: PushSwitchState | 'unknown'
  busy: boolean
  /** Whether the last turn on or off missed. */
  failed: boolean
  actions: {
    /** Reads the state from the browser again, as the permission can change in Settings meanwhile. */
    refresh: () => Promise<void>
    /** Turns push on or off. Call it in the tap's handler: turning on asks for the permission before any wait. */
    setOn: (on: boolean) => Promise<void>
  }
}

const usePushStore = createAppStore<PushState>('push', (set, get) => {
  // Each turn or read takes the next number; a read that ends after a later one began is dropped.
  let latest = 0
  return {
    status: 'unknown',
    busy: false,
    failed: false,
    actions: {
      refresh: async () => {
        if (get().busy) return
        latest += 1
        const mine = latest
        const status = await readPushState()
        if (mine === latest && !get().busy) set({ status }, undefined, 'push/refresh')
      },
      setOn: async (on) => {
        if (get().busy) return
        // iOS asks for the permission only within the tap, so the request starts before the first await.
        const asked = on ? pushBrowser.requestPermission() : undefined
        latest += 1
        set({ busy: true, failed: false }, undefined, 'push/start')
        const turn = asked === undefined ? await turnPushOff() : await turnPushOn(asked)
        set({ status: turn.state, failed: turn.failed, busy: false }, undefined, 'push/end')
      },
    },
  }
})

/** Where push stands. @public */
export const usePushStatus = (): PushState['status'] => usePushStore((s) => s.status)
/** Whether a turn on or off runs. @public */
export const usePushBusy = (): boolean => usePushStore((s) => s.busy)
/** Whether the last turn on or off missed. @public */
export const usePushFailed = (): boolean => usePushStore((s) => s.failed)
/** The push actions; a stable reference. @public */
export const usePushActions = (): PushState['actions'] => usePushStore((s) => s.actions)

/**
 * The switch for a screen: the store's values and the change handler. It reads the browser when the page mounts and
 * each time the page shows again, so a permission changed in Settings shows when the owner comes back.
 */
export function usePushSwitch(): PushSwitch {
  const state = usePushStatus()
  const busy = usePushBusy()
  const failed = usePushFailed()
  const { refresh, setOn } = usePushActions()
  useEffect(() => {
    void refresh()
    const onShow = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onShow)
    return () => {
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [refresh])
  return {
    state,
    busy,
    failed,
    onCheckedChange: (on) => {
      void setOn(on)
    },
  }
}

/** The store itself, for tests only: `pushStore.getState()`. */
export const pushStore = usePushStore
