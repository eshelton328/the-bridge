// Tests for devServer.ts. Run with `pnpm test:scripts`. They start a local HTTPS server with a self-signed certificate
// that `openssl` makes, as a dev server with one would be.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { isDevServer } from './devServer.ts'

function selfSigned(): { key: Buffer; cert: Buffer } {
  const dir = mkdtempSync(join(tmpdir(), 'dev-server-test-'))
  const key = join(dir, 'key.pem')
  const cert = join(dir, 'cert.pem')
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      '1',
      '-subj',
      '/CN=127.0.0.1',
    ],
    { stdio: 'ignore' },
  )
  return { key: readFileSync(key), cert: readFileSync(cert) }
}

async function serve(type: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer(selfSigned(), (_req, res) => {
    res.writeHead(200, { 'content-type': type })
    res.end(type === 'text/javascript' ? 'export {}' : '<!doctype html>')
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('the test server has no port')
  return {
    url: `https://127.0.0.1:${String(address.port)}`,
    close: () =>
      new Promise((done) => {
        server.close(() => {
          done()
        })
      }),
  }
}

void test('a dev server with a self-signed certificate counts, as the browser ignores the certificate', async () => {
  const dev = await serve('text/javascript')
  try {
    assert.equal(await isDevServer(dev.url), true)
  } finally {
    await dev.close()
  }
})

void test('a build preview that answers with its index.html does not count, nor a port with no server', async () => {
  const preview = await serve('text/html')
  try {
    assert.equal(await isDevServer(preview.url), false)
  } finally {
    await preview.close()
  }
  assert.equal(await isDevServer('http://127.0.0.1:9'), false)
})
