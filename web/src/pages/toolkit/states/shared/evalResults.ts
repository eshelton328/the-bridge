// The Evals tabs of the five open items (D20, D25 to D28): shared data, not a
// state. Each item's Overview state (D3 skillOpen, D4 ruleOpen, D7 agentOpen,
// D8 workflowOpen, D9 hookOpen) carries its `results`, so the Evals tab is
// there whichever state opens the item, and the Evals states and their
// tablet and phone states share them. Copy word for word from
// references/toolkit/D20/frame.json and D25 to D28; the tablet's strings are
// the desktop's, and the phone's skill (M18) has its own status header.
import type { ToolkitEvals } from '../../types.ts'

// D20 482:1933 to 482:1946: each round's Opus pass rate with and without the skill, in percent, as the bars' names say.
const rounds: [string, number, number][] = [
  ['r1', 87, 67],
  ['r2', 96, 63],
  ['r3', 96, 69],
  ['r4', 96, 69],
  ['r5', 97, 70],
  ['r6', 100, 73],
  ['x1', 90, 63],
]

/** D20 `evals` 482:1894: the skill writer's ledger. */
export const writerResults: ToolkitEvals = {
  status: {
    label: 'V1 done criteria · latest round',
    meta: 'x1, graded by Codex',
    badges: [
      { label: 'D1 Quality', state: 'fail' },
      { label: 'D2 Value', state: 'pass' },
      { label: 'D3 Known failures', state: 'pass' },
      { label: 'D4 Triggering', state: 'pass' },
      // D26's note: the agent's results come from this criterion of the writer ledger.
      { label: 'D5 Reviewer', state: 'pass', open: 'agents/writing-reviewer.md' },
      { label: 'D6 Real use · waits', state: 'waits' },
    ],
    text: 'D1 fails on Opus under the Codex grader: 90%, but three cases pass in one of three repeats. r7 is pre-registered to fix them.',
  },
  chart: {
    label: 'Opus pass rate by round',
    meta: 'with / without',
    series: [{ name: 'with the skill' }, { name: 'without the skill' }],
    groups: rounds.map(([label, withSkill, without]) => ({ label, values: [withSkill, without] })),
    max: 100,
    note: 'Cyan with the skill, grey without. r1 to r6 graded by Opus, x1 by Codex, so x1 reads lower at the same +27-point gain.',
  },
  cases: {
    label: 'Cases',
    meta: 'r6, Opus with / without',
    rows: [
      { name: 'artifact-defines-ids', value: '100 / 71' },
      { name: 'chat-sourced-first-person', value: '100 / 80' },
      { name: 'doc-headings-paths', value: '100 / 86' },
      { name: 'prd-state-claims', value: '100 / 56' },
      { name: 'ticket-scope', value: '100 / 72' },
    ],
    note: 'Trigger set: 21 queries, 11 that should load writer and 10 near misses. D4 held in r4.',
  },
  rounds: {
    label: 'Rounds',
    end: { type: 'waits', label: 'Open the ledger' },
    items: [
      { name: 'r7', meta: 'pre-registered', text: 'Chat answers name the exact tool; every heading needs a sentence.' },
      {
        name: 'x1',
        meta: 'Nov 8 · 240 runs · $94.80 for Claude runs',
        text: 'Eight models, Codex grader. Gain +12 to +41 points; D1 fails on Opus.',
      },
      { name: 'r6', meta: 'Nov 8 · 60 runs · $31.62', text: 'Opus 100% / 73%. D1 to D5 hold on Opus; v1 waits on D6.' },
    ],
  },
  source: 'From projects/skill-evals/writer.md, the ledger, and the case folders in toolkit/skills/writer/evals/.',
}

const baseline = 'Cites rule 7 for its baseline runs.'

/** D25 `evals` 492:397: the rule skills has no eval cases; the skill ledgers that cite it. */
export const ruleResults: ToolkitEvals = {
  status: {
    label: 'No evals for rules',
    text: 'A rule has no eval cases. The skill ledgers test what it asks for: four of them cite its rule 7, which says to measure each skill against a baseline.',
  },
  rounds: {
    label: 'Ledgers that cite it',
    end: { type: 'count', noun: 'ledgers' },
    items: [
      { name: 'writer', meta: 'writer.md:773', text: baseline, open: 'skills/writer/' },
      { name: 'ambitious', meta: 'ambitious.md:58', text: baseline, open: 'skills/ambitious/' },
      { name: 'agents-md', meta: 'agents-md.md:282', text: baseline, open: 'skills/agents-md/' },
      {
        name: 'readme',
        meta: 'readme.md:9',
        text: 'Cites rule 6: run the task without the skill first.',
        open: 'skills/readme/',
      },
    ],
  },
  source: 'From a search of projects/skill-evals/ for toolkit/rules/skills.md.',
}

const draft = (name: string, value: string) => ({ name, value })

/** D26 `evals` 492:912: the agent writing-reviewer's results from the writer ledger's D5. */
export const agentResults: ToolkitEvals = {
  status: {
    label: 'D5 Reviewer · writer ledger',
    meta: 'Nov 8, 9 drafts',
    badges: [{ label: 'D5 Reviewer', state: 'pass' }],
    text: 'The agent failed all 5 pilot drafts on their recorded failure. Of 4 clean drafts, it passed 2 and failed 2 on real defects that the cases do not test.',
  },
  cases: {
    label: 'Drafts',
    meta: 'expected / its verdict',
    rows: [
      draft('Haiku doc', 'fail / fail'),
      draft('Haiku PRD', 'fail / fail'),
      draft('Haiku chat answer', 'fail / fail'),
      draft('Haiku artifact', 'fail / fail'),
      draft('Opus ticket', 'fail / fail'),
      draft('r4 Opus PRD', 'pass / pass'),
      draft('r4 Opus ticket', 'pass / pass'),
      draft('r4 Opus doc', 'pass / fail'),
      draft('r4 Opus artifact', 'pass / fail'),
    ],
    note: 'The two fails on clean drafts were real defects, checked by hand against the files.',
  },
  rounds: {
    label: 'Rounds',
    end: { type: 'waits', label: 'Open the ledger' },
    items: [
      {
        name: 'reviewer-1',
        meta: 'Nov 8 · 9 runs',
        text: 'D5 holds: the reviewer fails every draft that has a recorded failure.',
      },
    ],
  },
  source:
    'From projects/skill-evals/writer.md, check D5. The agent has no ledger of its own yet; readme-cold-reader is the one agent with a ledger.',
}

/** D27 `evals` 492:1568: the workflow skill-eval-round has no eval cases; the gates that check each run. */
export const workflowResults: ToolkitEvals = {
  status: {
    label: 'No evals for workflows',
    text: 'A workflow has no eval cases. Its gates check each run, and the round results go in the skill’s ledger.',
  },
  rounds: {
    label: 'Gates',
    // The gates are the Gates section of the workflow's one file, which its Files tab shows (D35).
    end: { type: 'tab', label: 'from the file', tab: 'files' },
    items: [
      {
        name: 'Before step 1',
        meta: 'G2',
        text: 'The ledger entry names method 0.7. run.sh stops if a context file sits above the scratch folder, or another round holds the eval lock.',
      },
      {
        name: 'After step 1',
        meta: 'G1 and G6',
        text: 'G1 lists baselines that read the skill’s files. G6 lists runs that touched the brain, for a check by hand.',
      },
      {
        name: 'After step 6',
        meta: 'decision',
        text: 'The decision reads the paired difference, and the agreement between the two graders.',
      },
    ],
  },
  source: 'From the Gates section of toolkit/workflows/skill-eval-round.md.',
}

/** D28 `evals` 492:2154: the hook commit-msg has tests, not evals: the last test run and its groups. */
export const hookResults: ToolkitEvals = {
  status: {
    label: 'Tests · test-commit-msg',
    meta: 'run Nov 14',
    badges: [{ label: '43 of 43 pass', state: 'pass' }],
    // Figma's ✗ and ✓ (492:2185) are the library's cross and check icons.
    text: [
      'A hook has no eval cases. Its test script runs fixed messages and the rule’s ',
      { mark: 'fail' },
      ' and ',
      { mark: 'pass' },
      ' examples through the hook, so the rule and the hook cannot drift apart.',
    ],
  },
  cases: {
    label: 'Test groups',
    meta: 'cases, all pass',
    rows: [
      { name: 'the brain’s types and scopes', value: '12' },
      { name: 'header form', value: '9' },
      { name: 'body and footers', value: '9' },
      { name: 'what git adds', value: '4' },
      { name: 'the rule’s own examples', value: '9' },
    ],
  },
  source: 'From bash toolkit/hooks/test-commit-msg, run on Nov 14. It exits 1 on any failure.',
}
