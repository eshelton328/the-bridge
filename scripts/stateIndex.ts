// Adds a state to a page's states/index.ts for `pnpm new state`. The file is
// written by hand after `pnpm new page`: its key order matters (a page's
// first key is its default state) and it may hold comments, so the new
// state goes in at the end and nothing else in the file changes.

/**
 * Returns `source` with `import { id } from './id.ts'` after its last import
 * and `id,` as the last key of `export const <page>States = { … }`. Throws
 * when the file has no such object or already has the key.
 */
export function addStateToIndex(source: string, page: string, id: string): string {
  const object = new RegExp(`^export const ${page}States = \\{\\n([\\s\\S]*?)^\\}`, 'm').exec(source)
  if (object === null) throw new Error(`states/index.ts has no "export const ${page}States = {" object.`)
  const body = object[1] ?? ''
  if (new RegExp(`^\\s*${id}\\s*[,:]`, 'm').test(body)) throw new Error(`${page}States has the key ${id} already.`)
  const closing = object.index + object[0].length - 1
  const withKey = `${source.slice(0, closing)}  ${id},\n${source.slice(closing)}`

  const line = `import { ${id} } from './${id}.ts'\n`
  const imports = [...withKey.matchAll(/^import [^\n]*\n/gm)]
  const last = imports.at(-1)
  const at = last === undefined ? object.index : last.index + last[0].length
  return `${withKey.slice(0, at)}${line}${withKey.slice(at)}`
}
