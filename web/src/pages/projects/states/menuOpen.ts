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
      counts: {
        openPull: '{n} open PR',
        openPulls: '{n} open PRs',
        worktree: '{n} worktree',
        worktrees: '{n} worktrees',
      },
      unread: { about: 'GitHub facts not read', pulls: 'Open PRs not read', worktrees: 'Worktrees not read' },
      ci: {
        runs: 'CI {green}/{finished} green',
        minutes: '{n} min a run',
        asOf: 'as of {age} ago',
        none: 'No finished CI runs in 30 days',
        reading: 'Reading CI',
        notRead: 'CI not read',
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
