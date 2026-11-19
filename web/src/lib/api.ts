// The typed Hono RPC client of the-bridge server (d-111). Its type comes
// compiled from @bridge/server/client, so web does not infer it again. In
// development Vite sends /api to the server (vite.config.ts).
import { hcWithType } from '@bridge/server/client'

export const api = hcWithType(window.location.origin)
