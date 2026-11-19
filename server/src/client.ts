// The typed Hono RPC client (d-111). `pnpm codegen` compiles this file's
// types once to dist/ (with the app's routes written out in full), so web
// does not infer them from the routes again.
import { hc } from 'hono/client'
import type { AppType } from './app.ts'

export type Client = ReturnType<typeof hc<AppType>>

/** The client of the server at `baseUrl`, such as the page's own origin behind the Vite proxy. */
export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<AppType>(...args)
