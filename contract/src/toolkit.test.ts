import { describe, expect, it } from 'vitest'
import { ToolkitItem, ToolkitItemResponse, ToolkitResponse } from './toolkit.ts'

const shared = {
  id: '0123456789abcdef',
  kind: 'skill',
  scope: 'shared',
  project: null,
  name: 'writer',
  path: 'skills/writer/',
  description: 'Use before writing a doc.',
  files: 3,
  linksTo: 2,
  linkedFrom: 1,
}
const project = {
  ...shared,
  id: 'fedcba9876543210',
  scope: 'project',
  project: 'example-project',
  path: 'hooks/pre-commit',
}

describe('the toolkit contract', () => {
  it("takes a shared item with no project and a project's item with its project", () => {
    expect(ToolkitItem.safeParse(shared).success).toBe(true)
    expect(ToolkitItem.safeParse(project).success).toBe(true)
    expect(ToolkitItem.safeParse({ ...shared, project: 'example-project' }).success).toBe(false)
    expect(ToolkitItem.safeParse({ ...project, project: null }).success).toBe(false)
  })

  it('takes only a path relative to its toolkit root, and no other field', () => {
    expect(ToolkitItem.safeParse({ ...shared, path: '/home/dev/toolkit/skills/writer/' }).success).toBe(false)
    expect(ToolkitItem.safeParse({ ...shared, path: 'skills/../../secret' }).success).toBe(false)
    expect(ToolkitItem.safeParse({ ...shared, root: '/home/dev' }).success).toBe(false)
  })

  it('lists items with links that may cross scopes', () => {
    const list = { items: [shared, project], links: [{ from: project.id, to: shared.id }] }
    expect(ToolkitResponse.safeParse(list).success).toBe(true)
    expect(ToolkitResponse.safeParse({ items: [] }).success).toBe(false)
  })

  it("gives an item's tree, with folders inside folders, and its main file's text or none", () => {
    const tree = [
      {
        id: '1111111111111111',
        name: 'references',
        type: 'folder',
        children: [{ id: '2222222222222222', name: 'doc.md', type: 'file', bytes: 120, readable: true }],
      },
    ]
    const main = { file: '3333333333333333', path: 'SKILL.md', text: '# writer' }
    expect(ToolkitItemResponse.safeParse({ item: shared, tree, main }).success).toBe(true)
    expect(ToolkitItemResponse.safeParse({ item: shared, tree, main: null }).success).toBe(true)
    expect(ToolkitItemResponse.safeParse({ item: shared, tree, main: { ...main, path: '/home/dev/x' } }).success).toBe(
      false,
    )
  })
})
