import { describe, expect, it } from 'vitest'
import { filePathIn } from './blocks/filesView.ts'

// A file in an item's Files tab sits in the item's folder: a skill's path is that folder, with its trailing slash;
// a rule's, an agent's, a workflow's or a hook's path is the item's own file, whose folder holds its files.
describe('filePathIn', () => {
  it('puts a skill’s file under the skill’s folder', () => {
    expect(filePathIn('toolkit/skills/writer/', 'scripts/check')).toBe('toolkit/skills/writer/scripts/check')
    expect(filePathIn('toolkit/skills/writer/', 'SKILL.md')).toBe('toolkit/skills/writer/SKILL.md')
  })

  it('puts a rule’s, an agent’s or a hook’s file beside the item’s own file, not after it', () => {
    expect(filePathIn('toolkit/rules/skills.md', 'skills.md')).toBe('toolkit/rules/skills.md')
    expect(filePathIn('toolkit/agents/writing-reviewer.md', 'writing-reviewer.md')).toBe(
      'toolkit/agents/writing-reviewer.md',
    )
    expect(filePathIn('toolkit/hooks/commit-msg', 'test-commit-msg')).toBe('toolkit/hooks/test-commit-msg')
    expect(filePathIn('toolkit/workflows/skill-eval-round.md', 'skill-eval-round.md')).toBe(
      'toolkit/workflows/skill-eval-round.md',
    )
  })
})
