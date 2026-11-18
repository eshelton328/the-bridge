// The Files tabs that the Links states (D19, D29 to D32, and their tablet and
// phone states) open: a tap on a link's file and line opens that file on its
// item's Files tab (D19 482:660), so each Links state's `linkTargets` holds
// the browser of every item its links name. The items with a Files state
// share that state's browser (D6, D33 to D36), with a view of each file a link
// names that the state has no view of; the other items have a browser of their
// own here: the linked file, its length and its first lines, from toolkit/.
// Each view holds the lines its links name past its first lines as
// excerpts, so a tap on a link opens the source at its line: the line as it
// stands in toolkit/ today where it still says what the link quotes, else the
// link's own text, cut as Figma cuts it.
// The list items come from the D4 list (ruleOpen), which has every group.
import { agentFilesBrowser } from '../agentFiles.ts'
import { hookFilesBrowser } from '../hookFiles.ts'
import { hookOpen } from '../hookOpen.ts'
import { ruleFilesBrowser } from '../ruleFiles.ts'
import { ruleOpen } from '../ruleOpen.ts'
import { skillFilesBrowser } from '../skillFiles.ts'
import { skillOpen } from '../skillOpen.ts'
import { workflowFilesBrowser } from '../workflowFiles.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileView } from '../../types.ts'

type LinkTarget = NonNullable<ToolkitData['linkTargets']>[number]
type Excerpt = NonNullable<ToolkitFileView['excerpts']>[number]

/** Lines of a file from the number of the first one. */
const at = (start: number, ...lines: [string, ...string[]]): Excerpt => ({ start, lines })

const preview = (path: string) =>
  [...skillOpen.data.details, ...hookOpen.data.details].find((d) => d.path === path)?.preview

/** A browser with one file, selected: a rule, an agent or a workflow is its own file. */
function oneFile(
  path: string,
  count: number,
  lines: readonly string[],
  excerpts: readonly Excerpt[] = [],
): ToolkitFileBrowser {
  return {
    tree: [{ path, name: path.slice(path.lastIndexOf('/') + 1), count }],
    expanded: [],
    selected: path,
    views: [
      {
        path,
        meta: `Markdown · ${String(count)} lines`,
        blocks: [],
        code: lines.map((text) => [{ text }]),
        excerpts: [...excerpts],
      },
    ],
  }
}

/** A Files state's browser with the excerpts of one of its views: the lines past its first lines that links name. */
const withExcerpts = (browser: ToolkitFileBrowser, path: string, excerpts: readonly Excerpt[]): ToolkitFileBrowser => ({
  ...browser,
  views: browser.views.map((v) => (v.path === path ? { ...v, excerpts: [...(v.excerpts ?? []), ...excerpts] } : v)),
})

/** A Files state's browser with more views: the files the links name that it shows only as a tree row. */
const withViews = (browser: ToolkitFileBrowser, views: readonly ToolkitFileView[]): ToolkitFileBrowser => ({
  ...browser,
  views: [...browser.views, ...views],
})

// D6's tree has SKILL.md with no view: the links of D19 and D30 name it. It shows rendered, as the Overview's preview.
const writerSkill = withViews(skillFilesBrowser, [
  {
    path: 'SKILL.md',
    blocks: preview('skills/writer/')?.blocks ?? [],
    excerpts: [
      at(8, 'The writing rules in `toolkit/rules/writing.md` are loaded in every'),
      at(
        31,
        '   - a README: `toolkit/rules/readmes.md`; a commit or PR:',
        '     `toolkit/rules/commits-and-prs.md` and the `pr-description` skill.',
      ),
      at(36, '   read `toolkit/rules/ste100.md` and pass `--ste` to the lint in step 6.'),
      at(107, 'Run the writing-reviewer agent (step 7)'),
      at(118, 'then the audit-slop skill’s deslop steps (step 8)'),
    ],
  },
])

// D36 selects the tests; D32's links name the hook's own script, which D9's preview shows as code.
const commitMsg = withViews(hookFilesBrowser, [
  { path: 'commit-msg', meta: 'bash · 142 lines', blocks: [], code: preview('hooks/commit-msg')?.code ?? [] },
])

const browsers: Record<string, ToolkitFileBrowser> = {
  'skills/writer/': writerSkill,
  'agents/writing-reviewer.md': withExcerpts(agentFilesBrowser, 'writing-reviewer.md', [
    at(30, 'Run the lint. The script is in the writer skill'),
    at(58, 'No instance of the ten patterns in toolkit/rules/writing.md'),
    at(102, 'toolkit/rules/ste100.md and run the lint with --ste'),
  ]),
  'rules/skills.md': withExcerpts(ruleFilesBrowser, 'skills.md', [at(72, 'The eval-cases skill is the…')]),
  'workflows/skill-eval-round.md': withExcerpts(workflowFilesBrowser, 'skill-eval-round.md', [
    at(46, '4. Primary grades: grade.py <round> <skill> primary, eval-grader'),
  ]),
  'hooks/commit-msg': commitMsg,
  'rules/writing.md': oneFile(
    'writing.md',
    90,
    [
      '# Writing rules',
      '',
      'Twelve patterns to cut from every piece of prose omni produces: docs, tickets,',
      'PRDs, READMEs, artifact text, commit messages, and replies in chat. Each',
      'names the habit, says why it hurts, and shows a failing and a passing line.',
    ],
    [
      at(77, 'Load the `writer` skill before drafting a doc, ticket, PRD, artifact text,'),
      at(83, '`scripts/check` lints these patterns, the `writing-reviewer` agent grades'),
    ],
  ),
  'rules/ste100.md': oneFile(
    'ste100.md',
    79,
    [
      '# ASD-STE100 Simplified Technical English',
      '',
      'Write these forms in ASD-STE100 (STE): chat replies to the owner, tickets',
      'and issues, and how-to docs (procedures). Other forms (PRDs, explanations,',
      'READMEs, artifact pages) follow only the writing rules.',
    ],
    [
      at(21, 'toolkit/skills/writer/scripts/ste-dict _local/ste100/ASD-STE100.pdf'),
      at(70, '- The writing-reviewer agent grades the rules that a script cannot check:'),
    ],
  ),
  'rules/commits-and-prs.md': oneFile(
    'commits-and-prs.md',
    209,
    [
      '# Commit and PR rules',
      '',
      'Every commit message and pull request omni produces follows these rules, in',
      'the brain and in code repos. The header is Conventional Commits 1.0.0; the',
      'type list, line limits and body rules are ours, because the spec defines',
    ],
    [at(182, 'In the brain, toolkit/hooks/commit-msg blocks a commit whose message…')],
  ),
  'agents/writer.md': oneFile(
    'writer.md',
    66,
    [
      '---',
      'name: writer',
      'description: Drafts one doc, ticket, PRD or artifact text from a brief…',
      'tools: Read, Grep, Glob, Write, Edit, Bash, mcp__qmd__query, mcp__qmd__get',
      'skills:',
      '  - writer',
      'model: opus',
    ],
    [at(11, 'Follow the writer skill’s steps.'), at(35, 'runs writing-reviewer on your draft.')],
  ),
  'workflows/skill-eval-cases.md': oneFile('skill-eval-cases.md', 89, [
    '# skill-eval-cases',
    '',
    'Builds or extends a skill’s eval cases and checks the graders on them,',
    'then stops for the owner to pre-register a round. It is the first of two',
    'stages; [skill-eval-round](skill-eval-round.md) runs the round once the',
  ]),
  'skills/eval-cases/': oneFile(
    'SKILL.md',
    102,
    [
      '---',
      'name: eval-cases',
      'description: Writes the eval cases for a skill or agent in this toolkit…',
      '---',
      '',
      '# eval-cases',
    ],
    [at(97, '   is the `skill-eval-round` workflow.')],
  ),
}

const items = ruleOpen.data.groups.flatMap((g) => g.items)

/** Every item a Links state's links name, with its Files tab's browser. */
export const linkTargets: LinkTarget[] = Object.entries(browsers).flatMap(([path, browser]) => {
  const item = items.find((i) => i.path === path)
  return item === undefined ? [] : [{ item, browser }]
})
