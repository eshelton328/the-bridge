#!/usr/bin/env node
// pnpm keyboard:slide <trace.json>...: checks keyboard traces for iOS's scroll of the focused field (screen review
// R27, keyboardSlideLib.ts). Prints one JSON line and exits 1 when a trace has a sample that shows a moved page, 2
// when a file is no trace.
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { checkTrace } from './keyboardSlideLib.ts'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: pnpm keyboard:slide <trace.json>...')
  process.exit(2)
}
const traces = files.map((file) => {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    parsed = undefined
  }
  return { file: basename(file), result: checkTrace(parsed) }
})
const bad = traces.filter((trace) => trace.result === undefined)
if (bad.length > 0) {
  console.error(`not a keyboard trace: ${bad.map((trace) => trace.file).join(', ')}`)
  process.exit(2)
}
const ok = traces.every((trace) => trace.result?.slide.length === 0)
console.log(JSON.stringify({ ok, traces: traces.map(({ file, result }) => ({ file, ...result })) }))
process.exit(ok ? 0 : 1)
