// The Files tab of the workflow skill-eval-round (D35 `file browser`): shared,
// not a state. workflowOpen (D8) carries it, so every state that opens the
// workflow has it: the Files tab, and the Evals tab's "from the file" (D27),
// which opens that tab on the doc that holds the Gates section. Copy word for
// word from references/toolkit/D35/frame.json.
import type { ToolkitFileBrowser } from '../../types.ts'

const script = (name: string, count: number) => ({ path: `harness/${name}`, name, count, type: 'code' as const })

/** The item's Files tab, which its Overview, Evals and Links states share (shared/linkFiles.ts). */
export const workflowFilesBrowser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'skill-eval-round.md',
      name: 'skill-eval-round.md',
      count: 93,
      caption: 'Design doc, run by hand. No script yet.',
    },
    {
      path: 'harness/',
      name: 'harness/',
      type: 'folder',
      count: 6,
      caption: 'Outside the toolkit, in projects/skill-evals/. One script for each step.',
      children: [
        script('run.sh', 156),
        script('facts.py', 86),
        script('jev.py', 68),
        script('blind.py', 90),
        script('grade.py', 215),
        script('aggregate.py', 208),
      ],
    },
  ],
  expanded: ['harness/'],
  selected: 'skill-eval-round.md',
  views: [
    {
      path: 'skill-eval-round.md',
      meta: 'Markdown · 93 lines · design doc',
      blocks: [],
      code: [
        [{ text: '# skill-eval-round', kind: 'comment' }],
        [],
        [{ text: 'Runs one pre-registered eval round for a skill on both model families,' }],
        [{ text: 'grades every run with the other family, and stops for the owner to decide.' }],
        [{ text: 'It is the second of two stages; [skill-eval-cases](skill-eval-cases.md)' }],
        [{ text: 'builds the cases and ends at the pre-registration this stage starts from.' }],
        [{ text: 'Each step is a script in `projects/skill-evals/harness/`; the steps are' }],
        [{ text: 'the protocol of `projects/skill-evals/method.md` at version 0.7, whose' }],
        [{ text: 'Guards table defines the checks named G1 to G7 here.' }],
        [],
        [{ text: '## Purpose and trigger' }],
        [],
        [{ text: "Run it when a skill's ledger holds a round pre-registered under method" }],
        [{ text: '0.7: what changed, the hypotheses, the models (at least one Claude and one' }],
      ],
      // The line its Links tab names (D31), which a tap on the link opens.
      excerpts: [{ start: 46, lines: ['4. Primary grades: grade.py <round> <skill> primary, eval-grader'] }],
      usedBy: { kind: 'skill', text: 'The steps table names the harness script for each step.' },
    },
  ],
}
