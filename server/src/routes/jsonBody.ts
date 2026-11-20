// The JSON body checks of the POST routes. A route takes only JSON, so a
// cross-site form cannot post, and checks the body with the contract in
// hono's validator, so the typed client knows the body (d-111).
import type { Context, Next } from 'hono'
import { validator } from 'hono/validator'
import type { z } from 'zod'
import { type AppEnv, errorJson } from '../errors.ts'

/** Answers 400 to a body that is not JSON, or malformed JSON, before hono's validator could throw it as a 500. */
export const jsonOnly = async (c: Context<AppEnv>, next: Next) => {
  if (!/^application\/json(;|$)/i.test(c.req.header('Content-Type') ?? ''))
    return errorJson(c, 'invalid-input', {
      message: 'the request must be JSON',
      issues: ['Content-Type must be application/json'],
    })
  // The validator after this reads the parsed body from hono's cache.
  const read = await c.req.json().then(
    () => true,
    () => false,
  )
  if (!read)
    return errorJson(c, 'invalid-input', { message: 'the request must be JSON', issues: ['body: invalid_json'] })
  await next()
  return undefined
}

/** Checks the body with `schema`; an issue names the field and the rule only, never the text. */
export const jsonBody = <S extends z.ZodType>(schema: S) =>
  validator('json', (value, c: Context<AppEnv>) => {
    const parsed = schema.safeParse(value)
    if (parsed.success) return parsed.data
    return errorJson(c, 'invalid-input', {
      message: 'the request does not match the contract',
      issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.code}`),
    })
  })
