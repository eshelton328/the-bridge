// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. With no
// ?state= the route shows the page's home (../home.ts), not one of these.
import { moreDrawer } from './moreDrawer.ts'
import { ruleOpen } from './ruleOpen.ts'
import { skillOpen } from './skillOpen.ts'
import { toolkitList } from './toolkitList.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'
import { toolkitMap } from './toolkitMap.ts'
import { toolkitMapTablet } from './toolkitMapTablet.ts'
import { agentOpen } from './agentOpen.ts'
import { hookOpen } from './hookOpen.ts'
import { workflowOpen } from './workflowOpen.ts'
import { skillOpenTablet } from './skillOpenTablet.ts'
import { skillOpenPhone } from './skillOpenPhone.ts'
import { ruleOpenTablet } from './ruleOpenTablet.ts'
import { ruleOpenPhone } from './ruleOpenPhone.ts'
import { hookOpenTablet } from './hookOpenTablet.ts'
import { hookOpenPhone } from './hookOpenPhone.ts'
import { agentOpenTablet } from './agentOpenTablet.ts'
import { agentOpenPhone } from './agentOpenPhone.ts'
import { workflowOpenTablet } from './workflowOpenTablet.ts'
import { workflowOpenPhone } from './workflowOpenPhone.ts'
import { skillHowItWorks } from './skillHowItWorks.ts'
import { ruleHowItWorks } from './ruleHowItWorks.ts'
import { agentHowItWorks } from './agentHowItWorks.ts'
import { hookHowItWorks } from './hookHowItWorks.ts'
import { skillHowItWorksTablet } from './skillHowItWorksTablet.ts'
import { skillHowItWorksPhone } from './skillHowItWorksPhone.ts'
import { ruleHowItWorksTablet } from './ruleHowItWorksTablet.ts'
import { agentHowItWorksTablet } from './agentHowItWorksTablet.ts'
import { hookHowItWorksTablet } from './hookHowItWorksTablet.ts'
import { ruleHowItWorksPhone } from './ruleHowItWorksPhone.ts'
import { agentHowItWorksPhone } from './agentHowItWorksPhone.ts'
import { hookHowItWorksPhone } from './hookHowItWorksPhone.ts'
import { workflowFullPage } from './workflowFullPage.ts'
import { workflowFullPageTablet } from './workflowFullPageTablet.ts'
import { workflowFullPagePhone } from './workflowFullPagePhone.ts'
import { skillFiles } from './skillFiles.ts'
import { scriptExplained } from './scriptExplained.ts'
import { ruleFiles } from './ruleFiles.ts'
import { agentFiles } from './agentFiles.ts'
import { workflowFiles } from './workflowFiles.ts'
import { hookFiles } from './hookFiles.ts'
import { skillFilesTablet } from './skillFilesTablet.ts'
import { scriptExplainedTablet } from './scriptExplainedTablet.ts'
import { ruleFilesTablet } from './ruleFilesTablet.ts'
import { agentFilesTablet } from './agentFilesTablet.ts'
import { workflowFilesTablet } from './workflowFilesTablet.ts'
import { hookFilesTablet } from './hookFilesTablet.ts'
import { skillFilesPhone } from './skillFilesPhone.ts'
import { scriptCodePhone } from './scriptCodePhone.ts'
import { scriptExplainedPhone } from './scriptExplainedPhone.ts'
import { ruleFilesPhone } from './ruleFilesPhone.ts'
import { agentFilesPhone } from './agentFilesPhone.ts'
import { workflowFilesPhone } from './workflowFilesPhone.ts'
import { hookFilesPhone } from './hookFilesPhone.ts'
import { skillLinks } from './skillLinks.ts'
import { ruleLinks } from './ruleLinks.ts'
import { agentLinks } from './agentLinks.ts'
import { workflowLinks } from './workflowLinks.ts'
import { hookLinks } from './hookLinks.ts'
import { skillLinksTablet } from './skillLinksTablet.ts'
import { ruleLinksTablet } from './ruleLinksTablet.ts'
import { agentLinksTablet } from './agentLinksTablet.ts'
import { workflowLinksTablet } from './workflowLinksTablet.ts'
import { hookLinksTablet } from './hookLinksTablet.ts'
import { skillLinksPhone } from './skillLinksPhone.ts'
import { ruleLinksPhone } from './ruleLinksPhone.ts'
import { agentLinksPhone } from './agentLinksPhone.ts'
import { workflowLinksPhone } from './workflowLinksPhone.ts'
import { hookLinksPhone } from './hookLinksPhone.ts'
import { skillEvals } from './skillEvals.ts'
import { ruleEvals } from './ruleEvals.ts'
import { agentEvals } from './agentEvals.ts'
import { workflowEvals } from './workflowEvals.ts'
import { hookEvals } from './hookEvals.ts'
import { skillEvalsTablet } from './skillEvalsTablet.ts'
import { ruleEvalsTablet } from './ruleEvalsTablet.ts'
import { agentEvalsTablet } from './agentEvalsTablet.ts'
import { workflowEvalsTablet } from './workflowEvalsTablet.ts'
import { hookEvalsTablet } from './hookEvalsTablet.ts'
import { skillEvalsPhone } from './skillEvalsPhone.ts'
import { ruleEvalsPhone } from './ruleEvalsPhone.ts'
import { agentEvalsPhone } from './agentEvalsPhone.ts'
import { workflowEvalsPhone } from './workflowEvalsPhone.ts'
import { hookEvalsPhone } from './hookEvalsPhone.ts'
import { skillActivity } from './skillActivity.ts'
import { ruleActivity } from './ruleActivity.ts'
import { agentActivity } from './agentActivity.ts'
import { workflowActivity } from './workflowActivity.ts'
import { hookActivity } from './hookActivity.ts'
import { skillActivityTablet } from './skillActivityTablet.ts'
import { ruleActivityTablet } from './ruleActivityTablet.ts'
import { agentActivityTablet } from './agentActivityTablet.ts'
import { workflowActivityTablet } from './workflowActivityTablet.ts'
import { hookActivityTablet } from './hookActivityTablet.ts'
import { skillActivityPhone } from './skillActivityPhone.ts'
import { ruleActivityPhone } from './ruleActivityPhone.ts'
import { agentActivityPhone } from './agentActivityPhone.ts'
import { workflowActivityPhone } from './workflowActivityPhone.ts'
import { hookActivityPhone } from './hookActivityPhone.ts'
import { skillDiscuss } from './skillDiscuss.ts'
import { skillDiscussTablet } from './skillDiscussTablet.ts'
import { skillDiscussPhone } from './skillDiscussPhone.ts'
import { toolkitActivity } from './toolkitActivity.ts'
import { toolkitActivityRun } from './toolkitActivityRun.ts'
import { toolkitActivityTablet } from './toolkitActivityTablet.ts'
import { toolkitActivityPhone } from './toolkitActivityPhone.ts'
import { toolkitActivityChats } from './toolkitActivityChats.ts'
import { toolkitActivityHeadless } from './toolkitActivityHeadless.ts'
import { toolkitActivityChat } from './toolkitActivityChat.ts'
import { toolkitActivityChatsTablet } from './toolkitActivityChatsTablet.ts'
import { toolkitActivityHeadlessTablet } from './toolkitActivityHeadlessTablet.ts'
import { toolkitActivityChatTablet } from './toolkitActivityChatTablet.ts'
import { toolkitActivityChatsPhone } from './toolkitActivityChatsPhone.ts'
import { toolkitActivityHeadlessPhone } from './toolkitActivityHeadlessPhone.ts'
import { toolkitActivityChatPhone } from './toolkitActivityChatPhone.ts'

export const toolkitStates = {
  toolkitList,
  toolkitListTablet,
  moreDrawer,
  toolkitMap,
  toolkitMapTablet,
  skillOpen,
  ruleOpen,
  agentOpen,
  hookOpen,
  workflowOpen,
  skillOpenTablet,
  skillOpenPhone,
  ruleOpenTablet,
  ruleOpenPhone,
  hookOpenTablet,
  hookOpenPhone,
  agentOpenTablet,
  agentOpenPhone,
  workflowOpenTablet,
  workflowOpenPhone,
  skillHowItWorks,
  ruleHowItWorks,
  agentHowItWorks,
  hookHowItWorks,
  skillHowItWorksTablet,
  skillHowItWorksPhone,
  ruleHowItWorksTablet,
  agentHowItWorksTablet,
  hookHowItWorksTablet,
  ruleHowItWorksPhone,
  agentHowItWorksPhone,
  hookHowItWorksPhone,
  workflowFullPage,
  workflowFullPageTablet,
  workflowFullPagePhone,
  skillFiles,
  scriptExplained,
  ruleFiles,
  agentFiles,
  workflowFiles,
  hookFiles,
  skillFilesTablet,
  scriptExplainedTablet,
  ruleFilesTablet,
  agentFilesTablet,
  workflowFilesTablet,
  hookFilesTablet,
  skillFilesPhone,
  scriptCodePhone,
  scriptExplainedPhone,
  ruleFilesPhone,
  agentFilesPhone,
  workflowFilesPhone,
  hookFilesPhone,
  skillLinks,
  ruleLinks,
  agentLinks,
  workflowLinks,
  hookLinks,
  skillLinksTablet,
  ruleLinksTablet,
  agentLinksTablet,
  workflowLinksTablet,
  hookLinksTablet,
  skillLinksPhone,
  ruleLinksPhone,
  agentLinksPhone,
  workflowLinksPhone,
  hookLinksPhone,
  skillEvals,
  ruleEvals,
  agentEvals,
  workflowEvals,
  hookEvals,
  skillEvalsTablet,
  ruleEvalsTablet,
  agentEvalsTablet,
  workflowEvalsTablet,
  hookEvalsTablet,
  skillEvalsPhone,
  ruleEvalsPhone,
  agentEvalsPhone,
  workflowEvalsPhone,
  hookEvalsPhone,
  skillActivity,
  ruleActivity,
  agentActivity,
  workflowActivity,
  hookActivity,
  skillActivityTablet,
  ruleActivityTablet,
  agentActivityTablet,
  workflowActivityTablet,
  hookActivityTablet,
  skillActivityPhone,
  ruleActivityPhone,
  agentActivityPhone,
  workflowActivityPhone,
  hookActivityPhone,
  skillDiscuss,
  skillDiscussTablet,
  skillDiscussPhone,
  toolkitActivity,
  toolkitActivityRun,
  toolkitActivityTablet,
  toolkitActivityPhone,
  toolkitActivityChats,
  toolkitActivityHeadless,
  toolkitActivityChat,
  toolkitActivityChatsTablet,
  toolkitActivityHeadlessTablet,
  toolkitActivityChatTablet,
  toolkitActivityChatsPhone,
  toolkitActivityHeadlessPhone,
  toolkitActivityChatPhone,
}
