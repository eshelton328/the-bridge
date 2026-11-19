// Figma Artifacts D1 "D1 · Library": every Claude artifact and Codex site in
// one grid, with what the library found since the owner last looked at the top,
// marked New. Copy taken word for word from references/artifacts/D01/frame.json.
// It also holds what later states share: the chips, the sorts and the cards.
// Each card has its artifact's link, as the library is a list of links; D1
// draws none, so the links are not Figma's: a Claude artifact's has the form
// of D2's (claude.ai/artifact/…), a Codex site's its own domain, as D5's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactCard, ArtifactsData, ArtifactsUi } from '../types.ts'

const claude = { source: 'claude', sourceLabel: 'Claude' } as const
const codex = { source: 'codex', sourceLabel: 'Codex site' } as const

/** The four cards of "Found since you last looked" (402:15433). */
const foundCards = [
  {
    id: 'skill-eval-pass-rates',
    title: 'Skill eval pass rates',
    description: 'Pass rates per round, with and without each skill',
    preview: 'chart',
    ...claude,
    project: 'skill-evals',
    age: '12m',
    isNew: true,
    link: 'claude.ai/artifact/8f3c2a91-skill-evals',
  },
  {
    id: 'hono-server-spike',
    title: 'Hono server spike',
    description: 'Routes, the RPC client and the owner check over Tailscale',
    preview: 'ui',
    ...codex,
    project: 'ncc-1701',
    age: '40m',
    isNew: true,
    link: 'hono-spike.example.com/rpc',
  },
  {
    id: 'inbox-task-lifecycle',
    title: 'Inbox task lifecycle',
    description: 'How a task moves from Next step to Running to Done',
    preview: 'diagram',
    ...claude,
    project: 'ncc-1701',
    age: '1h',
    isNew: true,
    link: 'claude.ai/artifact/2b7e4d10-inbox-task-lifecycle',
  },
  {
    id: 'tailscale-access-check',
    title: 'Tailscale access check',
    description: 'Which devices reach the-bridge, and the owner check on writes',
    preview: 'doc',
    ...codex,
    project: 'ncc-1701',
    age: '2h',
    isNew: true,
    link: 'tailscale-check.example.com/devices',
  },
] satisfies ArtifactCard[]

/** The cards of "Earlier" that the frame draws (402:15556, 402:15679). */
const earlierCards = [
  {
    id: 'the-bridge-theme-ideas',
    title: 'the-bridge theme ideas',
    description: 'Viewscreen, Captain’s Log, Engineering and Console side by side',
    preview: 'grid',
    ...claude,
    project: 'ncc-1701',
    age: '1d',
    isNew: false,
    link: 'claude.ai/artifact/5d19a7c3-theme-ideas',
  },
  {
    id: 'application-versioning',
    title: 'Application versioning and releases',
    description: 'Research report: versioning schemes, changelogs and release automation',
    preview: 'doc',
    ...claude,
    project: 'omni',
    age: '2d',
    isNew: false,
    link: 'claude.ai/artifact/a04f6e28-versioning-report',
  },
  {
    id: 'panda-tokens-playground',
    title: 'Panda tokens playground',
    description: 'Semantic tokens for Viewscreen, switched live',
    preview: 'grid',
    ...codex,
    project: 'ncc-1701',
    age: '3d',
    isNew: false,
    link: 'panda-tokens.example.com/playground',
  },
  {
    id: 'agent-factory',
    title: 'Agent factory and session tracking',
    description: 'Research report: run manifests and session history',
    preview: 'doc',
    // Its title bar is green (402:15650).
    tone: 'green',
    ...claude,
    project: 'omni',
    age: '4d',
    isNew: false,
    link: 'claude.ai/artifact/e93b1c57-agent-factory',
  },
  {
    id: 'brain-map-prototype',
    title: 'Brain map prototype',
    description: 'Notes and their links, by folder',
    preview: 'diagram',
    ...claude,
    project: 'omni-brain',
    age: '5d',
    isNew: false,
    link: 'claude.ai/artifact/71c8d2fa-brain-map',
  },
  {
    id: 'type-safety-agentic',
    title: 'Type safety in agentic systems',
    description: 'Research report',
    preview: 'doc',
    // Its title bar is violet (402:15716).
    tone: 'violet',
    ...claude,
    project: 'omni',
    age: '1w',
    isNew: false,
    link: 'claude.ai/artifact/3fa60b9e-type-safety',
  },
  {
    id: 'logo-options',
    title: 'Logo options',
    description: 'Twelve marks, Span in use for now',
    preview: 'grid',
    ...claude,
    project: 'ncc-1701',
    age: '1w',
    isNew: false,
    link: 'claude.ai/artifact/c2e57a14-logo-options',
  },
  {
    id: 'readme-cold-reader-run',
    title: 'readme cold-reader run',
    description: 'Pass rates per round, with and without each skill',
    preview: 'chart',
    // Its chart is amber (402:15771; D2 403:422, D4 403:8248, D5 403:7509).
    tone: 'amber',
    ...codex,
    project: 'skill-evals',
    age: '1w',
    isNew: false,
    link: 'readme-cold-reader.example.com/run',
  },
] satisfies ArtifactCard[]

export const library = {
  title: 'The library: everything found, newest first',
  frames: [{ id: 'D1', node: '402:15229', viewport: 'desktop' }],
  data: {
    title: 'Artifacts',
    count: 24,
    railBadge: 4,
    found: 'Checked Claude and Codex 2m ago',
    addLink: 'Add a link',
    chips: [
      { value: 'all', label: 'All', count: 24 },
      { value: 'claude', label: 'Claude', count: 17 },
      { value: 'codex', label: 'Codex', count: 7 },
      { value: 'new', label: 'New', count: 4 },
    ],
    searchPlaceholder: 'Search titles, descriptions and links',
    sorts: [{ value: 'newest', label: 'Newest' }],
    groups: [
      { id: 'found', label: 'Found since you last looked', count: 4, dot: true, cards: foundCards },
      { id: 'earlier', label: 'Earlier', count: 20, dot: false, cards: earlierCards },
    ],
  },
  ui: {
    filter: 'all',
    sort: 'newest',
    view: 'grid',
    groupsOpen: { found: true, earlier: true },
    query: '',
  },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
