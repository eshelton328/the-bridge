// The Notifications switch's client state (d-118): where Web Push stands in
// this browser, whether a turn on or off runs, whether the last turn-on
// missed, and whether the last save of the "Show message preview" choice
// missed (the choice itself is a device setting, state/settingsStore.ts). The Settings page entry reads it with usePushSwitch() and passes it
// to the screen, which draws it in the Notifications section (d-119). The browser and
// server work is in lib/pushSwitch.ts.
import { useEffect } from 'react'
import { pushBrowser } from '../lib/pushBrowser.ts'
import {
  type PushSwitch,
  type PushSwitchState,
  readPushState,
  savePushPreview,
  turnPushOff,
  turnPushOn,
} from '../lib/pushSwitch.ts'
import { createAppStore } from './createAppStore.ts'

type PushState = {
  /** `unknown` until the first read of the browser. */
  status: PushSwitchState | 'unknown'
  busy: boolean
  /** Whether the last turn on or off missed. */
  failed: boolean
  /** Whether the last save of the preview choice missed. */
  previewFailed: boolean
  actions: {
    /** Reads the state from the browser again, as the permission can change in Settings meanwhile. */
    refresh: () => Promise<void>
    /**
     * Turns push on (with the preview choice) or off. Call it in the tap's handler: turning on asks for the permission
     * before any wait.
     */
    setOn: (on: boolean, preview: boolean) => Promise<void>
    /**
     * Saves the preview choice with the subscription while push is on; with push off the next turn on sends it.
     * Resolves false when the save missed, so the caller puts the device setting back.
     */
    setPreview: (preview: boolean) => Promise<boolean>
  }
}

const usePushStore = createAppStore<PushState>('push', (set, get) => {
  // Each turn or read takes the next number; a read that ends after a later one began is dropped.
  let latest = 0
  return {
    status: 'unknown',
    busy: false,
    failed: false,
    previewFailed: false,
    actions: {
      refresh: async () => {
        if (get().busy) return
        latest += 1
        const mine = latest
        const status = await readPushState()
        if (mine === latest && !get().busy) set({ status }, undefined, 'push/refresh')
      },
      setOn: async (on, preview) => {
        if (get().busy) return
        // iOS asks for the permission only within the tap, so the request starts before the first await.
        const asked = on ? pushBrowser.requestPermission() : undefined
        latest += 1
        set({ busy: true, failed: false, previewFailed: false }, undefined, 'push/start')
        const turn = asked === undefined ? await turnPushOff() : await turnPushOn(asked, preview)
        set({ status: turn.state, failed: turn.failed, busy: false }, undefined, 'push/end')
      },
      setPreview: async (preview) => {
        if (get().busy || get().status !== 'on') {
          set({ previewFailed: false }, undefined, 'push/previewLater')
          return true
        }
        set({ busy: true, previewFailed: false }, undefined, 'push/previewStart')
        const saved = await savePushPreview(preview)
        set({ busy: false, previewFailed: !saved }, undefined, 'push/previewEnd')
        return saved
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
/** Whether the last save of the preview choice missed. @public */
export const usePushPreviewFailed = (): boolean => usePushStore((s) => s.previewFailed)
/** The push actions; a stable reference. @public */
export const usePushActions = (): PushState['actions'] => usePushStore((s) => s.actions)

/**
 * The switch for a screen: the store's values and the change handlers. It reads the browser when the page mounts and
 * each time the page shows again, so a permission changed in Settings shows when the owner comes back. `preview` is
 * the device setting; `onPreview` keeps a new choice there, and the switch then saves it with the subscription.
 */
export function usePushSwitch(preview: boolean, onPreview: (preview: boolean) => void): PushSwitch {
  const state = usePushStatus()
  const busy = usePushBusy()
  const failed = usePushFailed()
  const previewFailed = usePushPreviewFailed()
  const { refresh, setOn, setPreview } = usePushActions()
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
      void setOn(on, preview)
    },
    preview,
    previewFailed,
    onPreviewChange: (next) => {
      onPreview(next)
      // A save that missed puts the choice back, so the device never says off while the server still sends lines.
      void setPreview(next).then((saved) => {
        if (!saved) onPreview(!next)
      })
    },
  }
}

/** The store itself, for tests only: `pushStore.getState()`. */
export const pushStore = usePushStore
