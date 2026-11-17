#!/usr/bin/env node
// Step 1 of the fidelity loop: writes references/<page>/<frameId>/frame.json
// and note.txt for every coded frame (D1, T3, M12 …) on one Figma page,
// from a saved get_metadata reply. It makes no Figma call. frame.png comes
// from get_screenshot and is saved by hand (see scripts/fidelity/AGENTS.md);
// this script reports the frames that still lack one.
//
//   node scripts/fidelity/buildReferences.ts --page inbox \
//     --metadata ~/.local/share/ncc/claude-design/ncc-1701-screens/inbox-metadata.xml
//
// An existing frame.json keeps its `tolerance` and any `exclude` entry
// added by hand. Exceptions with reasons live beside it in exceptions.json,
// which this script never writes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { buildFrameRef, findFrames, findNotes, parseMetadata } from './figmaMetadata.ts'
import { readFrameRef, referencesDir } from './references.ts'

const { values } = parseArgs({
  options: {
    page: { type: 'string' },
    metadata: { type: 'string' },
    'file-key': { type: 'string', default: 'PZoW9BBu43qRgon1KhJcwU' },
    source: { type: 'string', default: 'get_metadata of the page, saved 2026-11-16' },
  },
})
const { page, metadata } = values
if (page === undefined || metadata === undefined) {
  console.error('Usage: buildReferences.ts --page <page> --metadata <get_metadata.xml> [--file-key <key>]')
  process.exit(2)
}

const root = parseMetadata(readFileSync(metadata, 'utf8'))
const notes = findNotes(root)
const out = join(referencesDir, page)
const missingPng: string[] = []
const missingNote: string[] = []
let written = 0

for (const frame of findFrames(root)) {
  const ref = buildFrameRef(frame, values['file-key'], values.source)
  const dir = join(out, ref.frameId)
  mkdirSync(dir, { recursive: true })
  const old = existsSync(join(dir, 'frame.json')) ? readFrameRef(page, ref.frameId) : undefined
  if (old) {
    ref.tolerance = old.tolerance
    const ids = new Set(ref.exclude.map((e) => e.id))
    ref.exclude.push(...old.exclude.filter((e) => !ids.has(e.id)))
  }
  writeFileSync(join(dir, 'frame.json'), `${JSON.stringify(ref, null, 2)}\n`)
  const note = notes.get(frame.name)
  if (note === undefined) missingNote.push(ref.frameId)
  else writeFileSync(join(dir, 'note.txt'), `${note}\n`)
  if (!existsSync(join(dir, 'frame.png'))) missingPng.push(ref.frameId)
  written += 1
}

console.log(JSON.stringify({ ok: missingPng.length === 0, page, frames: written, missingPng, missingNote }))
process.exit(missingPng.length ? 1 : 0)
