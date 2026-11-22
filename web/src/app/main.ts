// The app's entry: it marks the page as the app, blocks page zoom, starts
// the dev keyboard trace and the composer's proxy focus, adds the client error sender when the app reads
// the live server and mounts the app on #root (mountApp.ts).
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { installClientErrorSender } from '../errors/clientErrorSender.ts'
import { markApp } from './appMarker.ts'
import { installKeyboardProxy, proxyFocusApplies } from './keyboardProxy.ts'
import { startKeyboardTraceIfOn } from './keyboardTraceSwitch.ts'
import { mountApp } from './mountApp.ts'
import { blockPageZoom } from './pageZoom.ts'
import { router } from './router.ts'

const container = document.getElementById('root')
if (container === null) throw new Error('index.html has no #root element')

markApp()
blockPageZoom()
// The keyboard trace, dev only: with `?keyboard-trace` the whole page, or,
// when the dev server's switch is on, one session per keyboard open in a
// Workspaces chat, which follows the router's location. It samples the
// viewport and the shell's keyboard inset and sends them to the dev server
// (keyboardTraceSwitch.ts, keyboardTrace.ts, keyboardChatTrace.ts). A build
// drops all three.
if (import.meta.env.DEV) {
  void startKeyboardTraceIfOn({
    route: {
      current: () => ({ pathname: router.state.location.pathname, search: router.state.location.searchStr }),
      subscribe: (onChange) =>
        router.subscribe('onResolved', () => {
          onChange()
        }),
    },
  })
}
// A touch tap gives the composer the focus through a proxy field already above the keyboard, so iOS does not slide the
// page to bring the field into view (screen review R27, keyboardProxy.ts).
if (proxyFocusApplies()) installKeyboardProxy()
// Each report goes to the server's log too, in a build that reads the live server (d-115, d-117); a production build
// reads its fixtures and sends nothing.
installClientErrorSender()
mountApp(container)
