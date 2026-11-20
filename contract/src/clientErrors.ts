// The report of an error in the web app, which the app sends to
// POST /api/client-errors so the server's log has it (d-115). The app
// sends one report for each error, from one of these sources, and the
// server answers 204 with no body.
import { z } from 'zod'

/** Where the app caught the error: the React root callbacks, the window events, an event handler, a query or a library diagnostic. */
export const ClientErrorSource = z.enum([
  'reactRoot',
  'windowError',
  'unhandledRejection',
  'handler',
  'query',
  'diagnostic',
])
export type ClientErrorSource = z.infer<typeof ClientErrorSource>

/** No field besides these: a report carries no page text or app state. */
export const ClientErrorReport = z.strictObject({
  source: ClientErrorSource,
  name: z.string().max(200),
  message: z.string().max(2000),
  stack: z.string().max(20_000).optional(),
  /** location.pathname; the server drops any query or hash. */
  route: z.string().max(500),
  /** The X-Request-Id of the failed call, when the error came from one. */
  requestId: z.string().max(200).optional(),
})
export type ClientErrorReport = z.infer<typeof ClientErrorReport>
