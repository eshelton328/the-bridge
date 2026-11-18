// The Activity view of the page (D11, D12, T9, M10): shared data, not a
// state. The desktop's counts (D11 `activity` 444:498), the tablet's (T9
// 449:64: no captions, shorter lines, no log and five most called items) and
// the phone's (M10 449:395: T9's with two runs and shorter lines). Only All
// sessions has counts yet; Chats and Headless runs (T11, T12) come with
// their frames. Copy word for word from references/toolkit/D11, D12, T09
// and M10/frame.json. The runs and the log are sample data, as the frames
// say.
import type { ToolkitActivityCounts, ToolkitActivityView, ToolkitRun } from '../../types.ts'

// D11 `axis` 444:611: Oct 31 to Nov 15, 16 days; Nov 7 is the middle day.
const dayLabels = ['Oct 31', ...Array.from({ length: 15 }, (_, i) => `Nov ${String(i + 1)}`)]
const days = dayLabels.map((label, i) => ({
  date: `2026-${i === 0 ? '10-31' : `11-${String(i).padStart(2, '0')}`}`,
  label,
}))

/** One count a day, from the bars Figma names by day (D11 `N9 1777` 444:596 is Nov 9's 1777). */
function perDay(counts: Record<number, number>): number[] {
  return days.map((_, i) => counts[i] ?? 0)
}

// D11 `chart · Headless runs` 444:586 and `chart · Chats` 444:597: 2,027 and 25 calls.
const series: ToolkitActivityCounts['perDay']['series'] = [
  { name: 'Headless runs', source: 'headless', values: perDay({ 7: 206, 8: 44, 9: 1777 }) },
  { name: 'Chats', source: 'chats', values: perDay({ 1: 1, 2: 1, 7: 1, 8: 1, 9: 14, 13: 7 }) },
]

// D12 `side panel · run` 445:465: writing-reviewer, open.
const writingReviewerRun: NonNullable<ToolkitRun['detail']> = {
  summary: 'One agent run, 1m 42s so far. The values are sample data; the right column says where each one comes from.',
  fields: [
    { label: 'Session', value: 'chat “toolkit designs”', source: 'session file' },
    { label: 'Project', value: 'omni-brain', source: 'the session’s folder' },
    { label: 'Feature', value: 'f-005 the-bridge', source: 'the workspace, or the branch name' },
    { label: 'Started by', value: 'writer, step 7', source: 'the parent tool call' },
    { label: 'Workflow', value: 'none', source: 'run.json, when a workflow runs it' },
    { label: 'Model', value: 'Claude Opus 5.5', source: 'each message' },
    { label: 'Tokens', value: '41k in · 3.2k out', source: 'each message' },
    { label: 'Cost', value: '$0.42, estimated', source: 'tokens at list price' },
    { label: 'Toolkit version', value: '7302915', source: 'git, when the run starts' },
  ],
  stepsLabel: 'Steps',
  steps: [
    { time: '0:00', name: 'Read', text: 'the draft and its four sources' },
    { time: '0:21', name: 'Bash', text: 'scripts/check --form doc --ste' },
    { time: '0:24', name: 'Read', text: 'rules/writing.md' },
    { time: '0:58', name: 'Grep', text: 'each claim in the sources' },
    { time: '1:42', name: 'Write', text: 'the grade, with quotes', now: true },
  ],
  resultLabel: 'Result',
  result:
    'Shows when the run ends: the agent’s last message, and the pass or fail count when the agent grades something.',
}

const run = (
  id: string,
  kind: ToolkitRun['kind'],
  path: string,
  meta: string,
  elapsed: string,
  extra: Partial<ToolkitRun> = {},
): ToolkitRun => ({ id, kind, name: id, path, meta, elapsed, ...extra })

const mostCalled: ToolkitActivityCounts['mostCalled']['rows'] = [
  { kind: 'agent', name: 'pr-description-checker', path: 'agents/pr-description-checker.md', value: 442 },
  { kind: 'skill', name: 'pr-description', path: 'skills/pr-description/', value: 363 },
  { kind: 'skill', name: 'writer', path: 'skills/writer/', value: 330 },
  { kind: 'skill', name: 'agents-md', path: 'skills/agents-md/', value: 261 },
  { kind: 'agent', name: 'writing-reviewer', path: 'agents/writing-reviewer.md', value: 250 },
  { kind: 'skill', name: 'ambitious', path: 'skills/ambitious/', value: 181 },
  { kind: 'skill', name: 'readme', path: 'skills/readme/', value: 171 },
  { kind: 'skill', name: 'audit-slop', path: 'skills/audit-slop/', value: 41 },
  { kind: 'agent', name: 'readme-cold-reader', path: 'agents/readme-cold-reader.md', value: 11 },
]

/** D11: All sessions on the desktop. */
const desktopAll: ToolkitActivityCounts = {
  kpis: [
    { value: '2,052', label: 'toolkit calls', caption: 'skills loaded and agents started' },
    { value: '2,027', label: 'from headless runs', caption: 'claude -p and the SDK, mostly skill evals' },
    { value: '25', label: 'from chats', caption: 'Claude Code CLI and desktop app' },
    { value: '25', label: 'hook blocks', caption: '13 commit-msg, 12 Stop hook' },
  ],
  running: {
    label: 'Running now',
    meta: 'sample data',
    status: 'Running',
    open: 'Open session',
    openSession: 'Open the session in Workbench',
    rows: [
      run(
        'writing-reviewer',
        'agent',
        'agents/writing-reviewer.md',
        'in chat “toolkit designs” · started by writer, step 7',
        '1m 42s',
        { chips: ['omni-brain', 'f-005 the-bridge'], detail: writingReviewerRun },
      ),
      run(
        'skill-eval-round',
        'workflow',
        'workflows/skill-eval-round.md',
        'step 4 of 8 · grade.py primary · 3 of 12 groups',
        '18m',
        { chips: ['omni-brain', 'writer round 7'] },
      ),
      run(
        'pr-description-checker',
        'agent',
        'agents/pr-description-checker.md',
        'in chat “release notes” · started by pr-description',
        '38s',
        { chips: ['holdm', 'HLD-41'] },
      ),
    ],
  },
  perDay: { label: 'Calls per day', meta: 'each chart has its own scale', days, series },
  mostCalled: { label: 'Most called', meta: 'all sessions', rows: mostCalled },
  log: {
    label: 'Log',
    meta: 'sample data · newest first',
    rows: [
      { time: '01:16:40', kind: 'agent', text: 'writing-reviewer finished · 0 fails · 2m 10s · omni-brain' },
      { time: '01:16:02', kind: 'hook', text: 'Stop hook blocked a reply · ste-sentence: 26 words' },
      { time: '01:14:55', kind: 'skill', text: 'writer loaded · chat “toolkit designs” · omni-brain' },
      { time: '01:12:20', kind: 'hook', text: 'commit-msg rejected a commit · header is 81 characters' },
      { time: '01:10:03', kind: 'workflow', text: 'skill-eval-round step 3 done · blind.py make' },
      { time: '01:08:47', kind: 'agent', text: 'pr-description-checker finished · 1 fail · holdm' },
      { time: '01:05:12', kind: 'skill', text: 'pr-description loaded · chat “release notes” · holdm' },
      { time: '01:02:30', kind: 'workflow', text: 'skill-eval-round started · writer round 7' },
    ],
  },
  source:
    'Counts come from the Claude Code session files on this Mac, Oct 31 to Nov 15: Skill and Agent tool calls, and hook messages in tool results. Running now and the log are sample data.',
}

const sources: ToolkitActivityView['sources'] = [
  { value: 'all', label: 'All sessions' },
  { value: 'chats', label: 'Chats' },
  { value: 'headless', label: 'Headless runs' },
]

/** D11 `activity` 444:498: the desktop's Activity view. */
export const activityDesktop: ToolkitActivityView = {
  title: 'Activity',
  readFrom: 'Read from session files on this Mac',
  since: 'Since Oct 31 · 16 days',
  sources,
  counts: { all: desktopAll },
}

/** D12: D11 with writing-reviewer's panel keyed to D12's layers. */
export const activityRunOpen: ToolkitActivityView = {
  ...activityDesktop,
  counts: {
    all: {
      ...desktopAll,
      running: {
        ...desktopAll.running,
        rows: desktopAll.running.rows.map((r) =>
          r.detail === undefined
            ? r
            : {
                ...r,
                detail: { ...r.detail, layers: { pageHeader: '445:154', header: '445:466', openSession: '445:478' } },
              },
        ),
      },
    },
  },
}

// T9 449:250: the tablet's key figures, with no caption.
const compactKpis: ToolkitActivityCounts['kpis'] = [
  { value: '2,052', label: 'toolkit calls' },
  { value: '2,027', label: 'headless runs' },
  { value: '25', label: 'from chats' },
  { value: '25', label: 'hook blocks' },
]

const tabletRows = (meta: [string, string, string]): ToolkitRun[] =>
  desktopAll.running.rows.map((r, i) => {
    // No chips on a tablet or phone: the project and the feature join the line under the name.
    const row = { id: r.id, kind: r.kind, name: r.name, path: r.path, meta: meta[i] ?? r.meta, elapsed: r.elapsed }
    return r.detail === undefined ? row : { ...row, detail: r.detail }
  })

/** T9 449:64: the tablet's Activity page. */
export const activityTablet: ToolkitActivityView = {
  title: 'Activity',
  readFrom: activityDesktop.readFrom,
  since: 'Since Oct 31',
  sources: [
    { value: 'all', label: 'All' },
    { value: 'chats', label: 'Chats' },
    { value: 'headless', label: 'Headless' },
  ],
  counts: {
    all: {
      kpis: compactKpis,
      running: {
        label: 'Running now',
        meta: 'sample data',
        hint: 'Tap a run to see it and open its session.',
        status: 'Running',
        openSession: 'Open the session in Workbench',
        rows: tabletRows([
          'started by writer, step 7 · omni-brain · f-005 the-bridge',
          'step 4 of 8, grade.py primary · omni-brain',
          'started by pr-description · holdm · HLD-41',
        ]),
      },
      perDay: { label: 'Calls per day', meta: 'each has its own scale', days, series },
      mostCalled: { label: 'Most called', rows: mostCalled.slice(0, 5) },
    },
  },
}

const tabletAll = activityTablet.counts.all

/** M10 449:395: the phone's Activity view: T9's with two runs and shorter lines. */
export const activityPhone: ToolkitActivityView = {
  ...activityTablet,
  counts:
    tabletAll === undefined
      ? {}
      : {
          all: {
            ...tabletAll,
            running: {
              ...tabletAll.running,
              rows: tabletRows(['omni-brain · f-005', 'step 4 of 8 · writer round 7', '']).slice(0, 2),
            },
          },
        },
}
