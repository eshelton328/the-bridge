// /api/client-errors: POST / takes one ClientErrorReport from the web app
// and writes it to the log at error, then answers 204 (d-115). The JSON
// content type comes first, so a cross-site form cannot post or use up the
// quota; then the rate limit, so a crash loop costs no parse and no log
// line; then a 32 KB limit and the contract's schema.
import { ClientErrorReport } from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { type AppEnv, errorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { RateLimit } from '../rateLimit.ts'

const maxBytes = 32 * 1024

export function clientErrorsRoutes(log: Logger, limit: RateLimit) {
  return new Hono<AppEnv>().post(
    '/',
    async (c, next) => {
      if (!/^application\/json(;|$)/i.test(c.req.header('Content-Type') ?? ''))
        return errorJson(c, 'invalid-input', {
          message: 'the report must be JSON',
          issues: ['Content-Type must be application/json'],
        })
      // Auth compares the login in any case, so the quota does too: one owner, one quota.
      if (!limit.take(c.req.header('Tailscale-User-Login')?.toLowerCase() ?? 'local'))
        return errorJson(c, 'too-many-requests', { message: 'too many error reports; wait a minute' })
      await next()
      return undefined
    },
    bodyLimit({
      maxSize: maxBytes,
      onError: (c: Context<AppEnv>) =>
        errorJson(c, 'invalid-input', { message: 'the report is too large', issues: ['the body is over 32 KB'] }),
    }),
    async (c) => {
      const raw: unknown = await c.req.json().catch(() => undefined)
      const report = ClientErrorReport.safeParse(raw)
      if (!report.success)
        return errorJson(c, 'invalid-input', {
          message: 'the report does not match the contract',
          issues: report.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`),
        })
      const [route = ''] = report.data.route.split(/[?#]/)
      log.error('client error', { requestId: c.get('requestId'), report: { ...report.data, route } })
      return c.body(null, 204)
    },
  )
}
