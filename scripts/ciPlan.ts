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

const codeFile = /\.(?:ts|tsx|js|mjs|cjs|jsx)$/

/** The paths an import of `target` from `from` can name: as written, and with an extension or index file when it has none. */
function importPaths(from: string, target: string): string[] {
  const path = normalize(join(dirname(from), target))
  if (codeFile.test(path)) return [path]
  return [path, ...['.ts', '.tsx', '.js', '/index.ts', '/index.tsx'].map((end) => path + end)]
}

/**
 * The files under scripts/ that the given files import, at any depth: the
 * fidelity scripts and the web build (Storybook loads web/vite.config.ts,
 * which imports scripts/keyboardTracePlugin.ts). An import whose file
 * cannot be read stays in the set, so a PR that deletes or breaks it still
 * counts as a fidelity input.
 */
export function scriptInputs(read: (path: string) => string | undefined, starts: readonly string[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...starts]
  for (let path = queue.pop(); path !== undefined; path = queue.pop()) {
    if (seen.has(path)) continue
    seen.add(path)
    const text = read(path)
    if (text === undefined) continue
    for (const match of text.matchAll(relativeImport)) {
      const target = match[1]
      if (target !== undefined) queue.push(...importPaths(path, target))
    }
  }
  return new Set([...seen].filter((path) => path.startsWith('scripts/') && !path.startsWith('scripts/fidelity/')))
}

/** The fidelity scripts and the hand-written code files of web/, the starts of scriptInputs. */
export function fidelityStarts(list: (dir: string) => readonly string[]): string[] {
  const skip = /(?:^|\/)(?:node_modules|styled-system|dist|storybook-static)\//
  return [...list('scripts/fidelity'), ...list('web')].filter((path) => codeFile.test(path) && !skip.test(path))
}

/**
 * A changed file can change the fidelity result unless it is Markdown
 * outside web/, references/ and scripts/fidelity/, or a file under
 * scripts/ that is neither in scripts/fidelity/ nor in scriptInputs. Every other path counts,
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
  const list = (dir: string): string[] =>
    readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' }).map((name) => `${dir}/${name}`)
  const imports = scriptInputs(read, fidelityStarts(list))
  const changed = readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  const input = changed.find((path) => isFidelityInput(path, imports)) ?? null
  // No changed file at all is not proof of anything: run the job.
  console.log(JSON.stringify({ fidelity: changed.length === 0 || input !== null, input }))
}
