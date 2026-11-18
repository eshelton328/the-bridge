// Figma Toolkit D9 "D9 · A hook open": the hook commit-msg opens beside the
// list, on its Overview tab: its kind, name and path badge (a file, so the
// file icon), when it changed, its tabs, its description, when it runs (four
// cards: the git event, whether it is on, the rule it enforces and its
// test), the first ten lines of its script as code (comments in green), and
// its two files. Nothing uses a hook, so the side column has only the files.
// Copy word for word from references/toolkit/D09/frame.json.
// The list beside it has D4's data (ruleOpen: T1's list with the Workflows
// and Hooks groups). The frame draws only the Rules, Workflows and Hooks
// groups, as D7 draws only Skills and Agents, so the Skills and Agents groups
// are left out; the chips keep every kind's count.
import { hookUsage } from './shared/activity.ts'
import { hookResults } from './shared/evalResults.ts'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { ruleOpen } from './ruleOpen.ts'

const comment = (text: string) => [{ text, kind: 'comment' as const }]
const plain = (text: string) => [{ text }]

const commitMsg: ToolkitItemDetailView = {
  path: 'hooks/commit-msg',
  location: 'toolkit/hooks/commit-msg',
  changed: 'changed 6 days ago',
  description:
    'Checks a commit message against toolkit/rules/commits-and-prs.md and exits 1 with one line per problem. It checks form only; whether the type is right and the body says why is left to review.',
  runs: {
    label: 'When it runs',
    facts: [
      { icon: 'event', label: 'Event', value: 'commit-msg', caption: 'git runs it on every commit' },
      // The note: State reads core.hooksPath; it was on on this machine on 2026-11-14.
      {
        icon: 'state',
        label: 'State',
        value: 'Enabled',
        status: 'on',
        caption: 'core.hooksPath = toolkit/hooks, set by link.sh',
      },
      {
        icon: 'rule',
        label: 'Enforces',
        value: 'commits-and-prs.md',
        caption: 'change the rule and the hook together',
      },
      { icon: 'test', label: 'Test', value: 'test-commit-msg', caption: 'runs the rule’s ✗ and ✓ examples' },
    ],
  },
  // The Evals tab (D20, D25 to D28).
  results: hookResults,
  // The Activity tab (D17, D21 to D24).
  activity: hookUsage,
  tabs: [
    { value: 'overview', label: 'Overview' },
    { value: 'how', label: 'How it works' },
    { value: 'files', label: 'Files' },
    { value: 'links', label: 'Links' },
    { value: 'evals', label: 'Evals' },
    { value: 'activity', label: 'Activity' },
  ],
  preview: {
    file: 'commit-msg',
    meta: 'bash · 142 lines',
    blocks: [],
    code: [
      comment('#!/usr/bin/env bash'),
      comment('# commit-msg <message-file>'),
      comment('# Checks a commit message against toolkit/rules/commits-and-prs.md and'),
      comment('# exits 1 with one line per problem. Git runs it from the top of the work'),
      comment('# tree once `core.hooksPath` is `toolkit/hooks` (link.sh sets that).'),
      plain('set -u'),
      plain('RULE="toolkit/rules/commits-and-prs.md"'),
      plain('TYPES="feat fix perf refactor docs test build ci chore revert"'),
      plain('TOOLKIT_SCOPES="skills rules toolkit hooks"'),
      plain('MAX=72'),
    ],
  },
  files: {
    count: 2,
    lines: [
      { type: 'code', names: ['commit-msg'], meta: '142 lines' },
      { type: 'code', names: ['test-commit-msg'], meta: '97 lines' },
    ],
  },
}

export const hookOpen = {
  title: 'a hook open beside the list',
  frames: [{ id: 'D9', node: '433:1136', viewport: 'desktop' }],
  data: {
    ...ruleOpen.data,
    groups: ruleOpen.data.groups.filter((g) => g.kind === 'rule' || g.kind === 'workflow' || g.kind === 'hook'),
    details: [commitMsg],
  },
  ui: { ...ruleOpen.ui, open: 'hooks/commit-msg' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
