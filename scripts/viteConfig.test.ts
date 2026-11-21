// The dev server's `/api` proxy in web/vite.config.ts has no default target: a Vite started without
// BRIDGE_SERVER_URL once sent a probe's taps to the served server at 127.0.0.1:5181 and started real chats in the
// owner's herdr session. These tests hold the rule: `vite` and `vite preview` stop without the variable, and the
// build, Vitest, Storybook and tools that only load the config run without it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import config, { apiProxy, requireServerUrl } from '../web/vite.config.ts'

const message = /Set BRIDGE_SERVER_URL to the bridge server for \/api/

void test('vite and vite preview stop when BRIDGE_SERVER_URL is unset or empty', () => {
  for (const env of [{}, { BRIDGE_SERVER_URL: '' }, { BRIDGE_SERVER_URL: '  ' }]) {
    const plugin = requireServerUrl(env)
    assert.throws(() => {
      plugin.configureServer()
    }, message)
    assert.throws(() => {
      plugin.configurePreviewServer()
    }, message)
  }
})

void test('with BRIDGE_SERVER_URL set, the servers start and the proxy sends /api to it', () => {
  const env = { BRIDGE_SERVER_URL: 'http://127.0.0.1:5999' }
  const plugin = requireServerUrl(env)
  plugin.configureServer()
  plugin.configurePreviewServer()
  assert.deepEqual(apiProxy(env), { '/api': 'http://127.0.0.1:5999' })
})

void test('Vitest and Storybook servers start without BRIDGE_SERVER_URL, with no proxy', () => {
  for (const env of [{ VITEST: 'true' }, { STORYBOOK: 'true' }]) {
    requireServerUrl(env).configureServer()
    assert.deepEqual(apiProxy(env), {})
  }
})

void test('the config loads without BRIDGE_SERVER_URL, has no default target and adds the check', () => {
  // The build and knip load the config the same way; with the variable unset there is no proxy, so no 5181.
  if (process.env.BRIDGE_SERVER_URL === undefined) assert.deepEqual(config.server?.proxy, {})
  const names = [config.plugins ?? []].flat(3).map((plugin) => (plugin && 'name' in plugin ? plugin.name : ''))
  assert.ok(names.includes('bridge-require-server-url'))
})

void test('the check reads process.env when the server starts', () => {
  const saved = process.env.BRIDGE_SERVER_URL
  const plugin = requireServerUrl()
  try {
    Reflect.deleteProperty(process.env, 'BRIDGE_SERVER_URL')
    if (process.env.VITEST === undefined && process.env.STORYBOOK === undefined) {
      assert.throws(() => {
        plugin.configureServer()
      }, message)
    }
    process.env.BRIDGE_SERVER_URL = 'http://127.0.0.1:5998'
    plugin.configureServer()
  } finally {
    if (saved === undefined) Reflect.deleteProperty(process.env, 'BRIDGE_SERVER_URL')
    else process.env.BRIDGE_SERVER_URL = saved
  }
})
