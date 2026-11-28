import { ArchitectureModel } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { modelOf } from './architectureRules.ts'

const pkg = (path: string, body: object) => ({ path, text: JSON.stringify(body) })

describe('modelOf', () => {
  it('gives a part for each package of a workspace, named by its folder, in the root as the repository', () => {
    const model = modelOf([
      pkg('web/package.json', { name: '@x/web', dependencies: { '@x/shared': 'workspace:*', 'react-dom': '^19' } }),
      pkg('package.json', { name: 'root', devDependencies: { typescript: '5' } }),
      pkg('shared/package.json', { name: '@x/shared', dependencies: { zod: '4' } }),
    ])
    expect(model).not.toBeNull()
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
    expect(model?.boundaries).toEqual([{ id: 'b0', label: 'root repository', kind: 'repository' }])
    expect(model?.parts.map((p) => [p.id, p.name, p.shape, p.typeLine, p.boundary])).toEqual([
      ['p0', 'shared/', 'service', 'Library · Zod', 'b0'],
      ['p1', 'web/', 'webApp', 'Web app', 'b0'],
    ])
    expect(model?.arrows).toEqual([{ from: 'p1', to: 'p0', label: 'depends on' }])
    expect(model?.stack).toEqual([
      { name: 'Shared', badges: ['zod'] },
      { name: 'Web', badges: ['react-dom'] },
      { name: 'Build', badges: ['typescript'] },
    ])
  })

  it('gives a package with a src/adapters folder a part for each layer, and the outer systems its adapters name', () => {
    const server = pkg('server/package.json', {
      name: '@x/server',
      dependencies: { hono: '4', 'web-push': '3', '@x/shared': 'workspace:*' },
      devDependencies: { '@types/web-push': '3' },
    })
    const paths = [
      'server/src/routes/app.ts',
      'server/src/services/inbox.ts',
      'server/src/adapters/herdrSocket.ts',
      'server/src/adapters/diskInbox.ts',
      'server/src/adapters/diskInbox.test.ts',
      'server/src/adapters/fakeLinear.ts',
      'server/src/adapters/linearPortContract.ts',
      'server/src/adapters/stubGh.ts',
      'server/src/adapters/claude/deep.ts',
    ]
    const model = modelOf(
      [pkg('package.json', { name: 'root' }), pkg('shared/package.json', { name: '@x/shared' }), server],
      {
        others: [],
        paths,
      },
    )
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
    expect(model?.parts.map((p) => [p.id, p.name, p.typeLine, p.ours])).toEqual([
      ['p0.routes', 'server/routes', 'Routes · Hono', true],
      ['p0.services', 'server/services', 'Services', true],
      ['p0.adapters', 'server/adapters', 'Adapters', true],
      ['p1', 'shared/', 'Library', true],
      ['dep.web-push', 'Web Push service', 'External · web-push', false],
      ['system.herdr', 'herdr', 'Terminal app', false],
      ['system.disk', 'Disk stores', 'Data store', false],
    ])
    expect(model?.arrows).toEqual([
      { from: 'p0.routes', to: 'p0.services', label: 'calls' },
      { from: 'p0.services', to: 'p0.adapters', label: 'calls' },
      { from: 'p0.routes', to: 'p1', label: 'depends on' },
      { from: 'p0.adapters', to: 'dep.web-push', label: 'calls' },
      { from: 'p0.adapters', to: 'system.herdr', label: 'calls' },
      { from: 'p0.adapters', to: 'system.disk', label: 'calls' },
    ])
  })

  it('gives a dependency on another repository of the project one package part outside the boundary', () => {
    const model = modelOf(
      [
        pkg('package.json', { name: 'root' }),
        pkg('a/package.json', { name: '@x/a', dependencies: { '@owner/the-library': '1' } }),
        pkg('b/package.json', { name: '@x/b', devDependencies: { 'the-library': '1' } }),
      ],
      { others: ['the-library'], paths: [] },
    )
    expect(model?.parts.filter((p) => p.boundary === undefined)).toEqual([
      { id: 'repo.the-library', name: 'the-library', shape: 'package', ours: true, typeLine: 'npm package' },
    ])
    expect(model?.arrows).toEqual([
      { from: 'p0', to: 'repo.the-library', label: 'depends on' },
      { from: 'p1', to: 'repo.the-library', label: 'depends on' },
    ])
  })

  it('keeps a repository and an outer system of one name as two parts', () => {
    const model = modelOf(
      [
        pkg('package.json', { name: 'root' }),
        pkg('server/package.json', { name: '@x/server', dependencies: { linear: '1' } }),
      ],
      { others: ['linear'], paths: ['server/src/adapters/linearGraphql.ts'] },
    )
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
    expect(model?.parts.filter((p) => p.boundary === undefined).map((p) => [p.id, p.name])).toEqual([
      ['repo.linear', 'linear'],
      ['system.linear', 'Linear'],
    ])
  })

  it("keeps the root package's runtime dependencies in the Stack", () => {
    const model = modelOf([
      pkg('package.json', { name: 'root', dependencies: { zod: '4' } }),
      pkg('web/package.json', { name: '@x/web', dependencies: { react: '19' } }),
    ])
    expect(model?.stack).toEqual([
      { name: 'Runtime', badges: ['zod'] },
      { name: 'Web', badges: ['react'] },
    ])
  })

  it('drops the arrows of the parts past the cap, so the contract takes a model of many layered packages', () => {
    const names = Array.from({ length: 70 }, (_, i) => `s${String(i).padStart(2, '0')}`)
    const model = modelOf(
      [
        pkg('package.json', { name: 'root' }),
        ...names.map((n) => pkg(`${n}/package.json`, { name: n, dependencies: { 'web-push': '3' } })),
      ],
      { others: [], paths: names.flatMap((n) => ['routes', 'services', 'adapters'].map((l) => `${n}/src/${l}/a.ts`)) },
    )
    expect(model?.parts).toHaveLength(200)
    expect(ArchitectureModel.safeParse(model).success).toBe(true)
  })

  it('keeps one part for each package of a repository with no root package.json', () => {
    const model = modelOf([pkg('b/package.json', { name: 'b' }), pkg('a/package.json', { name: 'a' })])
    expect(model?.boundaries).toEqual([])
    expect(model?.parts.map((p) => [p.name, p.typeLine])).toEqual([
      ['a', 'a'],
      ['b', 'b'],
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
