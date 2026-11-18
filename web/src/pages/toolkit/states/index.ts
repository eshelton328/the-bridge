// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story. The first is
// the one the route shows.
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
}
