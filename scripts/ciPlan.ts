#!/usr/bin/env node
// `node scripts/ciPlan.ts < changed.txt`: the plan job of ci.yml gives it
// the files a PR changes, one path a line, and it prints one JSON line,
// {"fidelity": true|false, "input": <the first input file or null>}.
// fidelity is false only when no changed file can change the fidelity
// job's result, so that job may pass without its steps on that PR.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const relativeImport = /(?:\bfrom|\bimport)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g

/** The files outside scripts/fidelity/ that its scripts import, at any depth. */
export function fidelityImports(read: (path: string) => string | undefined, starts: readonly string[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...starts]
  for (let path = queue.pop(); path !== undefined; path = queue.pop()) {
    if (seen.has(path)) continue
    const text = read(path)
    if (text === undefined) continue
    seen.add(path)
    for (const match of text.matchAll(relativeImport)) {
      const target = match[1]
      if (target !== undefined) queue.push(normalize(join(dirname(path), target)))
    }
  }
  return new Set([...seen].filter((path) => !path.startsWith('scripts/fidelity/')))
}

/**
 * A changed file can change the fidelity result unless it is Markdown
 * outside web/ and references/, or a file under scripts/ that is neither
 * in scripts/fidelity/ nor imported by it. Every other path counts,
 * a new top-level folder too.
 */
export function isFidelityInput(path: string, imports: ReadonlySet<string>): boolean {
  if (path.startsWith('web/') || path.startsWith('references/') || path.startsWith('scripts/fidelity/')) return true
  if (path.endsWith('.md')) return false
  if (path.startsWith('scripts/')) return imports.has(path)
  return true
}

const isMain = process.argv[1] !== undefined && normalize(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const read = (path: string): string | undefined => {
    try {
      return readFileSync(join(root, path), 'utf8')
    } catch {
      return undefined
    }
  }
  const starts = readdirSync(join(root, 'scripts/fidelity'))
    .filter((name) => name.endsWith('.ts'))
    .map((name) => `scripts/fidelity/${name}`)
  const imports = fidelityImports(read, starts)
  const changed = readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  const input = changed.find((path) => isFidelityInput(path, imports)) ?? null
  // No changed file at all is not proof of anything: run the job.
  console.log(JSON.stringify({ fidelity: changed.length === 0 || input !== null, input }))
}
