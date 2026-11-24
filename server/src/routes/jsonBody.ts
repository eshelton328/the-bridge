// The JSON body checks of the POST routes. A route takes only JSON, so a
// cross-site form cannot post, and checks the body with the contract in
// hono's validator, so the typed client knows the body (d-111).
import type { Context, Next } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { validator } from 'hono/validator'
import type { z } from 'zod'
import { type AppEnv, errorJson } from '../errors.ts'

/** The most bytes in the body of a POST route that takes a small JSON object: each one but the prompt's. */
export const maxSmallJsonBytes = 4096

/** Answers 400 to a body over `maxSize` bytes before it reads the rest, so a large body cannot fill memory. */
export const jsonLimit = (maxSize: number) =>
  bodyLimit({
    maxSize,
    onError: (c: Context<AppEnv>) =>
      errorJson(c, 'invalid-input', { message: 'the request is too large', issues: ['the body is too large'] }),
  })

/** Answers 400 to a body over `maxSmallJsonBytes`. */
export const smallJson = jsonLimit(maxSmallJsonBytes)

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

/** Checks the query with `schema`; an issue names the key and the rule only, never the value. */
export const queryOf = <S extends z.ZodType>(schema: S) =>
  validator('query', (value, c: Context<AppEnv>) => {
    const parsed = schema.safeParse(value)
    if (parsed.success) return parsed.data
    return errorJson(c, 'invalid-input', {
      message: 'the query does not match the contract',
      issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'query'}: ${i.code}`),
    })
  })

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
