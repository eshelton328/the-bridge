// Whether a URL is a Vite dev server, for a script that opens `?state=` pages (keyboardCheck.ts): only a dev server
// reads `?state=`, and a build ignores it (d-134). It asks `/@vite/client` through Playwright's request API with
// `ignoreHTTPSErrors`, the TLS policy of the script's browser, so a dev server with a self-signed certificate passes.
import { request } from 'playwright'
import { isViteClient } from './keyboardCheckLib.ts'

export async function isDevServer(url: string): Promise<boolean> {
  const api = await request.newContext({ ignoreHTTPSErrors: true })
  try {
    const answer = await api.get(`${url}/@vite/client`, { timeout: 10_000 })
    return isViteClient(answer.status(), answer.headers()['content-type'])
  } catch {
    return false
  } finally {
    await api.dispose()
  }
}
