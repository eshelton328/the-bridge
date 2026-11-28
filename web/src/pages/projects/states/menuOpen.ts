// Projects D10 (references/projects/D10, a PNG reference: Figma
// yJaVpShE9RVoQwUeUBnMQ4 node 37:2, d-133): the Projects home on the desktop
// with the Pinpoint card's ⋯ menu open (Pin to top, Edit details). The data is
// the brain's three projects on 2026-11-26, word for word, NCC-1701 pinned
// first, except that NCC-1701's purpose says "The owner's" for the owner's
// name, which the secret scan's personal-term rule keeps out of web/. It holds the data the other states share. Its rail draws no Inbox
// count.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'

export const menuOpen = {
  title: 'The Projects home on the desktop with the Pinpoint menu open',
  frames: [{ id: 'D10', node: '37:2', viewport: 'desktop' }],
  data: {
    title: 'Projects',
    newProject: 'New project',
    railBadge: 0,
    cardsHeading: 'All projects',
    menu: { label: 'Actions for {name}', pin: 'Pin to top', unpin: 'Unpin', edit: 'Edit details' },
    page: {
      back: 'Projects',
      backLabel: 'Back to Projects',
      quickChat: 'Quick chat',
      tabs: 'Project sections',
      overview: 'Overview',
      ideas: 'Ideas',
      repositories: 'Repositories',
      qa: 'QA',
      architecture: 'Architecture',
      message: 'First message',
      retry: 'Retry',
      panels: {
        inbox: 'Inbox',
        queue: 'Queue',
        needsYou: 'Needs you',
        toReview: 'To review',
        inProgress: 'In progress',
      },
      pulls: { draft: 'Draft', ciFailed: 'CI failed', ciRunning: 'CI running', inReview: 'In review' },
      kinds: { approval: 'Approval', question: 'Question', review: 'Review', action: 'Action' },
      ideaBack: 'Ideas',
      ideaBackLabel: 'Back to Ideas',
      ideaChat: 'Chat about this idea',
      noIdeas: 'No ideas yet',
      ideaKinds: { idea: 'Idea', proposal: 'Proposal', audit: 'Audit' },
      ideaStates: {
        open: 'Open',
        'in-design': 'In design',
        'needs-you': 'Needs you',
        decided: 'Decided',
        parked: 'Parked',
      },
      ideaTools: {
        search: 'Search ideas',
        sort: 'Sort by',
        sorts: { updated: 'Updated', title: 'Idea', kind: 'Kind', state: 'State' },
        noMatch: 'No idea matches',
      },
      chats: {
        title: 'Chats',
        none: 'No chats tagged with this project',
        statuses: { working: 'Working', needsYou: 'Needs you', idle: 'Idle', done: 'Done', unknown: 'Unknown' },
        search: 'Search chats',
        chips: 'Filter by area',
        noMatch: 'No chat matches',
      },
      noRepositories: 'No repositories',
      visibility: { public: 'Public', private: 'Private', internal: 'Internal' },
      counts: { worktree: '{n} worktree', worktrees: '{n} worktrees' },
      unread: { about: 'GitHub facts not read', worktrees: 'Worktrees not read' },
      ci: {
        asOf: 'as of {age} ago',
        none: 'No finished CI runs in 30 days',
        reading: 'Reading CI',
        notRead: 'CI not read',
      },
      repository: { github: 'View on GitHub', githubShort: 'GitHub' },
      stats: {
        passRate: 'CI pass rate',
        passRuns: '{green} of {finished} runs',
        mergeTime: 'PR merge time',
        hours: '{n} h',
        mergeP90: 'median · p90 {p90} h',
        runTime: 'CI run time',
        minutes: '{n} min',
        runMedian: 'median of green runs',
        openPulls: 'Open PRs',
        drift: 'Drift findings',
        driftAt: 'at the last check',
        none: 'None',
        noMerge: 'No PR merged in 30 days',
        noGreen: 'No green run in 30 days',
        noCheck: 'No check yet',
        checkFailed: 'The check did not run',
        notRead: 'Not read',
      },
      qaGroups: { beforeMerge: 'Before merge', afterMerge: 'After merge' },
      noQa: 'Nothing waits for your check',
      qaStatuses: {
        waiting: 'Waiting',
        changesRequested: 'Changes requested',
        ciFailing: 'CI failing',
        approved: 'Approved',
      },
      qaWorktrees: {
        stopped: 'Stopped',
        starting: 'Starting',
        running: 'Running',
        failed: 'Failed',
        servedApp: 'Served app',
      },
      arch: {
        chips: 'Diagram scope',
        system: 'System',
        none: 'No diagram yet',
        caption: '{view} view from main at {commit}, {date}',
        views: { container: 'Container', component: 'Component', build: 'Build' },
        parts: 'Parts',
        arrows: 'Arrows',
        arrow: '{from} {label} {to}',
        stack: 'Stack',
        stackSource: 'From package.json',
        running: 'Making the diagram',
      },
    },
    projects: [
      {
        slug: 'ncc-1701',
        name: 'NCC-1701',
        purpose:
          "The owner's personal workspace for thinking, learning, managing projects and directing AI agents, plus the shared template for new projects.",
        icon: null,
        pinned: true,
      },
      {
        slug: 'pinpoint',
        name: 'Pinpoint',
        purpose:
          'A Chrome extension that pins comments on web pages and sends them, with the exact place on the page, to a Herdr agent.',
        icon: null,
        pinned: false,
      },
      {
        slug: 'omni',
        name: 'omni',
        purpose:
          "Package NCC-1701's reusable parts (templates, rules, skills, agents, workflows and the-bridge) so someone else can start their own NCC-1701.",
        icon: null,
        pinned: false,
      },
    ],
  },
  ui: { menuFor: 'pinpoint' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
