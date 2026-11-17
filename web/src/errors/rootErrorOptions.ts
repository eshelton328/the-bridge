// React 19's root error hooks, passed to createRoot in app/main.ts and the
// canvas mount. They see every render error once, with its component
// stack, so boundaries do not report (d-084). They stay on in development:
// the console sink logs what React would have logged.
import type { RootOptions } from 'react-dom/client'
import { report } from './reporter.ts'

export const rootErrorOptions = {
  onCaughtError: (error, info) => {
    report(error, 'root-caught', info.componentStack)
  },
  onUncaughtError: (error, info) => {
    report(error, 'root-uncaught', info.componentStack)
  },
  onRecoverableError: (error, info) => {
    report(error, 'root-recoverable', info.componentStack)
  },
} satisfies RootOptions
