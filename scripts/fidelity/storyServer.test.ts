// Tests for storyServer.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serveStatic, stateForFrame, storyForState } from './storyServer.ts'

void test('finds the state file that lists a frame code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pages-'))
  try {
    mkdirSync(join(dir, 'inbox', 'states'), { recursive: true })
    writeFileSync(join(dir, 'inbox', 'states', 'nextStep.ts'), "frames: [{ id: 'D1', node: '346:5' }]")
    writeFileSync(join(dir, 'inbox', 'states', 'filterOpen.ts'), "frames: [{ id: 'D12', node: '1:1' }]")
    writeFileSync(join(dir, 'inbox', 'states', 'index.ts'), "id: 'D1'")
    assert.equal(stateForFrame('inbox', 'D1', dir), 'nextStep')
    assert.equal(stateForFrame('inbox', 'D12', dir), 'filterOpen')
    assert.equal(stateForFrame('inbox', 'D2', dir), undefined)
    assert.equal(stateForFrame('home', 'D1', dir), undefined)
  } finally {
    rmSync(dir, { recursive: true })
  }
})

void test('finds the story named after the state in the page screens', () => {
  const index = JSON.stringify({
    v: 5,
    entries: {
      'pages-inbox--next-step': {
        id: 'pages-inbox--next-step',
        type: 'story',
        importPath: './src/pages/inbox/screens/InboxScreen.stories.tsx',
        exportName: 'NextStep',
      },
      'errors-x--next-step': {
        id: 'errors-x--next-step',
        type: 'story',
        importPath: './src/errors/X.stories.tsx',
        exportName: 'NextStep',
      },
    },
  })
  assert.equal(storyForState('inbox', 'nextStep', index), 'pages-inbox--next-step')
  assert.equal(storyForState('home', 'nextStep', index), undefined)
})

void test('serves files from its folder and nothing outside it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'static-'))
  writeFileSync(join(dir, 'index.json'), '{"ok":true}')
  const server = await serveStatic(dir)
  try {
    const ok = await fetch(`${server.origin}/index.json`)
    assert.equal(ok.headers.get('content-type'), 'application/json')
    assert.equal(await ok.text(), '{"ok":true}')
    assert.equal((await fetch(`${server.origin}/../../etc/passwd`)).status, 404)
  } finally {
    await server.close()
    rmSync(dir, { recursive: true })
  }
})
