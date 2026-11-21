import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { builtinCommands, frontMatterOf, oneLine, readClaudeSkills } from './claudeSkills.ts'

const root = mkdtempSync(join(tmpdir(), 'skills-'))
const put = (path: string, text: string) => {
  mkdirSync(join(root, path, '..'), { recursive: true })
  writeFileSync(join(root, path), text)
}
const skill = (name: string, description: string, more = '') =>
  `---\nname: ${name}\ndescription: ${description}\n${more}---\n\n# ${name}\n\nThe body, with marker-5150, is never read.\n`

describe('Claude skills', () => {
  it("lists the built-in commands, the owner's skills and commands, and each one from the chat's folder up to its repository", async () => {
    put('home/.claude/skills/writer/SKILL.md', skill('writer', 'Use before writing any doc'))
    put('home/.claude/skills/hidden/SKILL.md', skill('hidden', 'Only the model calls it', 'user-invocable: false\n'))
    put('home/.claude/skills/plain/SKILL.md', 'no front matter here')
    put('home/.claude/skills/deploy/SKILL.md', skill('deploy # the name', 'Deploys # a comment', ''))
    put('home/.claude/skills/quiet/SKILL.md', skill('quiet', 'Hidden', 'user-invocable: false # for the model\n'))
    put('home/.claude/commands/frontend/component.md', '---\ndescription: Make a component\n---\nbody')
    // The owner's skill wins over the repository's skill of the same name, as in Claude Code.
    put('home/work/.claude/skills/writer/SKILL.md', skill('writer', 'The repository writer'))
    put('home/.claude/commands/standup.md', '---\ndescription: Write the standup\n---\nbody')
    put('home/work/.git/HEAD', 'ref: refs/heads/main')
    put('home/work/.claude/skills/ship/SKILL.md', skill('ship', 'Ships one branch'))
    put('home/work/app/.claude/skills/run/SKILL.md', skill('run', 'Runs the app'))
    put('home/work/app/engine/.claude/skills/ambitious/SKILL.md', skill('ambitious', 'Aim higher'))
    // A folder below the chat's folder loads only once Claude works there; one above the repository is not read.
    put('home/.claude/skills/../../outside/.claude/skills/far/SKILL.md', skill('far', 'Far away'))
    const home = join(root, 'home')
    const skills = await readClaudeSkills(join(home, 'work', 'app'), join(home, '.claude'), home)
    expect(skills).toEqual([
      ...builtinCommands,
      { name: 'deploy', description: 'Deploys', source: 'user' },
      { name: 'frontend:component', description: 'Make a component', source: 'user' },
      { name: 'plain', description: '', source: 'user' },
      { name: 'run', description: 'Runs the app', source: 'project' },
      { name: 'ship', description: 'Ships one branch', source: 'project' },
      { name: 'standup', description: 'Write the standup', source: 'user' },
      { name: 'writer', description: 'Use before writing any doc', source: 'user' },
    ])
    expect(JSON.stringify(skills)).not.toContain('marker-5150')
  })

  it("gives at most the contract's number of entries", async () => {
    for (let n = 0; n < 510; n += 1) put(`many/.claude/skills/s${String(n)}/SKILL.md`, skill(`s${String(n)}`, 'One'))
    const skills = await readClaudeSkills(undefined, join(root, 'many', '.claude'), join(root, 'many'))
    expect(skills).toHaveLength(500)
  })

  it("gives the built-in commands and the owner's skills for a chat with no folder", async () => {
    put('solo/.claude/skills/writer/SKILL.md', skill('writer', 'Write'))
    const skills = await readClaudeSkills(undefined, join(root, 'solo', '.claude'), join(root, 'solo'))
    expect(skills.map((s) => s.name)).toEqual([...builtinCommands.map((c) => c.name), 'writer'])
  })

  it('reads a folded or quoted description and cuts it to one line of about 80 characters', () => {
    expect(frontMatterOf('---\nname: a\ndescription: >\n  One\n  two.\n---\n')).toEqual({
      name: 'a',
      description: 'One two.',
      hidden: false,
    })
    expect(frontMatterOf('---\ndescription: "Quoted: text"\n---')?.description).toBe('Quoted: text')
    const long = oneLine(`Use this skill ${'whenever a long description goes on '.repeat(5)}`)
    expect(long.length).toBeLessThanOrEqual(80)
    expect(long.endsWith('…')).toBe(true)
    expect(frontMatterOf('# no front matter')).toBeNull()
  })
})
