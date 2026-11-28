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
      noIdeas: 'No ideas yet',
      ideaKinds: { idea: 'Idea', proposal: 'Proposal', audit: 'Audit' },
      ideaStates: {
        open: 'Open',
        'in-design': 'In design',
        'needs-you': 'Needs you',
        decided: 'Decided',
        parked: 'Parked',
      },
      chats: {
        title: 'Chats',
        none: 'No chats tagged with this project',
        statuses: { working: 'Working', needsYou: 'Needs you', idle: 'Idle', done: 'Done', unknown: 'Unknown' },
        search: 'Search chats',
        chips: 'Filter by area',
        noMatch: 'No chat matches',
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
