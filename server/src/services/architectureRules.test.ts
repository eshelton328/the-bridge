import { ArchitectureModel } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { modelOf } from './architectureRules.ts'

const pkg = (path: string, body: object) => ({ path, text: JSON.stringify(body) })

describe('modelOf', () => {
  it('gives a part for each package, sorted by path, with "." for the root, arrows and the Stack', () => {
    const model = modelOf([
      pkg('web/package.json', { name: '@x/web', dependencies: { '@x/shared': 'workspace:*', react: '^19' } }),
      pkg('package.json', { name: 'root', devDependencies: { typescript: '5' } }),
      pkg('shared/package.json', { name: '@x/shared', dependencies: { zod: '4' } }),
    ])
    expect(model).not.toBeNull()
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
    expect(model?.parts.map((p) => [p.id, p.name, p.typeLine])).toEqual([
      ['p0', 'root', '.'],
      ['p1', '@x/shared', 'shared'],
      ['p2', '@x/web', 'web'],
    ])
    expect(model?.arrows).toEqual([{ from: 'p2', to: 'p1', label: 'depends on' }])
    expect(model?.stack).toEqual([
      { name: 'Runtime', badges: ['react', 'zod'] },
      { name: 'Build', badges: ['typescript'] },
    ])
  })

  it('gives the same model for the same files in any order', () => {
    const files = [pkg('b/package.json', { name: 'b' }), pkg('a/package.json', { name: 'a' })]
    expect(modelOf(files)).toEqual(modelOf([...files].reverse()))
  })

  it('skips a file that is not a JSON object, a "__proto__" key and a key that is not its own', () => {
    const model = modelOf([
      { path: 'bad/package.json', text: '{' },
      { path: 'list/package.json', text: '[]' },
      { path: 'ok/package.json', text: '{"name":"ok","dependencies":{"__proto__":"1","left":"1"}}' },
      { path: 'x/package.json', text: '{"__proto__":{"name":"inherited"}}' },
    ])
    expect(model?.parts.map((p) => p.name)).toEqual(['ok', 'x'])
    expect(model?.stack).toEqual([{ name: 'Runtime', badges: ['left'] }])
  })

  it('cuts a name at the text cap and the parts and badges at the contract caps, in path order', () => {
    const many = Array.from({ length: 205 }, (_, i) =>
      pkg(`p${String(i).padStart(3, '0')}/package.json`, {
        name: 'n'.repeat(300),
        dependencies: { [`d${String(i)}`]: '1' },
      }),
    )
    const model = modelOf(many)
    expect(model?.parts).toHaveLength(200)
    expect(model?.parts[0]?.name).toHaveLength(200)
    expect(model?.parts.at(-1)?.typeLine).toBe('p199')
    expect(model?.stack[0]?.badges).toHaveLength(50)
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
  })

  it('sends an arrow to a name that two packages have to the first of them in path order', () => {
    const model = modelOf([
      pkg('b/package.json', { name: 'twin' }),
      pkg('a/package.json', { name: 'twin' }),
      pkg('c/package.json', { name: 'user', dependencies: { twin: 'workspace:*' } }),
    ])
    expect(model?.parts.map((p) => [p.id, p.typeLine])).toEqual([
      ['p0', 'a'],
      ['p1', 'b'],
      ['p2', 'c'],
    ])
    expect(model?.arrows).toEqual([{ from: 'p2', to: 'p0', label: 'depends on' }])
  })

  it('follows a pnpm workspace alias to the package it names', () => {
    const model = modelOf([
      pkg('a/package.json', { name: '@x/a' }),
      pkg('b/package.json', { name: 'b', dependencies: { alias: 'workspace:@x/a@*' } }),
    ])
    expect(model?.arrows).toEqual([{ from: 'p1', to: 'p0', label: 'depends on' }])
  })

  it('keeps the arrow to a package whose name is over the text cap', () => {
    const long = 'l'.repeat(250)
    const model = modelOf([
      pkg('a/package.json', { name: long }),
      pkg('b/package.json', { name: 'b', dependencies: { [long]: 'workspace:*' } }),
      pkg('c/package.json', { name: 'l'.repeat(200) }),
    ])
    expect(model?.arrows).toEqual([{ from: 'p1', to: 'p0', label: 'depends on' }])
  })

  it('gives null with no package.json', () => {
    expect(modelOf([{ path: 'README.md', text: '# x' }])).toBeNull()
  })
})
