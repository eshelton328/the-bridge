import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { toolkitStates } from '../states/index.ts'
import { ToolkitScreen } from './ToolkitScreen.tsx'

// One story per Figma state of the Toolkit, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's
// own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Toolkit',
  component: ToolkitScreen,
} satisfies Meta<typeof ToolkitScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ToolkitList: Story = {
  name: 'D1: the list of every toolkit item',
  args: { data: toolkitStates.toolkitList.data, ui: toolkitStates.toolkitList.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /All/ })).toBeChecked()
    await expect(canvas.getByRole('heading', { name: 'agents-md' })).toBeVisible()
    await expect(canvas.getByText('agents/pr-description-checker.md')).toBeVisible()
    await expect(canvas.getByText('Read from toolkit/ in the brain')).toBeVisible()
  },
}

export const ToolkitListTablet: Story = {
  name: 'T1: the list of every toolkit item, in two columns',
  args: { data: toolkitStates.toolkitListTablet.data, ui: toolkitStates.toolkitListTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'commits-and-prs' })).toBeVisible()
    await expect(canvas.getByText('rules/writing.md')).toBeVisible()
  },
}

export const MoreDrawer: Story = {
  name: 'M4: the More drawer over the tab bar, with Toolkit after Artifacts',
  args: { data: toolkitStates.moreDrawer.data, ui: toolkitStates.moreDrawer.ui, viewport: 'phone' },
  play: async () => {
    // The drawer renders in a portal, outside the story's canvas.
    const drawer = await within(document.body).findByRole('dialog', { name: 'More' })
    await expect(within(drawer).getByText('Agents, skills, workflows, rules and hooks')).toBeVisible()
    await expect(within(drawer).getByRole('button', { name: /Toolkit/ })).toHaveAttribute('aria-current', 'page')
    await expect(within(drawer).getByRole('button', { name: /Brain/ })).toBeDisabled()
    await expect(within(drawer).getByText('Later')).toBeVisible()
  },
}

export const ToolkitMap: Story = {
  name: 'D2: the map, with writer selected and its links lit',
  args: { data: toolkitStates.toolkitMap.data, ui: toolkitStates.toolkitMap.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: /Map/ })).toBeChecked()
    await expect(canvas.getByText('A line means one file links to another')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /writer/, pressed: true })).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'writer' })).toHaveTextContent('→ links to 7')
    await expect(canvas.getByRole('button', { name: 'Open writer' })).toBeVisible()
  },
}

export const ToolkitMapTablet: Story = {
  name: 'T2: the map on a tablet, with writer selected in the bar at its foot',
  args: { data: toolkitStates.toolkitMapTablet.data, ui: toolkitStates.toolkitMapTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Rules, hooks')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /writer/, pressed: true })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open writer' })).toBeVisible()
  },
}

export const SkillOpen: Story = {
  name: 'D3: a skill open beside the list',
  args: { data: toolkitStates.skillOpen.data, ui: toolkitStates.skillOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('toolkit/skills/writer/')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Copy toolkit/skills/writer/' })).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 1, name: 'writer' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    // The skill writer's row in the list is the open one; the agent writer's is not.
    await expect(canvas.getByRole('button', { name: 'writer', current: true })).toBeVisible()
  },
}

export const RuleOpen: Story = {
  name: 'D4: a rule open beside the list',
  args: { data: toolkitStates.ruleOpen.data, ui: toolkitStates.ruleOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByText('toolkit/rules/skills.md')).toBeVisible()
    await expect(within(item).getByText('Loads when')).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 2, name: 'Layout' })).toBeVisible()
    // The rule's row in the list is the open one; the list adds the Hooks group.
    await expect(canvas.getByRole('button', { name: 'skills', current: true })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: /Hooks/ })).toBeInTheDocument()
  },
}

export const AgentOpen: Story = {
  name: 'D7: an agent open beside the list',
  args: { data: toolkitStates.agentOpen.data, ui: toolkitStates.agentOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByText('toolkit/agents/writing-reviewer.md')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('opus')).toBeVisible()
    await expect(within(runs).getByText('codex_effort; default model')).toBeVisible()
    await expect(within(runs).getByText('Bash, Read, Grep, Glob')).toBeVisible()
    await expect(within(item).getByText('137 lines · the prompt')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 1, name: 'Prompt' })).toBeVisible()
    // The agent's row is the open one, and the Skills group is closed.
    await expect(canvas.getByRole('button', { name: 'writing-reviewer', current: true })).toBeVisible()
    await expect(canvas.queryByText('skills/writer/')).toBeNull()
  },
}

export const HookOpen: Story = {
  name: 'D9: a hook open beside the list',
  args: { data: toolkitStates.hookOpen.data, ui: toolkitStates.hookOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByText('toolkit/hooks/commit-msg')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('git runs it on every commit')).toBeVisible()
    await expect(within(runs).getByText('Enabled')).toBeVisible()
    await expect(within(runs).getByText('core.hooksPath = toolkit/hooks, set by link.sh')).toBeVisible()
    await expect(within(runs).getByText('test-commit-msg')).toBeVisible()
    // The preview is code, not markdown: the script's lines, with no rendered title.
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
    await expect(within(item).getByText('#!/usr/bin/env bash')).toBeVisible()
    await expect(within(item).getByText('MAX=72')).toBeVisible()
    await expect(within(item).queryByRole('heading', { level: 1 })).toBeNull()
    await expect(within(item).getByText('97 lines')).toBeVisible()
    // The hook's row is the open one, and the list shows no Skills group.
    await expect(canvas.getByRole('button', { name: 'commit-msg', current: true })).toBeInTheDocument()
    await expect(canvas.queryByText('skills/writer/')).toBeNull()
  },
}

export const WorkflowOpen: Story = {
  name: 'D8: a workflow open beside the list, with its steps by phase',
  args: { data: toolkitStates.workflowOpen.data, ui: toolkitStates.workflowOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByText('toolkit/workflows/skill-eval-round.md')).toBeVisible()
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByRole('heading', { name: 'Grade · in parallel' })).toBeVisible()
    await expect(within(flow).getByRole('heading', { name: 'Pre-registered?' })).toBeVisible()
    await expect(within(flow).getByRole('heading', { name: 'Owner decides' })).toBeVisible()
    await expect(within(flow).getByText('hides which runs had the skill')).toBeVisible()
    await expect(within(flow).getByText('new failure')).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'Open full page' })).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
    await expect(within(item).getByText('Gates in amber; G1 and G6 run after step 1.')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 2, name: 'Purpose and trigger' })).toBeVisible()
    // The workflow's row is the open one.
    await expect(canvas.getByRole('button', { name: 'skill-eval-round', current: true })).toBeVisible()
  },
}

export const SkillOpenTablet: Story = {
  name: 'T3: a skill open on a tablet, in place of the list',
  args: { data: toolkitStates.skillOpenTablet.data, ui: toolkitStates.skillOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('5 cases · open the Evals tab')).toBeVisible()
  },
}

export const SkillOpenPhone: Story = {
  name: 'M2: a skill open on the phone, in place of the list',
  args: { data: toolkitStates.skillOpenPhone.data, ui: toolkitStates.skillOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back, with icon buttons. The play
  // test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'SKILL.md' })).toBeVisible()
  },
}

export const RuleOpenTablet: Story = {
  name: 'T17: a rule open on a tablet, in place of the list',
  args: { data: toolkitStates.ruleOpenTablet.data, ui: toolkitStates.ruleOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the rule in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'rules/skills.md' })).toBeVisible()
  },
}

export const RuleOpenPhone: Story = {
  name: 'M19: a rule open on the phone, in place of the list',
  args: { data: toolkitStates.ruleOpenPhone.data, ui: toolkitStates.ruleOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the rule under Back, with icon buttons. The play
  // test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'rules/skills.md' })).toBeVisible()
  },
}

export const HookOpenTablet: Story = {
  name: 'T19: a hook open on a tablet, in place of the list',
  args: { data: toolkitStates.hookOpenTablet.data, ui: toolkitStates.hookOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the hook in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('core.hooksPath = toolkit/hooks, set by link.sh')).toBeVisible()
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
    await expect(within(item).getByText('MAX=72')).toBeVisible()
    await expect(within(item).getByText('97 lines')).toBeVisible()
  },
}

export const HookOpenPhone: Story = {
  name: 'M22: a hook open on the phone, in place of the list',
  args: { data: toolkitStates.hookOpenPhone.data, ui: toolkitStates.hookOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the hook under Back, with icon buttons and its
  // When it runs cards two by two. The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx
  // checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('test-commit-msg')).toBeVisible()
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
  },
}

export const AgentOpenTablet: Story = {
  name: 'T7: an agent open on a tablet, from the links of a skill',
  args: { data: toolkitStates.agentOpenTablet.data, ui: toolkitStates.agentOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the breadcrumb Toolkit › writer ›
  // writing-reviewer in the back row. The play test checks what every width shows.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('gets only what the task hands it')).toBeVisible()
    await expect(within(item).getByText('137 lines · the prompt')).toBeVisible()
  },
}

export const AgentOpenPhone: Story = {
  name: 'M20: an agent open on the phone, its facts in two columns',
  args: { data: toolkitStates.agentOpenPhone.data, ui: toolkitStates.agentOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the How it runs cards in two columns under
  // Back. The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('codex_effort; default model')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
  },
}

export const WorkflowOpenTablet: Story = {
  name: 'T18: a workflow open on a tablet, with its steps by phase drawn smaller',
  args: { data: toolkitStates.workflowOpenTablet.data, ui: toolkitStates.workflowOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the smaller flow under Back. The play test
  // checks what every width shows.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByText('hides which runs had the skill')).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
  },
}

export const WorkflowOpenPhone: Story = {
  name: 'M21: a workflow open on the phone, its steps left to How it works',
  args: { data: toolkitStates.workflowOpenPhone.data, ui: toolkitStates.workflowOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the workflow under Back with no flow, and the
  // line that sends the reader to How it works. The play test checks what every width shows;
  // src/app/ToolkitStickyBack.test.tsx checks the phone's rows and Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByText('toolkit/workflows/skill-eval-round.md')).toBeVisible()
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByRole('button', { name: 'Open full page' })).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
  },
}

export const SkillHowItWorks: Story = {
  name: 'D14: a skill open beside the list, on How it works',
  args: { data: toolkitStates.skillHowItWorks.data, ui: toolkitStates.skillHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'Draft the point first' })).toBeVisible()
    await expect(within(steps).getByText('until no fail')).toBeVisible()
    await expect(within(steps).getByText('writing-reviewer')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'A chat answer takes a shorter path' })).toBeVisible()
    await expect(within(item).getByText('--form chat --ste')).toBeVisible()
    // Only the selected tab's panel is drawn: the Overview's side column is not there.
    await expect(within(item).queryByText('Used in workflows')).toBeNull()
  },
}

export const RuleHowItWorks: Story = {
  name: 'D37: a rule open beside the list, on How it works',
  args: { data: toolkitStates.ruleHowItWorks.data, ui: toolkitStates.ruleHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'link.sh links it' })).toBeVisible()
    await expect(within(steps).getByText('paths:')).toBeVisible()
    // What Codex does instead takes the chat path's place.
    await expect(within(item).getByText('In Codex')).toBeVisible()
    await expect(
      within(item).getByText('Codex has no scoped rules, so skills/AGENTS.md tells the agent to read this rule.'),
    ).toBeVisible()
    // The rule's Overview is not drawn: no load box.
    await expect(within(item).queryByText('Loads when')).toBeNull()
  },
}

export const AgentHowItWorks: Story = {
  name: 'D38: an agent open beside the list, on How it works',
  args: { data: toolkitStates.agentHowItWorks.data, ui: toolkitStates.agentHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'Grade W1 to W7' })).toBeVisible()
    await expect(within(steps).getByText('ls, grep, git ls-files')).toBeVisible()
    // The only inputs it gets take the chat path's place.
    await expect(within(item).getByText('It gets only')).toBeVisible()
    // The agent's Overview is not drawn: no How it runs cards.
    await expect(within(item).queryByText('How it runs')).toBeNull()
  },
}

export const HookHowItWorks: Story = {
  name: 'D39: a hook open beside the list, on How it works',
  args: { data: toolkitStates.hookHowItWorks.data, ui: toolkitStates.hookHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    // Five steps: the fifth starts a second row.
    await expect(within(steps).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    await expect(within(steps).getByRole('heading', { name: 'Pass or block' })).toBeVisible()
    await expect(within(steps).getByText('commits-and-prs')).toBeVisible()
    await expect(within(steps).getByText('git commit')).toBeVisible()
    // Its tests take the chat path's place.
    await expect(within(item).getByText('Tests')).toBeVisible()
    await expect(
      within(item).getByText('test-commit-msg runs 43 cases through the hook. The last run passed all 43.'),
    ).toBeVisible()
    // The hook's Overview is not drawn: no When it runs cards.
    await expect(within(item).queryByText('When it runs')).toBeNull()
  },
}

export const SkillHowItWorksTablet: Story = {
  name: 'T10: a skill open on a tablet, on How it works',
  args: {
    data: toolkitStates.skillHowItWorksTablet.data,
    ui: toolkitStates.skillHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the steps in one column under Back. The play
  // test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Who reads it and what they do next.')).toBeVisible()
    await expect(within(steps).getByText('Fix every fail; run it again after an edit.')).toBeVisible()
    await expect(within(item).getByText('Loads when a task writes text that another person reads')).toBeVisible()
  },
}

export const SkillHowItWorksPhone: Story = {
  name: 'M12: a skill open on the phone, on How it works',
  args: {
    data: toolkitStates.skillHowItWorksPhone.data,
    ui: toolkitStates.skillHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the steps in one column under Back. The play
  // test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the phone's back row, title and column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Only the draft, the form and the source paths.')).toBeVisible()
    await expect(within(item).getByText('Loads when a task writes text that another person reads')).toBeVisible()
  },
}

export const RuleHowItWorksTablet: Story = {
  name: 'T36: a rule open on a tablet, on How it works',
  args: {
    data: toolkitStates.ruleHowItWorksTablet.data,
    ui: toolkitStates.ruleHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the rule's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('The rule has paths, so link.sh links it into .claude/rules/.')).toBeVisible()
    await expect(
      within(item).getByText('Loads when a file under toolkit/skills/** or skills/** changes.'),
    ).toBeVisible()
    await expect(within(item).queryByText('In Codex')).toBeNull()
  },
}

export const AgentHowItWorksTablet: Story = {
  name: 'T37: an agent open on a tablet from a skill, on How it works',
  args: {
    data: toolkitStates.agentHowItWorksTablet.data,
    ui: toolkitStates.agentHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the agent's steps in one column under its
  // header and the breadcrumb. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx
  // checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Each fail is a lead for W1. Read the sentence to confirm it.')).toBeVisible()
    await expect(
      within(item).getByText('Starts when step 7 of the writer skill runs it, or when a task asks to review a draft.'),
    ).toBeVisible()
    await expect(within(item).queryByText('It gets only')).toBeNull()
  },
}

export const HookHowItWorksTablet: Story = {
  name: 'T38: a hook open on a tablet, on How it works',
  args: {
    data: toolkitStates.hookHowItWorksTablet.data,
    ui: toolkitStates.hookHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the hook's five steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    await expect(within(steps).getByText('Exit 0 commits. Exit 1 prints one line for each problem.')).toBeVisible()
    await expect(within(item).getByText(/^Runs on every git commit in the brain/)).toBeVisible()
    // T38 draws nothing under the steps: no tests line.
    await expect(within(item).queryByText('Tests')).toBeNull()
  },
}

export const RuleHowItWorksPhone: Story = {
  name: 'M39: a rule open on the phone, on How it works',
  args: {
    data: toolkitStates.ruleHowItWorksPhone.data,
    ui: toolkitStates.ruleHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the rule's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Layout, description, evals and baselines apply to the skill.')).toBeVisible()
    await expect(within(item).queryByText('In Codex')).toBeNull()
  },
}

export const AgentHowItWorksPhone: Story = {
  name: 'M40: an agent open on the phone, on How it works',
  args: {
    data: toolkitStates.agentHowItWorksPhone.data,
    ui: toolkitStates.agentHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the agent's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('PASS, FAIL or NA for each, returned as JSON.')).toBeVisible()
  },
}

export const HookHowItWorksPhone: Story = {
  name: 'M41: a hook open on the phone, on How it works',
  args: {
    data: toolkitStates.hookHowItWorksPhone.data,
    ui: toolkitStates.hookHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the hook's five steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Exit 0 commits. Exit 1 prints one line for each problem.')).toBeVisible()
    await expect(within(item).queryByText('Tests')).toBeNull()
  },
}

export const WorkflowFullPage: Story = {
  name: 'D13: a workflow on a page of its own, with its flow and step 4 selected',
  args: { data: toolkitStates.workflowFullPage.data, ui: toolkitStates.workflowFullPage.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Workflows')
    await expect(within(item).getByText('changed 6 days ago · run by hand')).toBeVisible()
    await expect(
      within(item).getByRole('heading', { name: 'Steps · from the Mermaid flow and the steps table' }),
    ).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeVisible()
    await expect(within(item).getByRole('heading', { name: 'Step 4 · Primary grades' })).toBeVisible()
    await expect(within(item).getByText('grade.py <round> <skill> primary')).toBeVisible()
    await expect(within(item).getByText('stop: run skill-eval-cases')).toBeVisible()
    await expect(within(item).getByText('writer · round 6')).toBeVisible()
    // The page has no list beside it.
    await expect(canvas.queryByRole('button', { name: 'agents-md' })).toBeNull()
  },
}

export const WorkflowFullPageTablet: Story = {
  name: 'T08: a workflow on a page of its own on a tablet, its flow as a column of steps',
  args: {
    data: toolkitStates.workflowFullPageTablet.data,
    ui: toolkitStates.workflowFullPageTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the steps in one column under the breadcrumb.
  // The play test checks what every width shows; src/app/ToolkitWorkflowPage.test.tsx checks the tablet's column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(canvas.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Workflows')
    await expect(within(item).getByRole('button', { name: 'Pre-registered in the ledger?' })).toBeVisible()
    await expect(within(item).getByText('Each case, model and repeat. Then G1 and G6.')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeVisible()
    await expect(within(item).getByText('one more try for each group, then by hand')).toBeInTheDocument()
    // T8 has no stop box and no hint on the step's panel.
    await expect(within(item).queryByText('stop: run skill-eval-cases')).toBeNull()
    await expect(within(item).queryByText('select a step to see it')).toBeNull()
  },
}

export const WorkflowFullPagePhone: Story = {
  name: 'M09: a workflow on a page of its own on the phone, its flow as a column of steps',
  args: {
    data: toolkitStates.workflowFullPagePhone.data,
    ui: toolkitStates.workflowFullPagePhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the column under the breadcrumb Toolkit ›
  // skill-eval-round. The play test checks what every width shows; src/app/ToolkitWorkflowPage.test.tsx checks the
  // phone's breadcrumb, meta row and column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByText('Hides which runs had the skill.')).toBeVisible()
    await expect(within(item).getByText('Own family, 20 runs or more.')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Blinding' })).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeInTheDocument()
  },
}

export const SkillFiles: Story = {
  name: 'D6: a skill open beside the list, on Files',
  args: { data: toolkitStates.skillFiles.data, ui: toolkitStates.skillFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByText('Read on demand')).toBeVisible()
    await expect(within(tree).getByText('chat-sourced-first-person/')).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /check/, selected: true })).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'scripts/check' })
    await expect(within(viewer).getByText('Python · 437 lines · run, not read')).toBeVisible()
    await expect(within(viewer).getByText('Step 6 of SKILL.md runs this script on the draft.')).toBeVisible()
    // Only the selected tab's panel is drawn: the Overview's side column is not there.
    await expect(within(item).queryByText('Used in workflows')).toBeNull()
  },
}

export const ScriptExplained: Story = {
  name: 'D10: a skill’s script explained, on Files',
  args: { data: toolkitStates.scriptExplained.data, ui: toolkitStates.scriptExplained.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    const viewer = within(item).getByRole('region', { name: 'scripts/check' })
    // A script with an explanation opens on Explain: the overview, the walkthrough and who wrote it.
    await expect(within(viewer).getByRole('radio', { name: 'Explain' })).toBeChecked()
    await expect(within(viewer).getByText('437 lines')).toBeVisible()
    await expect(within(viewer).getByText('0 pass · 1 a rule fails · 2 bad input')).toBeVisible()
    await expect(within(viewer).getByText('Exit 1 if any file has a fail. Otherwise exit 0.')).toBeVisible()
    await expect(within(viewer).getByText(/^Written by Claude from this version of the file/)).toBeVisible()
    await expect(within(viewer).queryByText('#!/usr/bin/env python3')).toBeNull()
    // Each step links to its line; the play test does not press one, so the render stays on Explain (the fidelity
    // check draws the story after its play). src/app/ToolkitFiles.test.tsx presses the switch and the links.
    await expect(within(viewer).getByRole('button', { name: 'line 433' })).toBeVisible()
  },
}

export const RuleFiles: Story = {
  name: 'D33: a rule open beside the list, on Files',
  args: { data: toolkitStates.ruleFiles.data, ui: toolkitStates.ruleFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // A rule is one file: the tree has its one row, selected, with what it is.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByRole('treeitem', { name: /skills\.md/, selected: true })).toBeVisible()
    await expect(
      within(tree).getByText('The rule. Claude Code loads it by the paths in its frontmatter.'),
    ).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'skills.md' })
    await expect(within(viewer).getByText('Markdown · 104 lines · the rule')).toBeVisible()
    // The file's first lines as written: the paths frontmatter, then the rule's text.
    await expect(within(viewer).getByText(/^\s*- "toolkit\/skills\/\*\*"$/)).toBeVisible()
    await expect(
      within(viewer).getByText('Loads when a file under toolkit/skills/** or skills/** changes.'),
    ).toBeVisible()
  },
}

export const AgentFiles: Story = {
  name: 'D34: an agent open beside the list, on Files',
  args: { data: toolkitStates.agentFiles.data, ui: toolkitStates.agentFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // An agent is one file, its prompt: the tree has its one row, selected, with what it is.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByRole('treeitem', { name: /writing-reviewer\.md/, selected: true })).toBeVisible()
    await expect(within(tree).getByText('The prompt. Its model and tools are in the frontmatter.')).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'writing-reviewer.md' })
    await expect(within(viewer).getByText('Markdown · 137 lines · the prompt')).toBeVisible()
    // The frontmatter holds the model and the tools.
    await expect(within(viewer).getByText('model: opus')).toBeVisible()
    await expect(within(viewer).getByText('tools: Bash, Read, Grep, Glob')).toBeVisible()
    await expect(
      within(viewer).getByText(
        'Step 7 of the writer skill starts this agent with the draft, the form and the sources.',
      ),
    ).toBeVisible()
  },
}
