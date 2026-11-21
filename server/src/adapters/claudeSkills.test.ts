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

  it('lists the skills and commands of each plugin that is on and installed for the chat, by "<plugin>:<name>"', async () => {
    const home = join(root, 'plug')
    const claude = join(home, '.claude')
    const repo = join(home, 'repo')
    put('plug/repo/.git/HEAD', 'ref: refs/heads/main')
    const cache = (plugin: string) => join(claude, 'plugins', 'cache', 'market', plugin, '1.0.0')
    put('plug/.claude/plugins/cache/market/tools/1.0.0/skills/audit/SKILL.md', skill('audit', 'Audits the repo'))
    put('plug/.claude/plugins/cache/market/tools/1.0.0/commands/review.md', '---\ndescription: Review it\n---\nbody')
    put('plug/.claude/plugins/cache/market/local/1.0.0/skills/here/SKILL.md', skill('here', 'Only in the repo'))
    put('plug/.claude/plugins/cache/market/off/1.0.0/skills/never/SKILL.md', skill('never', 'Turned off'))
    put('plug/.claude/plugins/cache/market/other/1.0.0/skills/elsewhere/SKILL.md', skill('elsewhere', 'Another repo'))
    put(
      'plug/.claude/plugins/installed_plugins.json',
      JSON.stringify({
        version: 2,
        plugins: {
          'tools@market': [{ scope: 'user', installPath: cache('tools') }],
          'local@market': [{ scope: 'local', projectPath: repo, installPath: cache('local') }],
          'off@market': [{ scope: 'user', installPath: cache('off') }],
          'other@market': [{ scope: 'project', projectPath: join(home, 'other'), installPath: cache('other') }],
        },
      }),
    )
    put(
      'plug/.claude/settings.json',
      JSON.stringify({ enabledPlugins: { 'tools@market': true, 'off@market': true, 'other@market': true } }),
    )
    // The repository's local settings come last, so they turn "off" off again and "local" on.
    put(
      'plug/repo/.claude/settings.local.json',
      JSON.stringify({ enabledPlugins: { 'off@market': false, 'local@market': true } }),
    )
    const skills = await readClaudeSkills(repo, claude, home)
    expect(skills.filter((s) => s.source === 'plugin')).toEqual([
      { name: 'local:here', description: 'Only in the repo', source: 'plugin' },
      { name: 'tools:audit', description: 'Audits the repo', source: 'plugin' },
      { name: 'tools:review', description: 'Review it', source: 'plugin' },
    ])
    // With no folder, only the owner's settings and user installs count.
    const solo = await readClaudeSkills(undefined, claude, home)
    expect(solo.filter((s) => s.source === 'plugin').map((s) => s.name)).toEqual([
      'off:never',
      'tools:audit',
      'tools:review',
    ])
  })

  it("reads a worktree chat's settings.local.json from the main checkout, as Claude Code does", async () => {
    const home = join(root, 'wt')
    const claude = join(home, '.claude')
    const tools = join(claude, 'plugins', 'cache', 'market', 'tools', '1.0.0')
    put('wt/.claude/plugins/cache/market/tools/1.0.0/skills/audit/SKILL.md', skill('audit', 'Audits the repo'))
    put(
      'wt/.claude/plugins/installed_plugins.json',
      JSON.stringify({ version: 2, plugins: { 'tools@market': [{ scope: 'user', installPath: tools }] } }),
    )
    put('wt/main/.git/HEAD', 'ref: refs/heads/main')
    put('wt/main/.claude/settings.local.json', JSON.stringify({ enabledPlugins: { 'tools@market': true } }))
    put('wt/main-worktrees/feature/.git', `gitdir: ${join(home, 'main', '.git', 'worktrees', 'feature')}\n`)
    // The worktree's own local file is not the one Claude Code reads.
    put(
      'wt/main-worktrees/feature/.claude/settings.local.json',
      JSON.stringify({ enabledPlugins: { 'tools@market': false } }),
    )
    const skills = await readClaudeSkills(join(home, 'main-worktrees', 'feature'), claude, home)
    expect(skills.filter((s) => s.source === 'plugin').map((s) => s.name)).toEqual(['tools:audit'])
  })

  it("names a plugin's skills by its manifest name, and turns it on by its entry name", async () => {
    const home = join(root, 'named')
    const claude = join(home, '.claude')
    const path = join(claude, 'plugins', 'cache', 'market', 'entry', '1.0.0')
    put('named/.claude/plugins/cache/market/entry/1.0.0/skills/audit/SKILL.md', skill('audit', 'Audits the repo'))
    put(
      'named/.claude/plugins/cache/market/entry/1.0.0/.claude-plugin/plugin.json',
      JSON.stringify({ name: 'deploy-tools' }),
    )
    put(
      'named/.claude/plugins/installed_plugins.json',
      JSON.stringify({ version: 2, plugins: { 'entry@market': [{ scope: 'user', installPath: path }] } }),
    )
    put('named/.claude/settings.json', JSON.stringify({ enabledPlugins: { 'entry@market': true } }))
    const skills = await readClaudeSkills(undefined, claude, home)
    expect(skills.filter((s) => s.source === 'plugin').map((s) => s.name)).toEqual(['deploy-tools:audit'])
  })

  it("adds the manifest's skill folders to skills/, and lets its commands replace commands/", async () => {
    const home = join(root, 'paths')
    const claude = join(home, '.claude')
    const base = 'paths/.claude/plugins/cache/market/kit/1.0.0'
    const path = join(root, base)
    put(`${base}/skills/audit/SKILL.md`, skill('audit', 'Audits the repo'))
    put(`${base}/extra/lint/SKILL.md`, skill('lint', 'Lints the repo'))
    put(`${base}/single/SKILL.md`, skill('single', 'One skill in its folder'))
    put(`${base}/commands/old.md`, '---\ndescription: Left out by the manifest\n---\nbody')
    put(`${base}/cmds/new.md`, '---\ndescription: Listed by the manifest\n---\nbody')
    put(`${base}/../../outside.md`, '---\ndescription: Outside the plugin\n---\nbody')
    put(
      `${base}/.claude-plugin/plugin.json`,
      JSON.stringify({ name: 'kit', skills: ['./extra', './single'], commands: ['./cmds/new.md', '../../outside.md'] }),
    )
    put(
      'paths/.claude/plugins/installed_plugins.json',
      JSON.stringify({ version: 2, plugins: { 'kit@market': [{ scope: 'user', installPath: path }] } }),
    )
    put('paths/.claude/settings.json', JSON.stringify({ enabledPlugins: { 'kit@market': true } }))
    const plugin = async () =>
      (await readClaudeSkills(undefined, claude, home)).filter((s) => s.source === 'plugin').map((s) => s.name)
    expect(await plugin()).toEqual(['kit:audit', 'kit:lint', 'kit:new', 'kit:single'])
    // A map names each command; its text is a file of the plugin or inline.
    put(
      `${base}/.claude-plugin/plugin.json`,
      JSON.stringify({
        name: 'kit',
        commands: { ship: { source: './cmds/new.md' }, hello: { content: '---\ndescription: Hi\n---\nSay hi' } },
      }),
    )
    expect(await plugin()).toEqual(['kit:audit', 'kit:hello', 'kit:ship'])
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
