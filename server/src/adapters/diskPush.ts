// The push store on disk (d-118): vapid.json and subscriptions.json in a
// 0700 folder beside the database, each file 0600 and replaced in one
// rename. The keys are made once, with Node's crypto. A fault gives its
// errno code only; no key or endpoint goes into a log or an error.
import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { maxPushSubscriptions, PushSubscriptionRequest } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import {
  canonicalEndpoint,
  type PushStore,
  type PushStoreError,
  type StoredSubscription,
  type VapidKeys,
} from '../services/push.ts'

const Keys = z.object({ publicKey: z.string().min(1), privateKey: z.string().min(1) })
const Stored = z.array(PushSubscriptionRequest.extend({ savedAt: z.number() }))

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

/** A new P-256 key pair in the form VAPID uses. */
function newKeys(): VapidKeys {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const pub = publicKey.export({ format: 'jwk' })
  const priv = privateKey.export({ format: 'jwk' })
  if (pub.x === undefined || pub.y === undefined || priv.d === undefined) throw new Error('no EC key parts')
  const point = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')])
  return { publicKey: point.toString('base64url'), privateKey: priv.d }
}

export function createDiskPushStore(root: string, now: () => number = Date.now): PushStore {
  const keysFile = join(root, 'vapid.json')
  const listFile = join(root, 'subscriptions.json')
  // One change at a time, so two saves cannot lose one.
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }
  const folder = async () => {
    await mkdir(root, { recursive: true, mode: 0o700 })
    await chmod(root, 0o700)
  }
  const readJson = async (path: string): Promise<unknown> => {
    try {
      return JSON.parse(await readFile(path, 'utf8'))
    } catch (thrown) {
      if (codeOf(thrown) === 'ENOENT') return undefined
      throw thrown
    }
  }
  const writeJson = async (path: string, value: unknown) => {
    await folder()
    const temporary = `${path}.${randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(value), { mode: 0o600 })
    await rename(temporary, path)
  }
  const list = async (): Promise<StoredSubscription[]> => {
    const raw = await readJson(listFile)
    const parsed = Stored.safeParse(raw ?? [])
    return parsed.success ? parsed.data : []
  }
  const guarded = async <T>(work: () => Promise<T>): Promise<Result<T, PushStoreError>> => {
    try {
      return ok(await work())
    } catch (thrown) {
      return err({ reason: 'failed', code: codeOf(thrown) })
    }
  }

  return {
    keys: () =>
      serial(() =>
        guarded(async () => {
          const known = Keys.safeParse(await readJson(keysFile))
          if (known.success) return known.data
          const keys = newKeys()
          await writeJson(keysFile, keys)
          return keys
        }),
      ),
    subscriptions: () => serial(() => guarded(list)),
    save: (subscription) =>
      serial(() =>
        guarded(async () => {
          const others = (await list()).filter((s) => s.endpoint !== subscription.endpoint)
          const next = [...others, { ...subscription, savedAt: now() }].slice(-maxPushSubscriptions)
          await writeJson(listFile, next)
        }),
      ),
    remove: (endpoint) =>
      serial(() =>
        guarded(async () => {
          const all = await list()
          // Both in the written form, so an endpoint saved before the routes wrote it is still found.
          const left = all.filter((s) => canonicalEndpoint(s.endpoint) !== canonicalEndpoint(endpoint))
          if (left.length !== all.length) await writeJson(listFile, left)
        }),
      ),
  }
}
