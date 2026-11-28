// Tests for renderArgs.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderArgs } from './renderArgs.ts'

void test('the render rasters on one thread, so a busy machine gives the same image (NCC-177)', () => {
  assert.ok(renderArgs.includes('--num-raster-threads=1'))
})

void test('the render keeps font hinting off, so text widths in CI match a Mac', () => {
  assert.ok(renderArgs.includes('--font-render-hinting=none'))
})

void test('fidelity.ts launches its browser with these flags and no others', () => {
  const source = readFileSync(new URL('./fidelity.ts', import.meta.url), 'utf8')
  const launches = source.match(/chromium\.launch\([^)]*\)/g) ?? []
  assert.deepEqual(launches, ['chromium.launch({ args: [...renderArgs] })'])
})
