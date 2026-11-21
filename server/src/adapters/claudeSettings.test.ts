import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readCompactWindows } from './claudeSettings.ts'

const dir = mkdtempSync(join(tmpdir(), 'settings-'))

describe('Claude settings', () => {
  it('reads the auto-compact window of each model that sets one, and reads a changed file again', async () => {
    const path = join(dir, 'settings.json')
    writeFileSync(
      path,
      JSON.stringify({
        model: 'opus',
        modelSettings: { 'claude-opus-5-5': { autoCompactWindow: 400_000, effort: 'high' }, 'claude-sonnet-5-5': {} },
      }),
    )
    expect(await readCompactWindows(path)).toEqual({ 'claude-opus-5-5': 400_000 })
    writeFileSync(path, JSON.stringify({ modelSettings: { 'claude-opus-5-5': { autoCompactWindow: 300_000 } } }))
    expect(await readCompactWindows(path)).toEqual({ 'claude-opus-5-5': 300_000 })
  })

  it('gives no windows for a missing file, a file that is not JSON, or one with no model settings', async () => {
    expect(await readCompactWindows(join(dir, 'missing.json'))).toEqual({})
    const broken = join(dir, 'broken.json')
    writeFileSync(broken, '{"modelSettings": ')
    expect(await readCompactWindows(broken)).toEqual({})
    const none = join(dir, 'none.json')
    writeFileSync(none, JSON.stringify({ model: 'opus' }))
    expect(await readCompactWindows(none)).toEqual({})
  })
})
