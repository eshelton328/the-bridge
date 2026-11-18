// The Chats and Headless runs sources of the Activity view: shared data, not
// a state. The desktop's (D15 `activity` 477:216, D16 477:810, the chat open
// in D18 475:373), the tablet's (T11 477:1241, T12, T14: no captions,
// shorter lines and every row of the list) and the phone's (M13, M14, M16:
// one run each and the phone's chat). Each view is D11's, T9's or M10's with
// the two sources' counts beside All. Copy word for word from
// references/toolkit/D15, D16, D18, T11, T12, T14, M13, M14 and
// M16/frame.json. Running now is sample data, as the frames say; the counts,
// the chats and the evals are real.
import type {
  ToolkitActivityChat,
  ToolkitActivityCounts,
  ToolkitActivityView,
  ToolkitChatDetail,
  ToolkitEvalGroup,
  ToolkitRun,
} from '../../types.ts'
import { activityDesktop, activityPhone, activityTablet } from './activityView.ts'

function allOf(view: ToolkitActivityView): ToolkitActivityCounts {
  const all = view.counts.all
  if (all === undefined) throw new Error('the Activity view has no counts for All sessions')
  return all
}

const desktopAll = allOf(activityDesktop)
const tabletAll = allOf(activityTablet)

const runOf = (counts: ToolkitActivityCounts, id: string): ToolkitRun => {
  const run = counts.running.rows.find((r) => r.id === id)
  if (run === undefined) throw new Error(`no run ${id}`)
  return run
}

const seriesOf = (source: 'chats' | 'headless') => desktopAll.perDay.series.filter((s) => s.source === source)

const skill = (name: string) => ({ kind: 'skill' as const, name, path: `skills/${name}/` })
const writingReviewer = (times: number) => ({
  kind: 'agent' as const,
  name: 'writing-reviewer',
  path: 'agents/writing-reviewer.md',
  times,
})

// D18 `side panel · chat` 475:373: Writer rules, skills, and agents, from its session file.
const chatFields = [
  { label: 'Started', value: 'Nov 8, 23:29', source: 'session file' },
  { label: 'Length', value: '8h 25m, ended Nov 9 07:54', source: 'first and last message' },
  { label: 'Project', value: 'omni-brain · main', source: 'the session’s folder and branch' },
  { label: 'From', value: 'Claude Code CLI 2.1.319', source: 'the session file' },
  { label: 'Model', value: 'Claude Opus 5.5', source: 'each message' },
  { label: 'Messages', value: '122 from Erik · 991 replies', source: 'the session file' },
  { label: 'Tokens', value: '1.07M out · 220M cache read', source: 'each message' },
  { label: 'Hook blocks', value: '4', source: 'hook messages' },
]
const writerRulesChat: ToolkitChatDetail = {
  status: 'Chat ended',
  summary:
    'A chat from the Claude Code CLI. Every value is real, from its session file; the right column says where each one comes from.',
  fields: chatFields,
  itemsLabel: 'Toolkit items · tap to open',
  toolsLabel: 'Tools used',
  tools: [
    { count: 297, name: 'Bash' },
    { count: 64, name: 'Agent' },
    { count: 28, name: 'SendMessage' },
    { count: 15, name: 'Write' },
    { count: 11, name: 'Edit' },
  ],
}

// D15 `panel · CHATS THAT USED THE TOOLKIT` 477:515 shows the first four; T11 477:1472 a fifth.
const chats = (detail: ToolkitChatDetail): ToolkitActivityChat[] => [
  {
    id: 'linear-workflow-setup',
    title: 'Linear workflow setup for NCC team',
    meta: 'Nov 13 · omni-brain',
    items: [skill('project-setup'), skill('writer')],
  },
  {
    id: 'brain-nc1701-project',
    title: 'Brain NC1701 project',
    meta: 'Nov 13 · omni-brain',
    items: [writingReviewer(2), skill('project-setup'), skill('writer'), skill('readme')],
  },
  {
    id: 'deep-research-on-evals',
    title: 'Deep research on evals',
    meta: 'Nov 9 · omni-brain · 2 hook blocks',
    items: [writingReviewer(4), skill('writer')],
  },
  {
    id: 'writer-rules-skills-agents',
    title: 'Writer rules, skills, and agents',
    meta: 'Nov 8 · omni-brain · 4 hook blocks',
    items: [writingReviewer(9)],
    detail,
  },
  {
    id: 'harness-status',
    title: 'Harness status in omni brain',
    meta: 'Nov 8 · omni-brain · 2 hook blocks',
    items: [skill('agents-md')],
  },
]

const chatList = (detail: ToolkitChatDetail, shown: number): NonNullable<ToolkitActivityCounts['list']> => ({
  type: 'chats',
  label: 'Chats that used the toolkit',
  shown,
  showAll: { label: 'Show all 8 chats', count: 8 },
  openSession: desktopAll.running.openSession,
  rows: chats(detail),
})

// D16 `panel · BY SKILL EVAL` 477:1117 shows the first four; T12 477:1864 all seven.
const evalGroup = (
  name: string,
  calls: number,
  sessions: number,
  loaded: number,
  days: string,
  hasSkill = true,
): ToolkitEvalGroup => ({
  name,
  ...(hasSkill ? { skill: { kind: 'skill' as const, path: `skills/${name}/` }, after: 'evals' } : {}),
  calls: `${String(calls)} calls`,
  sessions,
  loaded,
  meta: `${String(sessions)} sessions · ${loaded === 0 ? 'none' : String(loaded)} loaded an item · ${days}`,
})
const evalList = (shown: number): NonNullable<ToolkitActivityCounts['list']> => ({
  type: 'evals',
  label: 'By skill eval',
  shown,
  showAll: { label: 'Show all 7 evals', count: 7 },
  rows: [
    evalGroup('writer', 559, 945, 348, 'Nov 8–9'),
    evalGroup('pr-description', 808, 855, 367, 'Nov 8–9'),
    evalGroup('agents-md', 227, 913, 226, 'Nov 7 and 9'),
    evalGroup('ambitious', 176, 360, 176, 'Nov 9'),
    evalGroup('readme', 170, 480, 165, 'Nov 9'),
    evalGroup('readme-reads folder', 0, 515, 0, 'Nov 9', false),
    evalGroup('other folders', 87, 404, 55, 'Oct 31 to Nov 9', false),
  ],
})

const called = (
  rows: ToolkitActivityCounts['mostCalled']['rows'][number][],
  label: string,
  meta: string | undefined,
): ToolkitActivityCounts['mostCalled'] => ({
  label,
  ...(meta === undefined ? {} : { meta }),
  layer: 'Most called',
  rows,
})
const item = (kind: 'skill' | 'agent', name: string, value: number) => ({
  kind,
  name,
  path: kind === 'skill' ? `skills/${name}/` : `agents/${name}.md`,
  value,
})

// D15 `panel · MOST CALLED` 477:339: the 25 calls from chats.
const chatsCalled = [
  item('agent', 'writing-reviewer', 15),
  item('skill', 'writer', 3),
  item('skill', 'project-setup', 2),
  item('skill', 'ambitious', 2),
  item('skill', 'agents-md', 1),
  item('skill', 'readme', 1),
  item('skill', 'audit-slop', 1),
]
// D16 `panel · MOST CALLED` 477:933: the 2,027 calls from headless runs, less readme-cold-reader's 11.
const headlessCalled = [
  item('agent', 'pr-description-checker', 442),
  item('skill', 'pr-description', 363),
  item('skill', 'writer', 327),
  item('skill', 'agents-md', 260),
  item('agent', 'writing-reviewer', 235),
  item('skill', 'ambitious', 179),
  item('skill', 'readme', 170),
  item('skill', 'audit-slop', 40),
]

// D16 `run · readme-cold-reader` 478:2: a headless run of the readme eval.
const readmeColdReader = (meta: string, chips?: string[]): ToolkitRun => ({
  id: 'readme-cold-reader',
  kind: 'agent',
  name: 'readme-cold-reader',
  path: 'agents/readme-cold-reader.md',
  meta,
  elapsed: '2m',
  ...(chips === undefined ? {} : { chips }),
})

/** D15: Chats on the desktop. */
const desktopChats = (detail: ToolkitChatDetail): ToolkitActivityCounts => ({
  kpis: [
    { value: '8', label: 'chats', caption: 'used the toolkit' },
    { value: '25', label: 'toolkit calls', caption: 'skills loaded and agents started' },
    { value: '8', label: 'hook blocks', caption: 'in these chats' },
    { value: '5 · 3', label: 'CLI · app', caption: 'Claude Code CLI and desktop app' },
  ],
  running: {
    ...desktopAll.running,
    rows: [runOf(desktopAll, 'writing-reviewer'), runOf(desktopAll, 'pr-description-checker')],
  },
  perDay: { ...desktopAll.perDay, meta: 'chats only', series: seriesOf('chats') },
  mostCalled: called(chatsCalled, 'Most called in chats', 'calls'),
  list: chatList(detail, 4),
  source:
    'Counts, titles and items come from the Claude Code session files on this Mac, Oct 31 to Nov 15; running now is sample data. Chats are sessions from the CLI or the desktop app.',
})

/** D16: Headless runs on the desktop. */
const desktopHeadless: ToolkitActivityCounts = {
  kpis: [
    { value: '4,472', label: 'sessions', caption: 'claude -p and the SDK' },
    { value: '1,337', label: 'loaded an item', caption: 'at least one toolkit call' },
    { value: '2,027', label: 'toolkit calls', caption: 'skills loaded and agents started' },
    { value: '1.2 min', label: 'median', caption: 'for a session that loaded an item' },
  ],
  running: {
    ...desktopAll.running,
    rows: [
      runOf(desktopAll, 'skill-eval-round'),
      readmeColdReader('claude -p · readme round 3 · case 4 of 9 · sandbox', ['omni-brain', 'readme round 3']),
    ],
  },
  perDay: { ...desktopAll.perDay, meta: 'headless runs only', series: seriesOf('headless') },
  mostCalled: called(headlessCalled, 'Most called in headless runs', 'calls'),
  list: evalList(4),
  source:
    'Counts come from the Claude Code session files on this Mac, Oct 31 to Nov 15; running now is sample data. A headless session is one started by claude -p or the SDK; the eval comes from its folder. A run without the skill loads no item.',
}

/** D15 and D16 beside D11's All sessions: the desktop's Activity view with every source. */
export const activitySourcesDesktop: ToolkitActivityView = {
  ...activityDesktop,
  counts: { all: desktopAll, chats: desktopChats(writerRulesChat), headless: desktopHeadless },
}

/** D18: D15 with Writer rules, skills, and agents keyed to D18's layers. */
export const activityChatOpen: ToolkitActivityView = {
  ...activitySourcesDesktop,
  counts: {
    ...activitySourcesDesktop.counts,
    chats: desktopChats({
      ...writerRulesChat,
      layers: { pageHeader: '478:192', header: '475:374', openSession: '475:386', items: ['478:485'] },
    }),
  },
}

const tabletRun = (run: ToolkitRun, meta: string): ToolkitRun => {
  const row = { id: run.id, kind: run.kind, name: run.name, path: run.path, meta, elapsed: run.elapsed }
  return run.detail === undefined ? row : { ...row, detail: run.detail }
}

/** T11: Chats on a tablet. */
const tabletChats = (rows: ToolkitRun[], shown: number, detail: ToolkitChatDetail): ToolkitActivityCounts => ({
  kpis: [
    { value: '8', label: 'chats' },
    { value: '25', label: 'toolkit calls' },
    { value: '8', label: 'hook blocks' },
    { value: '5 · 3', label: 'CLI · app' },
  ],
  running: { ...tabletAll.running, rows },
  perDay: { ...tabletAll.perDay, meta: 'chats only', series: seriesOf('chats') },
  mostCalled: called(chatsCalled, 'Most called in chats', undefined),
  list: chatList(detail, shown),
})

/** T12: Headless runs on a tablet. */
const tabletHeadless = (rows: ToolkitRun[], shown: number): ToolkitActivityCounts => ({
  kpis: [
    { value: '4,472', label: 'sessions' },
    { value: '1,337', label: 'loaded an item' },
    { value: '2,027', label: 'toolkit calls' },
    { value: '1.2 min', label: 'median' },
  ],
  running: { ...tabletAll.running, rows },
  perDay: { ...tabletAll.perDay, meta: 'headless only', series: seriesOf('headless') },
  mostCalled: called(headlessCalled, 'Most called in headless runs', undefined),
  list: evalList(shown),
})

/** T11, T12 and T14 beside T9's All: the tablet's Activity page with every source. */
export const activitySourcesTablet: ToolkitActivityView = {
  ...activityTablet,
  counts: {
    all: tabletAll,
    chats: tabletChats(
      [
        tabletRun(runOf(desktopAll, 'writing-reviewer'), 'started by writer, step 7 · omni-brain · f-005 the-bridge'),
        tabletRun(runOf(desktopAll, 'pr-description-checker'), 'started by pr-description · holdm · HLD-41'),
      ],
      5,
      writerRulesChat,
    ),
    headless: tabletHeadless(
      [
        tabletRun(runOf(desktopAll, 'skill-eval-round'), 'step 4 of 8, grade.py primary · omni-brain'),
        readmeColdReader('claude -p · readme round 3 · case 4 of 9'),
      ],
      7,
    ),
  },
}

// M16 475:1144: the phone's chat has a shorter line and no source column.
const phoneChat: ToolkitChatDetail = {
  ...writerRulesChat,
  summary: 'A chat from the Claude Code CLI. Every value is real, from its session file.',
  fields: chatFields.map((f) => ({ label: f.label, value: f.value })),
}

/** M13, M14 and M16 beside M10's All: the phone's Activity view with every source, one run each. */
export const activitySourcesPhone: ToolkitActivityView = {
  ...activityPhone,
  counts: {
    all: allOf(activityPhone),
    chats: tabletChats([tabletRun(runOf(desktopAll, 'writing-reviewer'), 'omni-brain · f-005')], 4, phoneChat),
    headless: tabletHeadless([tabletRun(runOf(desktopAll, 'skill-eval-round'), 'step 4 of 8 · writer round 7')], 4),
  },
}
