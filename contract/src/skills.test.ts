import { describe, expect, it } from 'vitest'
import { ChatSkill, ChatSkillsResponse } from './skills.ts'

describe('chat skills', () => {
  it('takes a skill by its name, a one-line description and its source', () => {
    const skill = {
      name: 'engine:ambitious',
      description: 'Rewrite a task into a more ambitious prompt',
      source: 'project',
    }
    expect(ChatSkill.parse(skill)).toEqual(skill)
    const list = { chat: 'mac-mini/s1', skills: [skill] }
    expect(ChatSkillsResponse.parse(list)).toEqual(list)
  })

  it('refuses a path as a name, a long description, an unknown source and other fields', () => {
    const base = { name: 'writer', description: 'Write docs', source: 'user' }
    for (const bad of [
      { ...base, name: '/home/dev/.claude/skills/writer' },
      { ...base, name: '../writer' },
      { ...base, description: 'x'.repeat(121) },
      { ...base, source: 'mcp' },
      { ...base, path: '/home/dev/.claude/skills/writer/SKILL.md' },
    ])
      expect(ChatSkill.safeParse(bad).success).toBe(false)
  })
})
