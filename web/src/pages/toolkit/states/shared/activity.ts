// The Activity tabs of the five open items (D17, D21 to D24): shared data,
// not a state. Each item's Overview state (D3 skillOpen, D4 ruleOpen, D7
// agentOpen, D8 workflowOpen, D9 hookOpen) carries its `activity`, so the
// Activity tab is there whichever state opens the item, and the Activity
// states and their tablet and phone states share them. Copy word for word
// from references/toolkit/D17/frame.json and D21 to D24; the tablet's and
// the phone's strings are the desktop's (the phone leaves out the captions).
import type { ToolkitActivity } from '../../types.ts'

/** D17 `activity` 474:583: the skill writer. On a tablet or phone the back row names it (T13, M15). */
export const writerUsage: ToolkitActivity = {
  kpis: [
    { value: '330', label: 'calls', caption: 'since Oct 31' },
    { value: '327', label: 'headless', caption: 'skill eval runs' },
    { value: '3', label: 'from chats', caption: 'CLI and desktop app' },
    { value: 'Nov 13', label: 'last used', caption: 'in a chat' },
  ],
  byDay: {
    label: 'Calls per day',
    meta: 'Oct 31 to Nov 15',
    rows: [
      { label: 'Nov 8', value: 2 },
      { label: 'Nov 9', value: 326 },
      { label: 'Nov 13', value: 2 },
    ],
    note: 'No calls on the other 13 days.',
  },
  where: {
    label: 'Where it ran',
    meta: 'from the session folder',
    rows: [
      { label: 'writer evals', value: 302 },
      { label: 'other folders', value: 15 },
      { label: 'pr-description evals', value: 6 },
      { label: 'readme evals', value: 4 },
      { label: 'chats', value: 3 },
    ],
  },
  list: {
    label: 'Chats that loaded it',
    meta: 'newest first',
    rows: [
      { type: 'chat', title: 'Linear workflow setup for NCC team', meta: 'Nov 13 · 20:44 · omni-brain' },
      { type: 'chat', title: 'Brain NC1701 project', meta: 'Nov 13 · 17:03 · omni-brain' },
      { type: 'chat', title: 'Deep research on evals', meta: 'Nov 9 · 01:57 · omni-brain' },
    ],
  },
  source:
    'Counts are real, from the Claude Code session files on this Mac. A rule has no tool call, so its Activity counts reads of its file (proposal): writing.md was read 55 times.',
  named: true,
}

/** D21 `activity` 491:4630: the rule skills, from the sessions that opened a skill file. */
export const ruleUsage: ToolkitActivity = {
  kpis: [
    { value: '18', label: 'sessions', caption: 'opened a skill file' },
    { value: '12', label: 'headless', caption: 'eval and agent runs' },
    { value: '6', label: 'from chats', caption: 'CLI and desktop app' },
    { value: 'Nov 14', label: 'last loaded', caption: 'in a chat' },
  ],
  byDay: {
    label: 'Sessions per day',
    meta: 'Oct 31 to Nov 15',
    rows: [
      { label: 'Nov 7', value: 3 },
      { label: 'Nov 8', value: 9 },
      { label: 'Nov 9', value: 5 },
      { label: 'Nov 14', value: 1 },
    ],
    note: 'No sessions on the other 12 days.',
  },
  where: {
    label: 'Where it loaded',
    meta: 'from the session folder',
    rows: [
      { label: 'omni-brain', value: 12 },
      { label: 'writer evals', value: 3 },
      { label: 'ambitious evals', value: 2 },
      { label: 'other folders', value: 1 },
    ],
  },
  list: {
    label: 'Chats that loaded it',
    meta: 'newest first',
    rows: [
      { type: 'chat', title: 'ASD-STE100 writer skill setup', meta: 'Nov 14 · 17:12 · omni-brain' },
      { type: 'chat', title: 'README effectiveness research and rule', meta: 'Nov 9 · 02:40 · omni-brain' },
      { type: 'chat', title: 'Deep research on evals', meta: 'Nov 9 · 01:58 · omni-brain' },
      { type: 'chat', title: 'Writer rules, skills, and agents', meta: 'Nov 8 · 23:36 · omni-brain' },
    ],
  },
  source:
    'Counts are real, from the Claude Code session files on this Mac. Claude Code does not log when a rule loads, so a session counts when it read or changed a file under skills/.',
}

/** D22 `activity`: the agent writing-reviewer, every run from chats and from headless eval runs. */
export const agentUsage: ToolkitActivity = {
  kpis: [
    { value: '256', label: 'runs', caption: 'since Oct 31' },
    { value: '240', label: 'headless', caption: 'writer eval runs' },
    { value: '16', label: 'from chats', caption: 'CLI and desktop app' },
    { value: 'Nov 15', label: 'last run', caption: 'in a chat' },
  ],
  byDay: {
    label: 'Runs per day',
    meta: 'Oct 31 to Nov 15',
    rows: [
      { label: 'Nov 8', value: 2 },
      { label: 'Nov 9', value: 251 },
      { label: 'Nov 13', value: 2 },
      { label: 'Nov 15', value: 1 },
    ],
    note: 'No runs on the other 12 days.',
  },
  where: {
    label: 'Where it ran',
    meta: 'from the session folder',
    rows: [
      { label: 'writer evals', value: 218 },
      { label: 'repo folders', value: 22 },
      { label: 'omni-brain', value: 16 },
    ],
  },
  list: {
    label: 'Chats that ran it',
    meta: 'newest first',
    rows: [
      { type: 'chat', title: 'NCC-1701 Figma toolkit page', meta: 'Nov 15 · 03:35 · omni-brain' },
      { type: 'chat', title: 'Brain NC1701 project', meta: 'Nov 13 · 17:05 · omni-brain' },
      { type: 'chat', title: 'Writer rules, skills, and agents', meta: 'Nov 9 · 02:32 · omni-brain' },
      { type: 'chat', title: 'Deep research on evals', meta: 'Nov 9 · 02:03 · omni-brain' },
    ],
  },
  source:
    'Counts are real, from the Claude Code session files on this Mac: Agent tool calls and claude -p --agent runs.',
}

/**
 * D23 `activity`: the workflow skill-eval-round, which no Workflow tool has run yet, so the page shows the rounds from
 * the ledgers. Each round opens its skill on its Evals tab.
 */
export const workflowUsage: ToolkitActivity = {
  kpis: [
    { value: '0', label: 'Workflow runs', caption: 'no script yet' },
    { value: '16', label: 'rounds', caption: 'run by hand' },
    { value: '5', label: 'skills', caption: 'with a round' },
    { value: 'Nov 9', label: 'last round', caption: 'readme x1' },
  ],
  byDay: {
    label: 'Rounds per day',
    meta: 'Oct 31 to Nov 15',
    rows: [
      { label: 'Nov 8', value: 13 },
      { label: 'Nov 9', value: 3 },
    ],
    note: 'No rounds on the other 14 days.',
  },
  where: {
    label: 'Rounds by skill',
    meta: 'from the ledgers',
    rows: [
      { label: 'writer', value: 7 },
      { label: 'pr-description', value: 4 },
      { label: 'readme', value: 3 },
      { label: 'ambitious', value: 1 },
      { label: 'agents-md', value: 1 },
    ],
  },
  list: {
    label: 'Rounds in the ledgers',
    meta: 'newest first',
    rows: [
      { type: 'round', title: 'readme · cross-family x1', meta: 'Nov 9 · git log', open: 'skills/readme/' },
      { type: 'round', title: 'writer · cross-family x1', meta: 'Nov 9 · git log', open: 'skills/writer/' },
      { type: 'round', title: 'ambitious · cross-family x1', meta: 'Nov 9 · git log', open: 'skills/ambitious/' },
      { type: 'round', title: 'pr-description · round 4', meta: 'Nov 8 · git log', open: 'skills/pr-description/' },
    ],
  },
  source:
    'The workflow is a design doc that runs by hand, so the session files hold no Workflow run. The rounds come from the ledger commits in git log.',
}

/** D24 `activity`: the hook commit-msg, every commit it checked and why it rejected 9 messages. */
export const hookUsage: ToolkitActivity = {
  kpis: [
    { value: '88', label: 'commits', caption: 'checked since Oct 31' },
    { value: '9', label: 'rejected', caption: 'the message broke the rule' },
    { value: '68', label: 'from chats', caption: 'CLI and desktop app' },
    { value: 'Nov 9', label: 'last run', caption: 'in a chat' },
  ],
  byDay: {
    label: 'Commits per day',
    meta: 'Oct 31 to Nov 15',
    rows: [
      { label: 'Nov 7', value: 8 },
      { label: 'Nov 8', value: 27 },
      { label: 'Nov 9', value: 53 },
    ],
    note: 'No commits from a session on the other 13 days.',
  },
  where: {
    label: 'Why it rejected',
    meta: '9 messages',
    rows: [
      { label: 'line over 72', value: 4 },
      { label: 'wrong scope', value: 3 },
      { label: 'footer in body', value: 1 },
      { label: 'verb not lowercase', value: 1 },
    ],
  },
  list: {
    label: 'Chats that committed',
    meta: 'newest first',
    rows: [
      { type: 'chat', title: 'Commit and push private brain', meta: 'Nov 9 · 02:17 · omni-brain' },
      { type: 'chat', title: 'Deep research on evals', meta: 'Nov 9 · 02:03 · omni-brain' },
      { type: 'chat', title: 'Writer rules, skills, and agents', meta: 'Nov 8 · 23:48 · omni-brain' },
      { type: 'chat', title: 'Agent PR description toolkit pieces', meta: 'Nov 8 · 23:23 · omni-brain' },
    ],
  },
  source:
    'Counts are real: the git commit calls in the session files on this Mac, and the hook output that each call returned. Commits from a terminal are not in the files.',
}
