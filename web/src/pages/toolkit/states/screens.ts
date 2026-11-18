// The Toolkit page's screens (screen review R10): the states that draw
// each screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/ToolkitScreens.stories.tsx. Every state is in
// exactly one screen (states/screens.test.ts). toolkitListTablet (T1, M1)
// and toolkitMapTablet (T2, M11) each draw two devices, so each stands on
// the tablet and the list and the map have no phone state of their own.
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { toolkitStates } from './index.ts'

export const toolkitScreens = {
  list: { title: 'The list', desktop: 'toolkitList', tablet: 'toolkitListTablet' },
  map: { title: 'The map', desktop: 'toolkitMap', tablet: 'toolkitMapTablet' },
  more: { title: 'The More drawer', phone: 'moreDrawer' },
  skillOverview: { title: 'A skill', desktop: 'skillOpen', tablet: 'skillOpenTablet', phone: 'skillOpenPhone' },
  ruleOverview: { title: 'A rule', desktop: 'ruleOpen', tablet: 'ruleOpenTablet', phone: 'ruleOpenPhone' },
  agentOverview: { title: 'An agent', desktop: 'agentOpen', tablet: 'agentOpenTablet', phone: 'agentOpenPhone' },
  hookOverview: { title: 'A hook', desktop: 'hookOpen', tablet: 'hookOpenTablet', phone: 'hookOpenPhone' },
  workflowOverview: {
    title: 'A workflow',
    desktop: 'workflowOpen',
    tablet: 'workflowOpenTablet',
    phone: 'workflowOpenPhone',
  },
  skillHowItWorks: {
    title: 'How a skill works',
    desktop: 'skillHowItWorks',
    tablet: 'skillHowItWorksTablet',
    phone: 'skillHowItWorksPhone',
  },
  ruleHowItWorks: {
    title: 'How a rule works',
    desktop: 'ruleHowItWorks',
    tablet: 'ruleHowItWorksTablet',
    phone: 'ruleHowItWorksPhone',
  },
  agentHowItWorks: {
    title: 'How an agent works',
    desktop: 'agentHowItWorks',
    tablet: 'agentHowItWorksTablet',
    phone: 'agentHowItWorksPhone',
  },
  hookHowItWorks: {
    title: 'How a hook works',
    desktop: 'hookHowItWorks',
    tablet: 'hookHowItWorksTablet',
    phone: 'hookHowItWorksPhone',
  },
  workflowPage: {
    title: 'The workflow page',
    desktop: 'workflowFullPage',
    tablet: 'workflowFullPageTablet',
    phone: 'workflowFullPagePhone',
  },
  skillFiles: { title: "A skill's files", desktop: 'skillFiles', tablet: 'skillFilesTablet', phone: 'skillFilesPhone' },
  ruleFiles: { title: "A rule's files", desktop: 'ruleFiles', tablet: 'ruleFilesTablet', phone: 'ruleFilesPhone' },
  agentFiles: {
    title: "An agent's files",
    desktop: 'agentFiles',
    tablet: 'agentFilesTablet',
    phone: 'agentFilesPhone',
  },
  workflowFiles: {
    title: "A workflow's files",
    desktop: 'workflowFiles',
    tablet: 'workflowFilesTablet',
    phone: 'workflowFilesPhone',
  },
  hookFiles: { title: "A hook's files", desktop: 'hookFiles', tablet: 'hookFilesTablet', phone: 'hookFilesPhone' },
  scriptExplained: {
    title: 'A script explained',
    desktop: 'scriptExplained',
    tablet: 'scriptExplainedTablet',
    phone: 'scriptExplainedPhone',
  },
  scriptCode: { title: "A script's code", phone: 'scriptCodePhone' },
  skillLinks: { title: "A skill's links", desktop: 'skillLinks', tablet: 'skillLinksTablet', phone: 'skillLinksPhone' },
  ruleLinks: { title: "A rule's links", desktop: 'ruleLinks', tablet: 'ruleLinksTablet', phone: 'ruleLinksPhone' },
  agentLinks: {
    title: "An agent's links",
    desktop: 'agentLinks',
    tablet: 'agentLinksTablet',
    phone: 'agentLinksPhone',
  },
  workflowLinks: {
    title: "A workflow's links",
    desktop: 'workflowLinks',
    tablet: 'workflowLinksTablet',
    phone: 'workflowLinksPhone',
  },
  hookLinks: { title: "A hook's links", desktop: 'hookLinks', tablet: 'hookLinksTablet', phone: 'hookLinksPhone' },
  skillEvals: { title: "A skill's evals", desktop: 'skillEvals', tablet: 'skillEvalsTablet', phone: 'skillEvalsPhone' },
  ruleEvals: { title: "A rule's evals", desktop: 'ruleEvals', tablet: 'ruleEvalsTablet', phone: 'ruleEvalsPhone' },
  agentEvals: {
    title: "An agent's evals",
    desktop: 'agentEvals',
    tablet: 'agentEvalsTablet',
    phone: 'agentEvalsPhone',
  },
  workflowEvals: {
    title: "A workflow's evals",
    desktop: 'workflowEvals',
    tablet: 'workflowEvalsTablet',
    phone: 'workflowEvalsPhone',
  },
  hookEvals: { title: "A hook's evals", desktop: 'hookEvals', tablet: 'hookEvalsTablet', phone: 'hookEvalsPhone' },
  skillActivity: {
    title: "A skill's activity",
    desktop: 'skillActivity',
    tablet: 'skillActivityTablet',
    phone: 'skillActivityPhone',
  },
  ruleActivity: {
    title: "A rule's activity",
    desktop: 'ruleActivity',
    tablet: 'ruleActivityTablet',
    phone: 'ruleActivityPhone',
  },
  agentActivity: {
    title: "An agent's activity",
    desktop: 'agentActivity',
    tablet: 'agentActivityTablet',
    phone: 'agentActivityPhone',
  },
  workflowActivity: {
    title: "A workflow's activity",
    desktop: 'workflowActivity',
    tablet: 'workflowActivityTablet',
    phone: 'workflowActivityPhone',
  },
  hookActivity: {
    title: "A hook's activity",
    desktop: 'hookActivity',
    tablet: 'hookActivityTablet',
    phone: 'hookActivityPhone',
  },
  discuss: {
    title: 'The discussion',
    desktop: 'skillDiscuss',
    tablet: 'skillDiscussTablet',
    phone: 'skillDiscussPhone',
  },
  activityView: {
    title: 'The Activity view',
    desktop: 'toolkitActivity',
    tablet: 'toolkitActivityTablet',
    phone: 'toolkitActivityPhone',
  },
  activityRun: { title: 'A run', desktop: 'toolkitActivityRun' },
  activityChats: {
    title: 'The chats',
    desktop: 'toolkitActivityChats',
    tablet: 'toolkitActivityChatsTablet',
    phone: 'toolkitActivityChatsPhone',
  },
  activityHeadless: {
    title: 'The headless runs',
    desktop: 'toolkitActivityHeadless',
    tablet: 'toolkitActivityHeadlessTablet',
    phone: 'toolkitActivityHeadlessPhone',
  },
  activityChat: {
    title: 'A chat',
    desktop: 'toolkitActivityChat',
    tablet: 'toolkitActivityChatTablet',
    phone: 'toolkitActivityChatPhone',
  },
} as const satisfies ScreenMap<keyof typeof toolkitStates>
