// The app's side of Web Push (d-118) that runs once per page: it registers
// the service worker (public/sw.js), listens for its open-chat messages and
// starts the "seen" beat. Once the worker is registered it saves the push
// subscription again with the "Show message preview" choice, so a
// subscription from before the choice gets the new payload. mountApp calls it only in the real app: never in a
// test or Storybook, and only with a service worker in a secure context. A
// registration that fails goes to report() as its kind only.
import type { ChatId } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { sendPushSeen } from '../../lib/pushServer.ts'
import { savePushPreviewAtStart } from '../../lib/pushSwitch.ts'
import { listenForOpenChat } from './openChatMessages.ts'
import { startSeenBeat } from './seenBeat.ts'

/** A registration of the worker that failed, for report(): the error's name only. */
class ServiceWorkerMissError extends Error {
  readonly miss: string

  constructor(miss: string) {
    super(`The service worker did not register: ${miss}`)
    this.name = 'ServiceWorkerMissError'
    this.miss = miss
  }
}

/** Push runs here: a service worker in a secure context. */
export const pushRuns = (): boolean => 'serviceWorker' in navigator && window.isSecureContext

/** Registers the worker, listens for its messages and starts the beat; returns their stop. */
export function startPush(openChat: (chat: ChatId) => void, preview: () => boolean): () => void {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then(() => savePushPreviewAtStart(preview()))
    .catch((error: unknown) => {
      report(new ServiceWorkerMissError(error instanceof Error ? error.name : 'unknown'), 'handler')
    })
  const stopListening = listenForOpenChat(navigator.serviceWorker, openChat)
  const stopBeat = startSeenBeat({ send: () => void sendPushSeen() })
  return () => {
    stopListening()
    stopBeat()
  }
}
