#!/usr/bin/env node
// Fails when a Figma state has no story (d-082): each state file
// web/src/pages/<page>/states/<id>.ts must be a key of states/index.ts, and
// a story file in the page's screens/ must export a story named after it
// (nextStep -> NextStep) that renders `<page>States.<id>`.
// Prints one JSON object; exits 1 on any problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findBoards } from './genRegistry.ts'

const pagesDir = fileURLToPath(new URL('../web/src/pages/', import.meta.url))
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const problems: string[] = []
let states = 0

for (const { page, states: ids } of findBoards(pagesDir)) {
  const index = readFileSync(join(pagesDir, page, 'states', 'index.ts'), 'utf8')
  const screens = join(pagesDir, page, 'screens')
  const stories = existsSync(screens)
    ? readdirSync(screens)
        .filter((f) => f.endsWith('.stories.tsx'))
        .map((f) => readFileSync(join(screens, f), 'utf8'))
        .join('\n')
    : ''
  for (const id of ids) {
    states += 1
    if (!new RegExp(`\\b${id}\\b`).test(index)) problems.push(`pages/${page}/states/index.ts does not list ${id}`)
    if (!new RegExp(`export const ${pascal(id)}: Story\\b`).test(stories))
      problems.push(`pages/${page}/screens has no story ${pascal(id)} for states/${id}.ts`)
    else if (!stories.includes(`${page}States.${id}`))
      problems.push(`the story ${pascal(id)} does not render ${page}States.${id}`)
  }
}

console.log(JSON.stringify({ ok: problems.length === 0, states, problems }))
process.exit(problems.length ? 1 : 0)
